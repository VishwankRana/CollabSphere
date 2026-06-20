import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../auth/useAuth.jsx";
import { apiRequest } from "../lib/api";

export default function JoinInterviewPage() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!inviteToken || !token) {
      return undefined;
    }

    let ignore = false;

    apiRequest(`/api/rooms/join/${inviteToken}`, {
      method: "POST",
      token,
    })
      .then((data) => {
        if (ignore) {
          return;
        }

        navigate(`/rooms/${data.room.id}`, { replace: true });
      })
      .catch((requestError) => {
        if (ignore) {
          return;
        }

        setError(requestError.message);
      });

    return () => {
      ignore = true;
    };
  }, [inviteToken, navigate, token]);

  if (error) {
    return (
      <main className="auth-shell">
        <section className="auth-card cs-join-card">
          <Link className="cs-logo" to="/">
            <span className="cs-logo-dot" aria-hidden="true" />
            <span className="font-display">CodeScreen</span>
          </Link>
          <h1>Unable to join</h1>
          <p className="hero-copy">{error}</p>
          <Link className="btn-primary" to="/">
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-card cs-join-card">
        <Link className="cs-logo" to="/">
          <span className="cs-logo-dot" aria-hidden="true" />
          <span className="font-display">CodeScreen</span>
        </Link>
        <p className="hero-copy">You&apos;ve been invited to a coding interview</p>

        {isAuthenticated ? (
          <p className="hero-copy">
            Joining as <strong>{user?.name}</strong>
          </p>
        ) : null}

        <div className="cs-join-loading">
          <span className="cs-spinner" aria-hidden="true" />
          <span>Joining interview room...</span>
        </div>
      </section>
    </main>
  );
}
