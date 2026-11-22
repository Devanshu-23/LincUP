import EmptyState from "./EmptyState";
import Icon from "./Icon";
import PostCard from "./PostCard";
import Spinner from "./Spinner";

// "General posts" tab of a community. `posts` is the useApi() result.
export default function PostsTab({ posts, isMember, onOpen, onCreate }) {
  if (posts.loading) return <Spinner label="Loading posts…" />;
  if (posts.error) return <div className="alert alert-error">{posts.error.message}</div>;

  if (posts.data.length === 0) {
    return (
      <EmptyState
        emoji="💬"
        title="No general posts yet"
        action={
          isMember && (
            <button className="btn btn-primary" onClick={onCreate}>
              Create the first post
            </button>
          )
        }
      >
        {isMember
          ? "Start a hangout, ask a question, or share something with the community."
          : "Join this community to start posting and chatting with members."}
      </EmptyState>
    );
  }

  return (
    <section className="section">
      <div className="section-title">
        <h2 className="list-heading">Latest posts</h2>
        {isMember && (
          <button className="btn btn-primary btn-sm" onClick={onCreate}>
            <Icon name="plus" size={16} /> New post
          </button>
        )}
      </div>
      <div className="post-list">
        {posts.data.map((post) => (
          <PostCard key={post.id} post={post} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
