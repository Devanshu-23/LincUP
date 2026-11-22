import { toneFor } from "../utils/format";
import Avatar from "./Avatar";
import Icon from "./Icon";
import "./PostCard.css";

// General post preview. Click opens the post with its comments.
export default function PostCard({ post, onOpen }) {
  return (
    <button className="post-card" onClick={() => onOpen(post)}>
      <div className={`post-mark tone-${toneFor(post.community_id)}`}>
        <Icon name="chat" size={26} />
      </div>
      <div className="post-body">
        <h3>{post.title}</h3>
        <p className="post-excerpt">{post.description}</p>
        <div className="post-meta">
          <span className="post-author">
            <Avatar name={post.authorName} id={post.created_by} size={24} />
            {post.authorName}
          </span>
          <span className="post-open">View discussion</span>
        </div>
      </div>
    </button>
  );
}
