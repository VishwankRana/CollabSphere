import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../auth/useAuth.jsx";
import { apiRequest } from "../lib/api";

export default function JoinInterviewPage() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
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
        <section className="auth-card">
          <h1>Unable to join</h1>
          <p className="hero-copy">{error}</p>
          <Link className="comment-submit" to="/">
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return <main className="auth-shell">Joining interview room...</main>;
}
