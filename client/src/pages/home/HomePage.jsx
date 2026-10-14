import { useSelector } from 'react-redux';

/**
 * Home page — shown after login/signup.
 */
export function HomePage() {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="page-container">
      <header className="page-heading">
        <p className="page-kicker">Workspace</p>
        <h1>Good to see you, {user?.displayName?.split(' ')[0] || 'there'}.</h1>
        <p>Pick up where you left off or start a new conversation.</p>
      </header>
      <div className="home-overview">
        <section className="welcome-panel">
          <span className="welcome-panel-label">QuickChat</span>
          <h2>Your conversations, in one calm place.</h2>
          <p>Head to Chat from the sidebar when you are ready to connect.</p>
        </section>
        <section className="account-panel">
          <span className="page-kicker">Signed in as</span>
          <strong>{user?.email}</strong>
          <p>Your account is ready to use.</p>
        </section>
      </div>
    </div>
  );
}
