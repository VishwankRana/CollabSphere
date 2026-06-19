export default function CodeOutputPanel({
  isRunning = false,
  result = null,
  testResults = null,
  stdin = "",
  onStdinChange,
  readOnly = false,
}) {
  const hasTestResults = Array.isArray(testResults) && testResults.length > 0;
  const passedCount = hasTestResults
    ? testResults.filter((entry) => entry.passed).length
    : 0;

  return (
    <section className="code-output-panel">
      <div className="code-output-header">
        <p className="panel-kicker">Output</p>
        {isRunning ? <span className="code-output-status">Running...</span> : null}
        {hasTestResults ? (
          <span className="code-output-status">
            {passedCount}/{testResults.length} tests passed
          </span>
        ) : null}
      </div>

      {!readOnly ? (
        <label className="code-output-stdin">
          <span>Standard input (optional)</span>
          <textarea
            value={stdin}
            onChange={(event) => onStdinChange?.(event.target.value)}
            placeholder="Input passed to your program on Run"
            rows={2}
          />
        </label>
      ) : null}

      {hasTestResults ? (
        <ul className="code-test-results">
          {testResults.map((entry, index) => (
            <li
              key={`test-${index}`}
              className={entry.passed ? "code-test-pass" : "code-test-fail"}
            >
              <strong>
                Test {index + 1}: {entry.passed ? "Passed" : "Failed"}
                {entry.isHidden ? " (hidden)" : ""}
              </strong>
              {entry.isHidden && !entry.input && !entry.actualOutput ? null : (
                <div className="code-test-details">
                  {entry.input !== undefined ? (
                    <p>
                      <span>Input</span>
                      <pre>{entry.input || "(empty)"}</pre>
                    </p>
                  ) : null}
                  {entry.expectedOutput !== undefined ? (
                    <p>
                      <span>Expected</span>
                      <pre>{entry.expectedOutput || "(empty)"}</pre>
                    </p>
                  ) : null}
                  {entry.actualOutput !== undefined ? (
                    <p>
                      <span>Actual</span>
                      <pre>{entry.actualOutput || "(empty)"}</pre>
                    </p>
                  ) : null}
                  {entry.stderr ? (
                    <p>
                      <span>Stderr</span>
                      <pre className="code-output-stderr">{entry.stderr}</pre>
                    </p>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {result ? (
        <div className="code-output-body">
          {result.stdout ? (
            <div className="code-output-block">
              <span>Stdout</span>
              <pre>{result.stdout}</pre>
            </div>
          ) : null}
          {result.stderr ? (
            <div className="code-output-block">
              <span>Stderr</span>
              <pre className="code-output-stderr">{result.stderr}</pre>
            </div>
          ) : null}
          {!result.stdout && !result.stderr && !isRunning ? (
            <p className="hero-copy">No output.</p>
          ) : null}
          {result.executionTime !== undefined ? (
            <p className="code-output-meta">
              Exit code: {result.exitCode ?? 0} · {result.executionTime}ms
              {result.timedOut ? " · Timed out" : ""}
            </p>
          ) : null}
        </div>
      ) : !hasTestResults && !isRunning ? (
        <p className="hero-copy">Run your code to see output here.</p>
      ) : null}
    </section>
  );
}
