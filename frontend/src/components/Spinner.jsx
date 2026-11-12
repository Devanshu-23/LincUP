export default function Spinner({ label = "Loading…", fullPage = false }) {
  return (
    <div className={fullPage ? "spinner-wrap full" : "spinner-wrap"} role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="muted">{label}</span>
    </div>
  );
}
