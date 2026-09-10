export default function Sidebar({ sessions, activeSID, onSelect, onNewChat, username }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <span className="who-label">{username}</span>
        <button className="new-chat" onClick={onNewChat}>
          + New chat
        </button>
      </div>

      <div className="sidebar-list">
        {sessions.map((s) => (
          <button
            key={s.sID}
            className={`session ${s.sID === activeSID ? "active" : ""}`}
            onClick={() => onSelect(s.sID)}
            title={s.title}
          >
            {s.title}
          </button>
        ))}
        {sessions.length === 0 && <p className="empty">No chats yet</p>}
      </div>
    </aside>
  );
}
