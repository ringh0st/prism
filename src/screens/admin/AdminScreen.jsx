import { useState } from 'react';
import Button from '../../components/Button.jsx';
import { useAuth } from '../../state/AuthContext.jsx';
import LevelEditor from './LevelEditor.jsx';
import StatsPanel from './StatsPanel.jsx';
import styles from './Admin.module.css';

const TABS = [
  { id: 'editor', label: 'Level editor' },
  { id: 'stats', label: 'Player stats' },
];

function Gate({ title, children }) {
  return (
    <main className={styles.gate}>
      <h1>{title}</h1>
      {children}
      <Button as="a" href="#/" variant="secondary" icon="back">
        Back to the game
      </Button>
    </main>
  );
}

export default function AdminScreen() {
  const { isReady, user, isAdmin, refreshProfile } = useAuth();
  const [tab, setTab] = useState('editor');

  if (!isReady) return <Gate title="Loading…" />;
  if (!user) {
    return (
      <Gate title="Admins only">
        <p>Sign in with Google in Settings first.</p>
      </Gate>
    );
  }
  if (!isAdmin) {
    return (
      <Gate title="Admins only">
        <p>Your account isn’t an admin yet. Run <code>supabase/make-admin.sql</code> in the Supabase SQL Editor, then:</p>
        <Button onClick={refreshProfile}>Check again</Button>
      </Gate>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Button as="a" href="#/" variant="secondary" icon="back" label="Back to the game" />
        <h1>Lumipals admin</h1>
        <div className={styles.tabs} role="tablist" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>
      <section role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'editor' ? <LevelEditor /> : <StatsPanel />}
      </section>
    </div>
  );
}
