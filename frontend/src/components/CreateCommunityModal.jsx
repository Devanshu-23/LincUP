import { useState } from "react";
import { api } from "../api/client";
import Modal from "./Modal";

const MAX_DESCRIPTION = 500;

export default function CreateCommunityModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      return setError("Community name must be at least 2 characters.");
    }
    setSaving(true);
    setError("");
    try {
      const community = await api.createCommunity({
        name: name.trim(),
        description: description.trim() || null,
      });
      onCreated(community);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title="Start a community" onClose={onClose}>
      <p className="muted">
        Bring people together around a club, hobby or interest. You'll be the
        owner and can post events for its members.
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="cc-name">Name</label>
          <input
            id="cc-name"
            className="input"
            placeholder="e.g. Weekend Cyclists"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="cc-desc">Description</label>
          <textarea
            id="cc-desc"
            className="textarea"
            placeholder="What is this community about? Who should join?"
            maxLength={MAX_DESCRIPTION}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <span className="field-hint">
            {description.length}/{MAX_DESCRIPTION}
          </span>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Creating…" : "Create community"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
