import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth.jsx";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(form);
      navigate("/", { replace: true });
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="cs-logo" to="/">
          <span className="cs-logo-dot" aria-hidden="true" />
          <span className="font-display">CodeScreen</span>
        </Link>
        <h1>Welcome back</h1>
        <p className="hero-copy">Log in to run and manage coding interviews.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="comment-input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
          />
          <input
            className="comment-input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
          />
          <button className="btn-primary" disabled={submitting} type="submit">
            {submitting ? "Logging in..." : "Log in"}
          </button>
          {error ? <p className="access-message">{error}</p> : null}
        </form>

        <p className="auth-link">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
