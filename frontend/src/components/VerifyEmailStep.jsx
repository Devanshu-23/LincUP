import { useRef } from "react";
import Icon from "./Icon";
import OtpInput from "./OtpInput";
import "./VerifyEmailStep.css";

const CODE_LENGTH = 4; // backend UserCreate.otp

// Second step of sign up: enter the code that was emailed.
export default function VerifyEmailStep({
  email,
  code,
  onCodeChange,
  invalid,
  busy, // "send" | "verify" | null
  cooldown, // seconds until resend is allowed
  onSubmit,
  onResend,
  onBack,
}) {
  const input = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    input.current.focus(); // ready for another try if the code is wrong
    if (code.length === CODE_LENGTH && !busy) onSubmit();
  };

  const handleResend = () => {
    input.current.focus();
    onResend();
  };

  return (
    <form className="verify-step" onSubmit={handleSubmit} noValidate>
      <div className="verify-target">
        <span className="verify-icon">
          <Icon name="mail" size={22} />
        </span>
        <div>
          <span className="muted">Verifying</span>
          <strong>{email}</strong>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onBack}
          disabled={Boolean(busy)}
        >
          Change
        </button>
      </div>

      <div className="field">
        <label htmlFor="su-otp">{CODE_LENGTH}-digit code</label>
        <OtpInput
          id="su-otp"
          inputRef={input}
          length={CODE_LENGTH}
          value={code}
          onChange={onCodeChange}
          invalid={invalid}
          describedBy="su-otp-hint"
        />
        <span id="su-otp-hint" className="field-hint">
          Can't find it? Check your spam folder. Only the newest code works.
        </span>
      </div>

      <button
        className="btn btn-primary btn-block"
        disabled={Boolean(busy) || code.length !== CODE_LENGTH}
      >
        {busy === "verify" ? "Verifying…" : "Verify and create account"}
      </button>

      <p className="verify-resend muted">
        Didn't get a code?{" "}
        <button
          type="button"
          className="link-btn"
          onClick={handleResend}
          disabled={Boolean(busy) || cooldown > 0}
        >
          {busy === "send" ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </p>
    </form>
  );
}
