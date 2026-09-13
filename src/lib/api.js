import { getIdToken } from "./firebase.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function authorizedFetch(url, options = {}) {
  const token = await getIdToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

async function asJson(res) {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* response wasn't JSON */
    }
    throw new Error(detail);
  }
  return res.json();
}

export function initUser({ userId, username, email }) {
  return authorizedFetch(`${API_URL}/users/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, username, email }),
  }).then(asJson);
}

export function listSessions(userId) {
  return authorizedFetch(`${API_URL}/users/${userId}/sessions`).then(asJson);
}

export function createSession(userId, title = "New chat") {
  return authorizedFetch(`${API_URL}/users/${userId}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  }).then(asJson);
}

export function getMessages(userId, sID) {
  return authorizedFetch(`${API_URL}/users/${userId}/sessions/${sID}/messages`).then(asJson);
}

/**
 * Streams the NDJSON response from POST /chat, yielding each parsed
 * event ({type: "sources" | "token" | "done" | "error", ...}) as it
 * arrives.
 */
export async function* chatStream(userId, sID, message) {
  const res = await authorizedFetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, sID, message }),
  });

  if (!res.ok || !res.body) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* response wasn't JSON */
    }
    throw new Error(detail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      yield JSON.parse(line);
    }
  }
}
