import { useState } from "react";
import { api } from "../api/client";
import Modal from "./Modal";

const EMPTY = { title: "", description: "", start: "", end: "", location: "" };

// <input type="datetime-local"> gives local time without a zone; the backend
// requires a timezone, so convert to a full ISO string (UTC).
const toIso = (local) => new Date(local).toISOString();

export default function CreateEventModal({ communityId, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    if (form.title.trim().length < 2) return "Give your event a title.";
    if (!form.description.trim()) return "Add a short description.";
    if (!form.start || !form.end) return "Pick a start and end time.";
    if (new Date(form.end) <= new Date(form.start))
      return "End time must be after the start time.";
    if (!form.location.trim()) return "Where is it happening?";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    setSaving(true);
    setError("");
    try {
      const event = await api.createEvent(communityId, {
        title: form.title.trim(),
        description: form.description.trim(),
        start_at: toIso(form.start),
        end_at: toIso(form.end),
        location: form.location.trim(),
      });
      onCreated(event);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title="New event" onClose={onClose} wide>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="ev-title">Title</label>
          <input
            id="ev-title"
            className="input"
            placeholder="e.g. Sunday sunrise ride to Powai Lake"
            maxLength={150}
            value={form.title}
            onChange={update("title")}
            autoFocus
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="ev-start">Starts</label>
            <input
              id="ev-start"
              className="input"
              type="datetime-local"
              value={form.start}
              onChange={update("start")}
            />
          </div>
          <div className="field">
            <label htmlFor="ev-end">Ends</label>
            <input
              id="ev-end"
              className="input"
              type="datetime-local"
              min={form.start || undefined}
              value={form.end}
              onChange={update("end")}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ev-loc">Venue</label>
          <input
            id="ev-loc"
            className="input"
            placeholder="e.g. SAC, Lecture Hall Complex, Main Gate"
            maxLength={255}
            value={form.location}
            onChange={update("location")}
          />
        </div>
        <div className="field">
          <label htmlFor="ev-desc">Details</label>
          <textarea
            id="ev-desc"
            className="textarea"
            placeholder="What should people know? Registration, what to bring…"
            maxLength={1000}
            value={form.description}
            onChange={update("description")}
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Publishing…" : "Publish event"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
