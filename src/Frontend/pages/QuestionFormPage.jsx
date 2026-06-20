import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { ArrowLeft, Plus, X } from "lucide-react";

import { useAuth } from "../auth/useAuth.jsx";
import IconLabel from "../components/IconLabel";
import { apiRequest } from "../lib/api";
import { applyCodescreenMonacoTheme } from "../lib/monacoTheme";
import {
  DIFFICULTY_OPTIONS,
  QUESTION_TAGS,
  STARTER_STUBS,
} from "../lib/questionBank";
import { MONACO_LANGUAGE_IDS } from "../lib/interview";

const EMPTY_EXAMPLE = { input: "", output: "", explanation: "" };
const EMPTY_TEST_CASE = { input: "", expectedOutput: "", isHidden: false };
const LANGUAGE_TABS = [
  { key: "javascript", label: "JavaScript" },
  { key: "python", label: "Python" },
  { key: "java", label: "Java" },
  { key: "cpp", label: "C++" },
];

export default function QuestionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [tags, setTags] = useState([]);
  const [description, setDescription] = useState("");
  const [descriptionTab, setDescriptionTab] = useState("write");
  const [examples, setExamples] = useState([{ ...EMPTY_EXAMPLE }]);
  const [constraints, setConstraints] = useState([""]);
  const [starterCode, setStarterCode] = useState({ ...STARTER_STUBS });
  const [starterLanguage, setStarterLanguage] = useState("javascript");
  const [testCases, setTestCases] = useState([{ ...EMPTY_TEST_CASE }]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!isEdit || !token) {
      return;
    }

    apiRequest(`/api/questions/${id}`, { token })
      .then((data) => {
        const question = data.question;
        setTitle(question.title || "");
        setDifficulty(question.difficulty || "Medium");
        setTags(question.tags || []);
        setDescription(question.description || "");
        setExamples(question.examples?.length ? question.examples : [{ ...EMPTY_EXAMPLE }]);
        setConstraints(question.constraints?.length ? question.constraints : [""]);
        setStarterCode({ ...STARTER_STUBS, ...question.starterCode });
        setTestCases(question.testCases?.length ? question.testCases : [{ ...EMPTY_TEST_CASE }]);
        setLoading(false);
      })
      .catch((requestError) => {
        setError(requestError.message);
        setLoading(false);
      });
  }, [id, isEdit, token]);

  function toggleTag(tag) {
    setTags((current) =>
      current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !description.trim() || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      title: title.trim(),
      difficulty,
      tags,
      description: description.trim(),
      examples: examples.filter((example) => example.input.trim() || example.output.trim()),
      constraints: constraints.map((line) => line.trim()).filter(Boolean),
      starterCode,
      testCases: testCases
        .filter((testCase) => testCase.input.trim() || testCase.expectedOutput.trim())
        .map((testCase) => ({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          isHidden: Boolean(testCase.isHidden),
        })),
    };

    try {
      if (isEdit) {
        await apiRequest(`/api/questions/${id}`, { method: "PUT", token, body: payload });
      } else {
        await apiRequest("/api/questions", { method: "POST", token, body: payload });
      }

      setToast("Problem saved to your Question Bank");
      window.setTimeout(() => navigate("/question-bank"), 600);
    } catch (requestError) {
      setError(requestError.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="auth-shell">Loading question...</main>;
  }

  return (
    <main className="qb-form-shell">
      {toast ? (
        <div className="cs-toast" role="status">
          {toast}
        </div>
      ) : null}

      <div className="qb-form-header page-section">
        <Link className="cs-back-link" to="/question-bank">
          <IconLabel icon={ArrowLeft} size={14}>
            Question Bank
          </IconLabel>
        </Link>
        <h1 className="font-display">{isEdit ? "Edit Problem" : "New Problem"}</h1>
      </div>

      <form className="qb-form page-section" onSubmit={handleSubmit}>
        <section className="qb-form-section">
          <h2>Basics</h2>
          <label className="interview-form-field">
            <span>Title *</span>
            <input
              className="comment-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>

          <div className="interview-form-field">
            <span>Difficulty *</span>
            <div className="cs-difficulty-toggle" role="radiogroup" aria-label="Difficulty">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`cs-difficulty-toggle-btn cs-difficulty-toggle-btn--${option.toLowerCase()}${
                    difficulty === option ? " is-active" : ""
                  }`}
                  onClick={() => setDifficulty(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="interview-form-field">
            <span>Tags</span>
            <div className="qb-tag-picker">
              {QUESTION_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`filter-chip${tags.includes(tag) ? " active" : ""}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {tags.includes(tag) ? " ×" : ""}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="qb-form-section">
          <div className="qb-form-section-header">
            <h2>Problem Statement</h2>
            <div className="qb-tab-toggle">
              <button
                type="button"
                className={`filter-chip${descriptionTab === "write" ? " active" : ""}`}
                onClick={() => setDescriptionTab("write")}
              >
                Write
              </button>
              <button
                type="button"
                className={`filter-chip${descriptionTab === "preview" ? " active" : ""}`}
                onClick={() => setDescriptionTab("preview")}
              >
                Preview
              </button>
            </div>
          </div>

          {descriptionTab === "write" ? (
            <textarea
              className="comment-input font-mono cs-mono-input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={10}
              required
            />
          ) : (
            <div className="qb-markdown-preview">{description || "Nothing to preview yet."}</div>
          )}
        </section>

        <section className="qb-form-section">
          <h2>Examples</h2>
          {examples.map((example, index) => (
            <div className="interview-testcase-card" key={`example-${index}`}>
              <div className="interview-form-field-header">
                <strong>Example {index + 1}</strong>
                {examples.length > 1 ? (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() =>
                      setExamples((current) => current.filter((_, idx) => idx !== index))
                    }
                  >
                    <IconLabel icon={X} size={14}>
                      Remove
                    </IconLabel>
                  </button>
                ) : null}
              </div>
              <input
                className="comment-input font-mono cs-mono-input"
                value={example.input}
                onChange={(event) =>
                  setExamples((current) =>
                    current.map((entry, idx) =>
                      idx === index ? { ...entry, input: event.target.value } : entry
                    )
                  )
                }
                placeholder="Input *"
              />
              <input
                className="comment-input font-mono cs-mono-input"
                value={example.output}
                onChange={(event) =>
                  setExamples((current) =>
                    current.map((entry, idx) =>
                      idx === index ? { ...entry, output: event.target.value } : entry
                    )
                  )
                }
                placeholder="Output *"
              />
              <input
                className="comment-input"
                value={example.explanation}
                onChange={(event) =>
                  setExamples((current) =>
                    current.map((entry, idx) =>
                      idx === index ? { ...entry, explanation: event.target.value } : entry
                    )
                  )
                }
                placeholder="Explanation (optional)"
              />
            </div>
          ))}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setExamples((current) => [...current, { ...EMPTY_EXAMPLE }])}
          >
            <IconLabel icon={Plus} size={14}>
              Add Example
            </IconLabel>
          </button>
        </section>

        <section className="qb-form-section">
          <h2>Constraints</h2>
          {constraints.map((line, index) => (
            <div className="qb-constraint-row" key={`constraint-${index}`}>
              <input
                className="comment-input font-mono cs-mono-input"
                value={line}
                onChange={(event) =>
                  setConstraints((current) =>
                    current.map((entry, idx) => (idx === index ? event.target.value : entry))
                  )
                }
                placeholder="Constraint"
              />
              {constraints.length > 1 ? (
                <button
                  type="button"
                  className="btn-ghost btn-icon"
                  aria-label="Remove constraint"
                  onClick={() =>
                    setConstraints((current) => current.filter((_, idx) => idx !== index))
                  }
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setConstraints((current) => [...current, ""])}
          >
            <IconLabel icon={Plus} size={14}>
              Add Constraint
            </IconLabel>
          </button>
        </section>

        <section className="qb-form-section">
          <h2>Starter Code</h2>
          <div className="qb-tab-toggle">
            {LANGUAGE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`filter-chip${starterLanguage === tab.key ? " active" : ""}`}
                onClick={() => setStarterLanguage(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="qb-monaco-snippet">
            <Editor
              height="220px"
              language={MONACO_LANGUAGE_IDS[starterLanguage] || "javascript"}
              value={starterCode[starterLanguage] || ""}
              onChange={(value) =>
                setStarterCode((current) => ({ ...current, [starterLanguage]: value || "" }))
              }
              onMount={(_editor, monaco) => applyCodescreenMonacoTheme(monaco)}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 12,
                wordWrap: "on",
              }}
              theme="codescreen-dark"
            />
          </div>
        </section>

        <section className="qb-form-section">
          <h2>Test Cases</h2>
          {testCases.map((testCase, index) => (
            <div className="interview-testcase-card" key={`test-${index}`}>
              <div className="interview-form-field-header">
                <strong>Case {index + 1}</strong>
                <div className="qb-testcase-actions">
                  <label className="interview-checkbox">
                    <input
                      checked={testCase.isHidden}
                      type="checkbox"
                      onChange={(event) =>
                        setTestCases((current) =>
                          current.map((entry, idx) =>
                            idx === index ? { ...entry, isHidden: event.target.checked } : entry
                          )
                        )
                      }
                    />
                    Hide from candidate
                  </label>
                  {testCases.length > 1 ? (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() =>
                        setTestCases((current) => current.filter((_, idx) => idx !== index))
                      }
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              <input
                className="comment-input font-mono cs-mono-input"
                value={testCase.input}
                onChange={(event) =>
                  setTestCases((current) =>
                    current.map((entry, idx) =>
                      idx === index ? { ...entry, input: event.target.value } : entry
                    )
                  )
                }
                placeholder="Input *"
              />
              <input
                className="comment-input font-mono cs-mono-input"
                value={testCase.expectedOutput}
                onChange={(event) =>
                  setTestCases((current) =>
                    current.map((entry, idx) =>
                      idx === index ? { ...entry, expectedOutput: event.target.value } : entry
                    )
                  )
                }
                placeholder="Expected Output *"
              />
            </div>
          ))}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setTestCases((current) => [...current, { ...EMPTY_TEST_CASE }])}
          >
            <IconLabel icon={Plus} size={14}>
              Add Test Case
            </IconLabel>
          </button>
          <p className="hero-copy qb-form-note">
            Hidden test cases are not visible to candidates during the interview but are run when
            executing code.
          </p>
        </section>

        {error ? <p className="access-message">{error}</p> : null}

        <div className="qb-form-footer">
          <Link className="btn-secondary" to="/question-bank">
            Cancel
          </Link>
          <button className="btn-primary" disabled={submitting} type="submit">
            {submitting ? "Saving..." : "Save Problem"}
          </button>
        </div>
      </form>
    </main>
  );
}
