import { useState } from "react";
import { signInWithGoogle } from "../lib/firebase.js";

export default function OnboardingModal({ loading, onSignedIn }) {
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const result = await signInWithGoogle();
      onSignedIn(result.user);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google sign-in failed.");
      }
    }
  }

  return (
    <div className="onboarding">
      <form className="onboarding-card" onSubmit={handleSubmit}>
        <h1>Welcome to Wire</h1>
        <p>
          Sign in with Google to keep your chats connected to your account.
        </p>
        {error && <p className="onboarding-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Checking session…" : "Continue with Google"}
        </button>
      </form>
    </div>
  );
}
