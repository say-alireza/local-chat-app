// components/ChatWindow/OnlinePanel.tsx
import styles from './ChatWindow.module.css';

interface Props {
  users: string[];
}

export function OnlinePanel({ users }: Props) {
  return (
    <aside className={styles.onlinePanel}>
      <div className={styles.onlineHeader}>Online ({users.length})</div>
      <ul className={styles.onlineList}>
        {users.map((user) => (
          <li key={user} className={styles.onlineItem}>
            <span className={styles.onlineDot} /> {user}
          </li>
        ))}
      </ul>
    </aside>
  );
}