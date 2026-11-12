// Friendly placeholder for empty lists ("No events yet" etc.)
export default function EmptyState({ emoji = "✨", title, children, action }) {
  return (
    <div className="empty-state">
      <div className="empty-emoji" aria-hidden="true">
        {emoji}
      </div>
      <h3>{title}</h3>
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  );
}
