import Avatar from "./Avatar";
import CommentsSection from "./CommentsSection";
import Drawer from "./Drawer";

// Full text of a general post and its comments thread.
export default function PostDrawer({ post, communityName, onClose }) {
  return (
    <Drawer
      title={post.title}
      communityId={post.community_id}
      communityName={communityName}
      onClose={onClose}
    >
      <div className="drawer-author">
        <Avatar name={post.authorName} id={post.created_by} size={38} />
        <div>
          <strong>{post.authorName}</strong>
          <span className="muted">Posted this</span>
        </div>
      </div>

      <p className="drawer-description">{post.description}</p>

      <CommentsSection target="post" id={post.id} />
    </Drawer>
  );
}
