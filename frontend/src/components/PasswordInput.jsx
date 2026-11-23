import { useState } from "react";
import Icon from "./Icon";
import "./PasswordInput.css";

// Password field with a show/hide button. Other props go to the <input>.
export default function PasswordInput({ id, className = "", ...rest }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input id={id} className={`input ${className}`} type={visible ? "text" : "password"} {...rest} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={id}
        title={visible ? "Hide password" : "Show password"}
      >
        <Icon name={visible ? "eyeOff" : "eye"} size={19} />
      </button>
    </div>
  );
}
