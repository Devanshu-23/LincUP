import { useState } from "react";
import { api } from "../api/client";
import useApi from "../hooks/useApi";
import Avatar from "./Avatar";
import Spinner from "./Spinner";
import "./EventDrawer.css";

export default function PostDrawer({ post, communityName, onClose }) {
  const { data: comments, loading, error, setData } = useApi(
    () => api.getPostComments(post.id),
    [post.id],
  );
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [postError, setPostError] = useState("");

  const handleComment = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setBusy(true);
    setPostError("");
    try {
      const created = await api.addPostComment(post.id, content.trim());
      setData((prev) => [...(prev || []), created]);
      setContent("");
    } catch (err) {
      setPostError(err.message || "Failed to post comment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 1000,
      }}
    >
      <aside
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "460px",
          height: "100%",
          overflowY: "auto",
          borderRadius: 0,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <div>
            <span className="muted" style={{ fontSize: "0.85rem" }}>{communityName}</span>
            <h2 style={{ margin: "4px 0 0" }}>{post.title}</h2>
          </div>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            ✕
          </button>
        </div>

        <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {post.description}
        </p>

        <hr style={{ width: "100%", opacity: 0.2 }} />

        <h3 style={{ margin: 0 }}>Comments {comments ? `(${comments.length})` : ""}</h3>

        {postError && <div className="alert alert-error">{postError}</div>}

        <form onSubmit={handleComment} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment…"
            maxLength={200}
            style={{ flex: 1 }}
            disabled={busy}
          />
          <button type="submit" className="btn btn-primary" disabled={busy || !content.trim()}>
            {busy ? "…" : "Post"}
          </button>
        </form>

        {loading && <Spinner label="Loading comments…" />}
        {error && <div className="alert alert-error">{error.message}</div>}

        {!loading && !error && comments?.length === 0 && (
          <p className="muted">No comments yet. Start the discussion!</p>
        )}

        {!loading && comments?.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "12px" }}>
            {comments.map((c) => (
              <li key={c.id} className="card" style={{ padding: "12px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <Avatar name={c.author?.full_name || "Student"} id={c.author?.id || c.id} size={32} />
                <div>
                  <strong style={{ fontSize: "0.9rem" }}>{c.author?.full_name || "Student"}</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "0.92rem" }}>{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}