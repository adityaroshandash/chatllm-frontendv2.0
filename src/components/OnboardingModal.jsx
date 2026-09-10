import { useState } from "react";

export default function OnboardingModal({ onSubmit }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      setError("Both fields are required.");
      return;
    }
    onSubmit({ username: username.trim(), email: email.trim() });
  }

  return (
    <div className="onboarding">
      <form className="onboarding-card" onSubmit={handleSubmit}>
        <h1>Welcome to Wire</h1>
        <p>
          Tell us who you are before you start chatting. This is stored on
          this device and sent once to create your account.
        </p>
        <label>
          Name
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ada Lovelace"
            autoFocus
          />
        </label>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ada@example.com"
            type="email"
          />
        </label>
        {error && <p className="onboarding-error">{error}</p>}
        <button type="submit">Continue</button>
      </form>
    </div>
  );
}
