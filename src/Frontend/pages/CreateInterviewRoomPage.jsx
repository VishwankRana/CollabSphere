import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth.jsx";
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
    <main className="interview-dashboard-shell">
      <section className="interview-dashboard-header">
        <div>
          <p className="panel-kicker">New interview</p>
          <h1>Create interview room</h1>
          <p className="hero-copy">
            Set up the problem details, language, and optional test cases before inviting a
            candidate.
          </p>
        </div>

        <Link className="hero-link-button" to="/">
          Back to dashboard
        </Link>
      </section>

      <form className="analytics-panel interview-create-form" onSubmit={handleSubmit}>
        <label className="interview-form-field">
          <span>Room title</span>
          <input
            className="comment-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Senior Frontend Interview - Alex"
            required
          />
        </label>

        <label className="interview-form-field">
          <span>Problem title</span>
          <input
            className="comment-input"
            value={problemTitle}
            onChange={(event) => setProblemTitle(event.target.value)}
            placeholder="Two Sum"
          />
        </label>

        <label className="interview-form-field">
          <span>Problem description</span>
          <textarea
            className="comment-input"
            value={problemDescription}
            onChange={(event) => setProblemDescription(event.target.value)}
            placeholder="Describe the challenge for the candidate..."
            rows={6}
          />
        </label>

        <label className="interview-form-field">
          <span>Constraints</span>
          <textarea
            className="comment-input"
            value={constraints}
            onChange={(event) => setConstraints(event.target.value)}
            placeholder="Time and space limits, input ranges..."
            rows={3}
          />
        </label>

        <LanguageSelector value={language} onChange={setLanguage} />

        <div className="interview-form-field">
          <div className="interview-form-field-header">
            <span>Test cases</span>
            <button className="hero-link-button" type="button" onClick={addTestCase}>
              Add test case
            </button>
          </div>

          {testCases.map((testCase, index) => (
            <div className="interview-testcase-card" key={`test-case-${index}`}>
              <strong>Test case {index + 1}</strong>
              <textarea
                className="comment-input"
                value={testCase.input}
                onChange={(event) => updateTestCase(index, "input", event.target.value)}
                placeholder="Input"
                rows={2}
              />
              <textarea
                className="comment-input"
                value={testCase.expectedOutput}
                onChange={(event) =>
                  updateTestCase(index, "expectedOutput", event.target.value)
                }
                placeholder="Expected output"
                rows={2}
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
              {testCases.length > 1 ? (
                <button
                  className="hero-link-button"
                  type="button"
                  onClick={() => removeTestCase(index)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {error ? <p className="access-message">{error}</p> : null}

        <button className="comment-submit" disabled={submitting} type="submit">
          {submitting ? "Creating..." : "Create room"}
        </button>
      </form>
    </main>
  );
}
