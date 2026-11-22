import { useState } from "react";
import "./OtpInput.css";

// One real input on top of drawn boxes, so paste, SMS/email autofill and screen
// readers work like a normal field. Only digits are kept.
export default function OtpInput({ id, value, onChange, length, invalid, describedBy, inputRef }) {
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1);

  // Typing always continues at the end, wherever the boxes were clicked
  const caretToEnd = (e) => {
    const el = e.currentTarget;
    el.setSelectionRange(el.value.length, el.value.length);
  };

  return (
    <div className={`otp ${invalid ? "is-invalid" : ""}`}>
      <input
        id={id}
        ref={inputRef}
        className="otp-input"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        onFocus={(e) => {
          setFocused(true);
          caretToEnd(e);
        }}
        onClick={caretToEnd}
        onBlur={() => setFocused(false)}
        autoFocus
      />
      {Array.from({ length }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`otp-box ${value[i] ? "is-filled" : ""} ${focused && i === active ? "is-active" : ""}`}
        >
          {value[i]}
        </span>
      ))}
    </div>
  );
}
