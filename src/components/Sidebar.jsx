export default function Sidebar({ sessions, activeSID, onSelect, onNewChat, username, open, onToggle }) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-rail">
        <button className="rail-toggle" onClick={onToggle} aria-label={open ? "Collapse sidebar" : "Expand sidebar"} title={open ? "Collapse sidebar" : "Expand sidebar"}>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <button className="new-chat" onClick={onNewChat} aria-label="New chat" title="New chat">
          +
        </button>
        <span className="rail-user" title={username}>{username.slice(0, 1).toUpperCase()}</span>
      </div>

      <div className="sidebar-drawer">
        <div className="sidebar-heading">
          <span>Conversations</span>
          <span className="who-label">{username}</span>
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
      </div>
    </aside>
  );
}
