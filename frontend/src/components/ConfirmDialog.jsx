import { useState } from "react";
import Modal from "./Modal";

// "Are you sure?" dialog. `onConfirm` is async: the dialog shows its progress
// and its error, and the parent closes the dialog when it succeeds.
export default function ConfirmDialog({
  title,
  children,
  confirmLabel,
  busyLabel,
  danger = false,
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={title} onClose={() => !busy && onClose()}>
      <p className="confirm-text">{children}</p>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy} autoFocus>
          Cancel
        </button>
        <button
          className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
          onClick={confirm}
          disabled={busy}
        >
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
