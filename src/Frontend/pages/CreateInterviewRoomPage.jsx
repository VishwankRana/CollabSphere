import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Edit3, Plus, Video } from "lucide-react";

import { useAuth } from "../auth/useAuth.jsx";
import IconLabel from "../components/IconLabel";
import LanguageSelector from "../components/LanguageSelector";
import { apiRequest } from "../lib/api";
import {
  buildQuestionsQuery,
  questionToRoomPayload,
} from "../lib/questionBank";

const EMPTY_TEST_CASE = {
  input: "",
  expectedOutput: "",
  isHidden: false,
};

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

function applyQuestionData(question, setters) {
  const payload = questionToRoomPayload(question);

  setters.setProblemTitle(payload.problemTitle);
  setters.setProblemDescription(payload.problemDescription);
  setters.setDifficulty(payload.difficulty);
  setters.setConstraints(payload.constraints);
  setters.setStarterCode(payload.starterCode);
  setters.setExamples(question.examples || []);
  setters.setTestCases(
    payload.testCases.length ? payload.testCases : [{ ...EMPTY_TEST_CASE }]
  );
  setters.setShowTestCases(payload.testCases.length > 0);
  setters.setSelectedQuestionId(question.id);
}

export default function CreateInterviewRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();

  const [startMode, setStartMode] = useState("bank");
  const [bankSearch, setBankSearch] = useState("");
  const [bankDifficulty, setBankDifficulty] = useState("");
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  const [title, setTitle] = useState("");
  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [constraints, setConstraints] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [language, setLanguage] = useState("javascript");
  const [starterCode, setStarterCode] = useState({});
  const [examples, setExamples] = useState([]);
  const [testCases, setTestCases] = useState([{ ...EMPTY_TEST_CASE }]);
  const [showTestCases, setShowTestCases] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const setters = {
    setProblemTitle,
    setProblemDescription,
    setDifficulty,
    setConstraints,
    setStarterCode,
    setExamples,
    setTestCases,
    setShowTestCases,
    setSelectedQuestionId,
  };

  useEffect(() => {
    if (location.state?.question) {
      applyQuestionData(location.state.question, setters);
      setStartMode("custom");
    }
  }, [location.state]);

  useEffect(() => {
    if (startMode !== "bank" || !token) {
      return;
    }

    let ignore = false;
    setBankLoading(true);

    const query = buildQuestionsQuery({
      search: bankSearch.trim(),
      difficulty: bankDifficulty || undefined,
      limit: 20,
    });

    apiRequest(`/api/questions${query}`, { token })
      .then((data) => {
        if (!ignore) {
          setBankQuestions(data.questions || []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setBankQuestions([]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setBankLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [bankDifficulty, bankSearch, startMode, token]);

  function updateTestCase(index, field, value) {
    setTestCases((current) =>
      current.map((testCase, testIndex) =>
        testIndex === index ? { ...testCase, [field]: value } : testCase
      )
    );
  }

  function addTestCase() {
    setTestCases((current) => [...current, { ...EMPTY_TEST_CASE }]);
  }

  function removeTestCase(index) {
    setTestCases((current) => current.filter((_, testIndex) => testIndex !== index));
  }

  async function handleSelectQuestion(question) {
    try {
      await apiRequest(`/api/questions/${question.id}/use`, { method: "POST", token });
      applyQuestionData(question, setters);
      setStartMode("custom");

      if (!title.trim()) {
        setTitle(`${question.title} Interview`);
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const cleanedTestCases = testCases
        .filter(
          (testCase) => testCase.input.trim() || testCase.expectedOutput.trim()
        )
        .map((testCase) => ({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          isHidden: Boolean(testCase.isHidden),
        }));

      const data = await apiRequest("/api/rooms", {
        method: "POST",
        token,
        body: {
          title: title.trim(),
          language,
          problem: {
            title: problemTitle.trim(),
            description: problemDescription.trim(),
            constraints: constraints.trim(),
            difficulty,
            examples: (examples || []).map((example) => ({
              input: example.input || "",
              output: example.output || "",
              explanation: example.explanation || "",
            })),
          },
          starterCode: Object.keys(starterCode).length ? starterCode : undefined,
          testCases: cleanedTestCases,
        },
      });

      navigate(`/rooms/${data.room.id}`);
    } catch (requestError) {
      setError(requestError.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="cs-create-shell">
      <section className="cs-create-card">
        <h1 className="font-display">New Interview</h1>
        <p className="cs-page-subtitle">Set up a coding room and invite your candidate.</p>

        <form className="interview-create-form" onSubmit={handleSubmit}>
          <div className="qb-start-toggle">
            <span className="qb-filter-label">Start from</span>
            <div className="qb-filter-chips">
              <button
                type="button"
                className={`filter-chip${startMode === "bank" ? " active" : ""}`}
                onClick={() => setStartMode("bank")}
              >
                <IconLabel icon={BookOpen} size={14}>
                  Question Bank
                </IconLabel>
              </button>
              <button
                type="button"
                className={`filter-chip${startMode === "custom" ? " active" : ""}`}
                onClick={() => setStartMode("custom")}
              >
                <IconLabel icon={Edit3} size={14}>
                  Custom Problem
                </IconLabel>
              </button>
            </div>
          </div>

          {startMode === "bank" ? (
            <div className="qb-inline-picker">
              <input
                className="comment-input"
                value={bankSearch}
                onChange={(event) => setBankSearch(event.target.value)}
                placeholder="Search questions..."
              />
              <div className="qb-filter-chips">
                {["", "Easy", "Medium", "Hard"].map((value) => (
                  <button
                    key={value || "all"}
                    type="button"
                    className={`filter-chip${bankDifficulty === value ? " active" : ""}${
                      value ? ` ${value.toLowerCase()}` : ""
                    }`}
                    onClick={() => setBankDifficulty(value)}
                  >
                    {value || "All"}
                  </button>
                ))}
              </div>
              <div className="qb-inline-picker-list">
                {bankLoading ? (
                  <p className="hero-copy">Loading questions...</p>
                ) : bankQuestions.length ? (
                  bankQuestions.map((question) => (
                    <div className="qb-inline-picker-row" key={question.id}>
                      <div>
                        <strong>{question.title}</strong>
                        <span className="cs-table-meta">
                          {question.difficulty} · {(question.tags || []).slice(0, 2).join(", ")}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleSelectQuestion(question)}
                      >
                        Select
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="hero-copy">No questions match your search.</p>
                )}
              </div>
            </div>
          ) : null}

          {selectedQuestionId ? (
            <p className="hero-copy qb-selected-note">
              Loaded from Question Bank. You can edit any field below before creating the room.
            </p>
          ) : null}

          <label className="interview-form-field">
            <span>Title</span>
            <input
              className="comment-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Senior Frontend — Priya Sharma"
              required
            />
          </label>

          <label className="interview-form-field">
            <span>Problem</span>
            <input
              className="comment-input"
              value={problemTitle}
              onChange={(event) => setProblemTitle(event.target.value)}
              placeholder="e.g. Two Sum"
            />
          </label>

          <div className="interview-form-field">
            <span>Difficulty</span>
            <div className="cs-difficulty-toggle" role="radiogroup" aria-label="Problem difficulty">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`cs-difficulty-toggle-btn cs-difficulty-toggle-btn--${option.value}${
                    difficulty === option.value ? " is-active" : ""
                  }`}
                  role="radio"
                  aria-checked={difficulty === option.value}
                  onClick={() => setDifficulty(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="interview-form-field">
            <span>Problem description</span>
            <textarea
              className="comment-input font-mono cs-mono-input"
              value={problemDescription}
              onChange={(event) => setProblemDescription(event.target.value)}
              placeholder="Describe the problem statement, examples, and constraints..."
              rows={8}
            />
          </label>

          <label className="interview-form-field">
            <span>Constraints</span>
            <textarea
              className="comment-input font-mono cs-mono-input"
              value={constraints}
              onChange={(event) => setConstraints(event.target.value)}
              placeholder="Time and space limits, input ranges..."
              rows={3}
            />
          </label>

          <div className="interview-form-field">
            <span>Language</span>
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>

          {!showTestCases ? (
            <button className="btn-ghost" type="button" onClick={() => setShowTestCases(true)}>
              <IconLabel icon={Plus} size={14}>
                Add test cases
              </IconLabel>
            </button>
          ) : (
            <div className="interview-form-field">
              <div className="interview-form-field-header">
                <span>Test cases</span>
                <button className="btn-ghost" type="button" onClick={addTestCase}>
                  + Add test case
                </button>
              </div>

              {testCases.map((testCase, index) => (
                <div className="interview-testcase-card" key={`test-case-${index}`}>
                  <div className="interview-form-field-header">
                    <strong>Case {index + 1}</strong>
                    {testCases.length > 1 ? (
                      <button
                        className="btn-ghost"
                        type="button"
                        onClick={() => removeTestCase(index)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <input
                    className="comment-input font-mono cs-mono-input"
                    value={testCase.input}
                    onChange={(event) => updateTestCase(index, "input", event.target.value)}
                    placeholder="Input"
                  />
                  <input
                    className="comment-input font-mono cs-mono-input"
                    value={testCase.expectedOutput}
                    onChange={(event) =>
                      updateTestCase(index, "expectedOutput", event.target.value)
                    }
                    placeholder="Expected output"
                  />
                  <label className="interview-checkbox">
                    <input
                      checked={testCase.isHidden}
                      type="checkbox"
                      onChange={(event) =>
                        updateTestCase(index, "isHidden", event.target.checked)
                      }
                    />
                    Hidden from candidate
                  </label>
                </div>
              ))}
            </div>
          )}

          {error ? <p className="access-message">{error}</p> : null}

          <div className="divider" />

          <div className="cs-form-footer">
            <Link className="btn-secondary" to="/">
              <IconLabel icon={ArrowLeft} size={14}>
                Cancel
              </IconLabel>
            </Link>
            <button className="btn-primary" disabled={submitting} type="submit">
              <IconLabel icon={Video} size={16}>
                {submitting ? "Creating..." : "Create Room & Get Invite Link"}
              </IconLabel>
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
