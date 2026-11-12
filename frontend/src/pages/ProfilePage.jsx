import { useState } from "react";
import { api } from "../api/client";
import Avatar from "../components/Avatar";
import { useAuth } from "../context/AuthContext";
import { DEGREE_PROGRAMS, DEPARTMENTS, STUDY_YEARS } from "../utils/constants";
import { formatFullDate } from "../utils/format";
import "./ProfilePage.css";

// Make sure a value saved earlier still shows up in a dropdown
const withCurrent = (options, current) =>
  current && !options.includes(current) ? [current, ...options] : options;

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const startEditing = () => {
    setForm({
      full_name: user.full_name,
      department: user.department,
      degree_program: user.degree_program,
      study_year: String(user.study_year),
    });
    setMessage(null);
    setEditing(true);
  };

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.full_name.trim().length < 2) {
      return setMessage({ type: "error", text: "Name must be at least 2 characters." });
    }
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.updateMe({
        ...form,
        full_name: form.full_name.trim(),
        study_year: Number(form.study_year),
      });
      // eslint-disable-next-line no-unused-vars
      const { message: _ignored, ...profile } = updated;
      setUser(profile);
      setEditing(false);
      setMessage({ type: "success", text: "Profile updated." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <section className="profile-card">
        <div className="profile-banner" aria-hidden="true" />
        <div className="profile-head">
          <Avatar name={user.full_name} id={user.id} size={96} />
          <div>
            <h1>{user.full_name}</h1>
            <p className="muted">{user.email}</p>
          </div>
          {!editing && (
            <button className="btn btn-outline profile-edit" onClick={startEditing}>
              Edit profile
            </button>
          )}
        </div>

        {message && (
          <div className={`alert alert-${message.type === "error" ? "error" : "success"}`}>
            {message.text}
          </div>
        )}

        {editing ? (
          <form className="profile-form" onSubmit={handleSave}>
            <div className="field">
              <label htmlFor="pf-name">Full name</label>
              <input
                id="pf-name"
                className="input"
                maxLength={100}
                value={form.full_name}
                onChange={update("full_name")}
              />
            </div>
            <div className="field">
              <label htmlFor="pf-dept">Department</label>
              <select
                id="pf-dept"
                className="select"
                value={form.department}
                onChange={update("department")}
              >
                {withCurrent(DEPARTMENTS, form.department).map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="pf-degree">Degree</label>
                <select
                  id="pf-degree"
                  className="select"
                  value={form.degree_program}
                  onChange={update("degree_program")}
                >
                  {withCurrent(DEGREE_PROGRAMS, form.degree_program).map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="pf-year">Year</label>
                <select
                  id="pf-year"
                  className="select"
                  value={form.study_year}
                  onChange={update("study_year")}
                >
                  {STUDY_YEARS.map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <dl className="profile-details">
            <div>
              <dt>Department</dt>
              <dd>{user.department}</dd>
            </div>
            <div>
              <dt>Degree</dt>
              <dd>{user.degree_program}</dd>
            </div>
            <div>
              <dt>Year of study</dt>
              <dd>Year {user.study_year}</dd>
            </div>
            {user.created_at && (
              <div>
                <dt>On LincUP since</dt>
                <dd>{formatFullDate(user.created_at)}</dd>
              </div>
            )}
          </dl>
        )}
      </section>
    </div>
  );
}
