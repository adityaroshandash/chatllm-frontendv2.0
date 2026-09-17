import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { profileFromFirebaseUser } from "./lib/user.js";
import { subscribeToAuth } from "./lib/firebase.js";
import { initUser, listSessions, createSession, getMessages, chatStream } from "./lib/api.js";
import Sidebar from "./components/Sidebar.jsx";
import OnboardingModal from "./components/OnboardingModal.jsx";


const GREETING = {
  sender: "bot",
  text: "I'm Wire. Ask about anything happening right now and I'll check the wire feeds before answering.",
  sources: [],
};

function updateLast(list, fn) {
  const copy = [...list];
  copy[copy.length - 1] = fn(copy[copy.length - 1]);
  return copy;
}

export default function App() {
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSID, setActiveSID] = useState(null);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const threadRef = useRef(null);
  const userId = profile?.userId;

  useEffect(() => {
    return subscribeToAuth((user) => {
      setProfile(profileFromFirebaseUser(user));
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Once we have a profile (new or returning), register the user with
  // the backend and load their sessions.
  useEffect(() => {
    if (!profile) return;

    (async () => {
      try {
        await initUser({ userId: profile.userId, username: profile.username, email: profile.email });
        const existing = await listSessions(profile.userId);
        setSessions(existing);
        if (existing.length > 0) {
          await openSession(existing[0].sID);
        } else {
          await startNewChat(existing);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setReady(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function openSession(sID) {
    setActiveSID(sID);
    setError(null);
    try {
      const history = await getMessages(userId, sID);
      setMessages(history.length === 0 ? [GREETING] : history.map((m) => ({ sender: m.sender, text: m.text, sources: [] })));
    } catch (err) {
      setError(err.message);
    }
  }

  async function startNewChat(existingList) {
    try {
      const session = await createSession(userId);
      setSessions((prev) => {
        const list = existingList ?? prev;
        return list.some((s) => s.sID === session.sID) ? list : [session, ...list];
      });
      setActiveSID(session.sID);
      setMessages([GREETING]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function refreshSessions() {
    try {
      setSessions(await listSessions(userId));
    } catch {
      /* non-fatal: sidebar just won't re-sort/rename until next refresh */
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy || !activeSID) return;

    setInput("");
    setError(null);
    setMessages((m) => [
      ...m,
      { sender: "user", text, ts: Date.now() },
      { sender: "bot", text: "", sources: [], ts: Date.now(), searching: true },
    ]);
    setBusy(true);

    try {
      for await (const evt of chatStream(userId, activeSID, text)) {
        if (evt.type === "sources") {
          setMessages((m) => updateLast(m, (last) => ({ ...last, sources: evt.sources, searching: false })));
        } else if (evt.type === "token") {
          setMessages((m) => updateLast(m, (last) => ({ ...last, text: last.text + evt.text })));
        } else if (evt.type === "error") {
          setMessages((m) =>
            updateLast(m, (last) => ({ ...last, text: `Something went wrong: ${evt.message}`, searching: false }))
          );
        } else if (evt.type === "done") {
          refreshSessions();
        }
      }
    } catch (err) {
      setMessages((m) =>
        updateLast(m, (last) => ({ ...last, text: `Something went wrong: ${err.message}`, searching: false }))
      );
    } finally {
      setBusy(false);
    }
  }

  if (!profile) {
    return (
      <OnboardingModal
        loading={authLoading}
        onSignedIn={(user) => setProfile(profileFromFirebaseUser(user))}
      />
    );
  }

  return (
    <div className="shell">
      <Sidebar
        sessions={sessions}
        activeSID={activeSID}
        onSelect={openSession}
        onNewChat={() => startNewChat()}
        username={profile.username}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((open) => !open)}
      />

      <div className="app">
        <header className="header">
          
          <div className="brand">
            <span className="dot" aria-hidden="true" />
            <h1>Wire</h1>
          </div>
          <span className="tag">
            <span className="model-dot" aria-hidden="true" />
            qwen3:1.7b
            <span className="chevron" aria-hidden="true">⌄</span>
          </span>
        </header>

        {error && <div className="banner">{error}</div>}

        <main className="thread" ref={threadRef}>
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.sender === "user" ? "user" : "assistant"}`}>
              <div className="meta">
                <span className="who">{m.sender === "user" ? profile.username : "Wire"}</span>
                {m.ts && (
                  <span className="time">
                    {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>

              {m.searching && <div className="searching">checking the wire…</div>}
              <div className="content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                  components={{
                    a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
                  }}
                >
                  {m.text || (m.searching ? "" : "…")}
                </ReactMarkdown>
              </div>

              {m.sources?.length > 0 && (
                <div className="sources">
                  {m.sources.map((s, j) => (
                    <a key={j} href={s.link} target="_blank" rel="noreferrer" className="source">
                      <span className="idx">{j + 1}</span>
                      {s.source || s.link}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </main>

        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <div className="composer-field">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={ready ? "Ask Wire anything…" : "Setting up…"}
              disabled={busy || !ready}
            />
            <button
              type="submit"
              className="send-button"
              disabled={busy || !ready || !input.trim()}
              aria-label="Send message"
            >
              <span aria-hidden="true">↑</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
