import { Link } from "react-router-dom";

export default function InterviewEndedPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="panel-kicker">Interview complete</p>
        <h1>Interview ended</h1>
        <p className="hero-copy">
          The interviewer has concluded this session. Thank you for participating.
        </p>
        <Link className="comment-submit" to="/">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
