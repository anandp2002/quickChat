/**
 * Minimal placeholder chat page.
 */
export function ChatPage() {
  return (
    <div className="page-container">
      <header className="page-heading">
        <p className="page-kicker">Messages</p>
        <h1>Chat</h1>
        <p>Your conversations will appear here.</p>
      </header>
      <section className="empty-state">
        <div className="empty-state-icon" aria-hidden="true">
          ...
        </div>
        <h2>No conversations yet</h2>
        <p>When chat is connected, this is where your messages will live.</p>
      </section>
    </div>
  );
}
