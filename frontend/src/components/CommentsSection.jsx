import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import useApi from "../hooks/useApi";
import { timeAgo } from "../utils/format";
import Avatar from "./Avatar";
import Icon from "./Icon";

const MAX_COMMENT = 200; // backend limit (CommentCreate.content)

// Discussion thread under an event.
export default function CommentsSection({ eventId }) {
  const { user } = useAuth();
  const { data: comments, loading, error, setData } = useApi(
    () => api.getEventComments(eventId),
    [eventId],
  );
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const listEnd = useRef(null);

  // Keep the newest comment in view
  useEffect(() => {
    listEnd.current?.scrollIntoView({ block: "nearest" });
  }, [comments?.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setPosting(true);
    setPostError("");
    try {
      const comment = await api.addEventComment(eventId, content);
      setData((list) => [...(list || []), comment]);
      setText("");
    } catch (err) {
      setPostError(err.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="comments">
      <h3>
        <Icon name="chat" size={18} /> Discussion
        {comments && <span className="count">{comments.length}</span>}
      </h3>

      {loading ? (
        <p className="muted">Loading comments…</p>
      ) : error ? (
        <div className="alert alert-error">{error.message}</div>
      ) : comments.length === 0 ? (
        <p className="muted comments-empty">
          No comments yet. Ask a question or say you're coming! 👋
        </p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className={c.author.id === user?.id ? "mine" : ""}>
              <Avatar name={c.author.full_name} id={c.author.id} size={32} />
              <div className="comment-bubble">
                <div className="comment-head">
                  <strong>{c.author.id === user?.id ? "You" : c.author.full_name}</strong>
                  <span className="muted">{timeAgo(c.created_at)}</span>
                </div>
                <p>{c.content}</p>
              </div>
            </li>
          ))}
          <li ref={listEnd} aria-hidden="true" className="comment-anchor" />
        </ul>
      )}

      {postError && <div className="alert alert-error">{postError}</div>}

      <form className="comment-form" onSubmit={handleSubmit}>
        <input
          className="input"
          placeholder="Write a comment…"
          maxLength={MAX_COMMENT}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Write a comment"
        />
        <button
          className="btn btn-primary"
          disabled={posting || !text.trim()}
          aria-label="Post comment"
        >
          <Icon name="send" size={18} />
        </button>
      </form>
    </section>
  );
}
