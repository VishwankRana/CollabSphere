export default function ProblemPanel({
  collapsed = false,
  onToggleCollapsed,
  problem = {},
  testCases = [],
}) {
  const examples = problem.examples || [];

  return (
    <aside className={`interview-problem-panel${collapsed ? " is-collapsed" : ""}`}>
      <div className="interview-problem-header">
        <div>
          <p className="panel-kicker">Problem</p>
          <h2>{problem.title || "Coding challenge"}</h2>
        </div>
        <button type="button" className="btn-ghost btn-icon" onClick={onToggleCollapsed}>
          {collapsed ? ">" : "<"}
        </button>
      </div>

      {!collapsed ? (
        <div className="interview-problem-body">
          {problem.description ? (
            <div className="interview-problem-section">
              <h3>Description</h3>
              <p>{problem.description}</p>
            </div>
          ) : (
            <p className="hero-copy">No problem description was provided for this room.</p>
          )}

          {problem.constraints ? (
            <div className="interview-problem-section">
              <h3>Constraints</h3>
              <p>{problem.constraints}</p>
            </div>
          ) : null}

          {examples.length ? (
            <div className="interview-problem-section">
              <h3>Examples</h3>
              <ul className="interview-problem-examples">
                {examples.map((example, index) => (
                  <li key={`example-${index}`}>
                    <strong>Example {index + 1}</strong>
                    <p>
                      <span>Input</span>
                      <pre>{example.input || "(empty)"}</pre>
                    </p>
                    <p>
                      <span>Output</span>
                      <pre>{example.output || "(empty)"}</pre>
                    </p>
                    {example.explanation ? <p>{example.explanation}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {testCases.length ? (
            <div className="interview-problem-section">
              <h3>Test cases</h3>
              <ul className="interview-problem-testcases">
                {testCases.map((testCase, index) => (
                  <li key={`test-${index}`}>
                    <strong>
                      Case {index + 1}
                      {testCase.isHidden ? " (hidden)" : ""}
                    </strong>
                    <p>
                      <span>Input</span>
                      <pre>{testCase.input || "(empty)"}</pre>
                    </p>
                    <p>
                      <span>Expected</span>
                      <pre>{testCase.expectedOutput || "(empty)"}</pre>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
