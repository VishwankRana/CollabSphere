import { Link } from "react-router-dom";

export default function InterviewEndedPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="cs-logo" to="/">
          <span className="cs-logo-dot" aria-hidden="true" />
          <span className="font-display">CodeScreen</span>
        </Link>
        <h1>Interview ended</h1>
        <p className="hero-copy">
          The interviewer has concluded this session. Thank you for participating.
        </p>
        <Link className="btn-primary" to="/">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
