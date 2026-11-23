// components/PostPoll.jsx
// used ai for this component
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";
import "./PostPoll.css";

const EMPTY_SLOT = {
  start_at: "",
  end_at: "",
};

function formatDateTime(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSlot(option) {
  return `${formatDateTime(option.start_at)} – ${formatDateTime(
    option.end_at
  )}`;
}

export default function PostPoll({ postId, ownerId }) {
  const { user } = useAuth();

  const isOwner =
    user?.id != null &&
    ownerId != null &&
    String(user.id) === String(ownerId);

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [slots, setSlots] = useState([{ ...EMPTY_SLOT }]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [selectedOption, setSelectedOption] = useState("");
  const [voting, setVoting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const [actionError, setActionError] = useState("");

  // Fetch poll
  const loadPoll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api.getPostPoll(postId);

      setPoll(data);
      setSelectedOption(
        data.voted_option != null
          ? String(data.voted_option)
          : ""
      );
    } catch (err) {
      setError(err.message || "Could not load poll");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPoll();
  }, [loadPoll]);

  const options = poll?.options || [];

  const isFinalized = Boolean(poll?.is_finalized);

  const totalVotes = useMemo(
    () =>
      options.reduce(
        (total, option) => total + Number(option.votes || 0),
        0
      ),
    [options]
  );

  // Find the most voted option.
  // In a tie, the first option is selected, matching Python's max().
  const winningOption = useMemo(() => {
    if (!options.length || totalVotes === 0) return null;

    return options.reduce((best, current) =>
      Number(current.votes) > Number(best.votes)
        ? current
        : best
    );
  }, [options, totalVotes]);

  // Update a particular time slot
  const updateSlot = (index, field, value) => {
    setSlots((current) =>
      current.map((slot, i) =>
        i === index
          ? { ...slot, [field]: value }
          : slot
      )
    );
  };

  const addSlot = () => {
    if (slots.length < 3) {
      setSlots((current) => [
        ...current,
        { ...EMPTY_SLOT },
      ]);
    }
  };

  const removeSlot = (index) => {
    if (slots.length <= 1) return;

    setSlots((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  // Create poll
  const handleCreatePoll = async (e) => {
    e.preventDefault();

    setActionError("");

    for (const slot of slots) {
      if (!slot.start_at || !slot.end_at) {
        setActionError("Please select both start and end times.");
        return;
      }

      if (
        new Date(slot.end_at).getTime() <=
        new Date(slot.start_at).getTime()
      ) {
        setActionError("End time must be after start time.");
        return;
      }
    }

    const optionsPayload = slots.map((slot) => ({
      start_at: new Date(slot.start_at).toISOString(),
      end_at: new Date(slot.end_at).toISOString(),
    }));

    setCreating(true);

    try {
      await api.createPostPoll(postId, {
        options: optionsPayload,
      });

      setShowCreate(false);
      setSlots([{ ...EMPTY_SLOT }]);

      await loadPoll();
    } catch (err) {
      setActionError(err.message || "Could not create poll");
    } finally {
      setCreating(false);
    }
  };

  // Vote or change vote
  const handleVote = async () => {
    if (!selectedOption) return;

    setVoting(true);
    setActionError("");

    try {
      await api.votePostPoll(postId, {
        option_id: Number(selectedOption),
      });

      await loadPoll();
    } catch (err) {
      setActionError(err.message || "Could not record vote");
    } finally {
      setVoting(false);
    }
  };

  // Finalize the highest-voted option
  const handleFinalize = async () => {
    if (!winningOption) return;


    setFinalizing(true);
    setActionError("");

    try {
      await api.finalizePostPoll(postId);
      await loadPoll();
    } catch (err) {
      setActionError(err.message || "Could not finalize poll");
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <section className="post-poll">
        <p className="muted">Loading poll...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="post-poll">
        <div className="alert alert-error">{error}</div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadPoll}
        >
          Retry
        </button>
      </section>
    );
  }

  // No poll exists
  if (options.length === 0) {
    return (
      <section className="post-poll">
        {isOwner ? (
          <>
            {!showCreate ? (
              <button
                type="button"
                className="poll-create-trigger"
                onClick={() => setShowCreate(true)}
              >
                <Icon name="calendar" size={18} />
                Create a time-slot poll
              </button>
            ) : (
              <form
                className="poll-create-form"
                onSubmit={handleCreatePoll}
              >
                <div className="poll-heading">
                  <div>
                    <h4>Find a common time</h4>
                    <p className="muted">
                      Suggest up to 3 possible time slots.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="poll-icon-button"
                    onClick={() => setShowCreate(false)}
                    aria-label="Close poll form"
                  >
                    <Icon name="x" size={18} />
                  </button>
                </div>

                {slots.map((slot, index) => (
                  <div className="poll-slot-editor" key={index}>
                    <div className="poll-slot-editor-head">
                      <strong>Option {index + 1}</strong>

                      {slots.length > 1 && (
                        <button
                          type="button"
                          className="poll-remove-slot"
                          onClick={() => removeSlot(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <label>
                      Start time
                      <input
                        className="input"
                        type="datetime-local"
                        value={slot.start_at}
                        required
                        onChange={(e) =>
                          updateSlot(
                            index,
                            "start_at",
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      End time
                      <input
                        className="input"
                        type="datetime-local"
                        value={slot.end_at}
                        required
                        min={slot.start_at || undefined}
                        onChange={(e) =>
                          updateSlot(
                            index,
                            "end_at",
                            e.target.value
                          )
                        }
                      />
                    </label>
                  </div>
                ))}

                {slots.length < 3 && (
                  <button
                    type="button"
                    className="poll-add-slot"
                    onClick={addSlot}
                  >
                    <Icon name="plus" size={16} />
                    Add another time slot
                  </button>
                )}

                {actionError && (
                  <div className="alert alert-error">
                    {actionError}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary poll-submit"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Publish poll"}
                </button>
              </form>
            )}
          </>
        ) : (
          <p className="muted poll-empty">
            The post owner hasn't created a time poll yet.
          </p>
        )}
      </section>
    );
  }

  // Poll exists
  return (
    <section className="post-poll">
      <div className="poll-heading">
        <div>
          <h4>
            <Icon name="calendar" size={18} />
            Find a common time
          </h4>

          <p className="muted">
            {isFinalized
              ? "The event has been scheduled."
              : "Vote for the time slot that works best for you."}
          </p>
        </div>

        <span
          className={`poll-status ${
            isFinalized ? "finalized" : "active"
          }`}
        >
          {isFinalized ? "Finalized" : "Voting open"}
        </span>
      </div>

      {isFinalized && (
        <div className="poll-finalized">
          <Icon name="calendar-check" size={22} />

          <div>
            <strong>Event scheduled</strong>
            <p>
              {formatDateTime(poll.start_at)}
              {" – "}
              {formatDateTime(poll.end_at)}
            </p>
          </div>
        </div>
      )}

      <div className="poll-options">
        {options.map((option) => {
          const selected =
            String(option.id) === selectedOption;

          const percentage =
            totalVotes > 0
              ? Math.round(
                  (Number(option.votes || 0) / totalVotes) *
                    100
                )
              : 0;

          return (
            <label
              key={option.id}
              className={`poll-option ${
                selected ? "selected" : ""
              } ${isFinalized ? "disabled" : ""}`}
            >
              <div className="poll-option-top">
                <input
                  type="radio"
                  name={`post-poll-${postId}`}
                  value={option.id}
                  checked={selected}
                  disabled={isFinalized}
                  onChange={() =>
                    setSelectedOption(String(option.id))
                  }
                />

                <span className="poll-option-time">
                  {formatSlot(option)}
                </span>

                <strong className="poll-votes">
                  {option.votes || 0}
                </strong>
              </div>

              <div className="poll-progress">
                <div
                  className="poll-progress-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <span className="poll-percentage">
                {percentage}%
              </span>
            </label>
          );
        })}
      </div>

      <div className="poll-footer">
        <span className="muted">
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </span>

        {!isFinalized && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!selectedOption || voting}
            onClick={handleVote}
          >
            {voting ? "Saving..." : "Submit vote"}
          </button>
        )}
      </div>

      {!isFinalized && isOwner && (
        <div className="poll-owner-actions">
          <p className="muted">
            {winningOption
              ? `Most votes: ${formatSlot(winningOption)}`
              : "Waiting for votes before scheduling."}
          </p>

          <button
            type="button"
            className="btn btn-primary"
            disabled={!winningOption || finalizing}
            onClick={handleFinalize}
          >
            {finalizing
              ? "Finalizing..."
              : "Finalize winning slot"}
          </button>
        </div>
      )}

      {actionError && (
        <div className="alert alert-error">
          {actionError}
        </div>
      )}
    </section>
  );
}