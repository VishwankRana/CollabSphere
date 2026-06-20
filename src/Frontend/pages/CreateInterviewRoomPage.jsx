import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Video } from "lucide-react";

import { useAuth } from "../auth/useAuth.jsx";
import IconLabel from "../components/IconLabel";
import LanguageSelector from "../components/LanguageSelector";
import { apiRequest } from "../lib/api";

const EMPTY_TEST_CASE = {
  input: "",
  expectedOutput: "",
  isHidden: false,
};

export default function CreateInterviewRoomPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [constraints, setConstraints] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [testCases, setTestCases] = useState([{ ...EMPTY_TEST_CASE }]);
  const [showTestCases, setShowTestCases] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
          },
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
          <p className="cs-page-subtitle">
            Set up a coding room and invite your candidate.
          </p>

          <form className="interview-create-form" onSubmit={handleSubmit}>
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
              <button
                className="btn-ghost"
                type="button"
                onClick={() => setShowTestCases(true)}
              >
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
