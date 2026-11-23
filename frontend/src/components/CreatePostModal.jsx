import { useState } from "react";
import { api } from "../api/client";
import Modal from "./Modal";

const MAX_DESCRIPTION = 500;

export default function CreatePostModal({ communityId, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (title.trim().length < 2) return "Give your post a title.";
    if (!description.trim()) return "Write something for your post.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    setSaving(true);
    setError("");
    try {
      const post = await api.createPost(communityId, {
        title: title.trim(),
        description: description.trim(),
      });
      onCreated(post);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title="New post" onClose={onClose}>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="post-title">Title</label>
          <input
            id="post-title"
            className="input"
            placeholder="e.g. Anyone up for chai at 5?"
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="post-desc">Details</label>
          <textarea
            id="post-desc"
            className="textarea"
            rows={5}
            placeholder="Share a plan, ask a question, find company…"
            maxLength={MAX_DESCRIPTION}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <span className="field-hint field-count">
            {description.length}/{MAX_DESCRIPTION}
          </span>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Publishing…" : "Publish post"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
