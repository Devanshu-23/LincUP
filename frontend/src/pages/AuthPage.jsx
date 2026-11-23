import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import PasswordInput from "../components/PasswordInput";
import VerifyEmailStep from "../components/VerifyEmailStep";
import { useAuth } from "../context/AuthContext";
import { DEGREE_PROGRAMS, DEPARTMENTS, STUDY_YEARS } from "../utils/constants";
import "./AuthPage.css";

const RESEND_WAIT = 30; // seconds between two codes
const IITB_EMAIL = /^[^\s@]+@iitb\.ac\.in$/;

const EMPTY_SIGNUP = {
  full_name: "",
  email: "",
  password: "",
  confirm_password: "", // only checked here, never sent
  department: "",
  degree_program: "",
  study_year: "",
};

// Same rules as the backend's UserCreate validator, checked early for nicer UX
function validateSignup(form) {
  if (form.full_name.trim().length < 2) return "Please enter your full name.";
  if (!IITB_EMAIL.test(form.email.trim().toLowerCase()))
    return "Use your IIT Bombay email (ending in @iitb.ac.in).";
  if (form.password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(form.password)) return "Password must contain a letter.";
  if (!/\d/.test(form.password)) return "Password must contain a digit.";
  if (!/[^a-zA-Z0-9]/.test(form.password))
    return "Password must contain a special character.";
  if (form.confirm_password !== form.password) return "The two passwords don't match.";
  if (!form.department) return "Please choose your department.";
  if (!form.degree_program) return "Please choose your degree program.";
  if (!form.study_year) return "Please choose your year of study.";
  return null;
}

const sendErrorText = (err) =>
  err.status >= 500 ? "We couldn't send the email. Please try again in a minute." : err.message;

const STICKERS = [
  { emoji: "🚴", text: "Sunrise cycling to Powai Lake", tone: "sage" },
  { emoji: "📚", text: "CS 699 study group · Library", tone: "sky" },
  { emoji: "🎬", text: "Movie night at the OAT", tone: "rose" },
  { emoji: "🏸", text: "Badminton doubles @ SAC", tone: "sun" },
];

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState(EMPTY_SIGNUP);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accountExists, setAccountExists] = useState(false);
  const [busy, setBusy] = useState(null); // "login" | "send" | "verify"

  // Sign up has two steps: "details", then "verify" with the emailed code
  const [step, setStep] = useState("details");
  const [codeSentTo, setCodeSentTo] = useState("");
  const [code, setCode] = useState("");
  const [codeInvalid, setCodeInvalid] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const alertRef = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // The sign up form is long, so on a phone the message can be off screen
  useEffect(() => {
    if (error || accountExists) alertRef.current?.scrollIntoView({ block: "nearest" });
  }, [error, accountExists]);

  // Where to go after logging in (the page that sent us here, or the feed)
  const redirectTo = location.state?.from?.pathname || "/home";

  if (user) return <Navigate to={redirectTo} replace />;

  const email = signupForm.email.trim().toLowerCase();
  const verifying = mode === "signup" && step === "verify";
  const { password, confirm_password: confirm } = signupForm;
  const passwordsMatch = confirm !== "" && confirm === password;
  // Wrong as soon as it can no longer become the password, not while still typing it
  const passwordsDiffer =
    confirm !== "" && !passwordsMatch && (confirm.length >= password.length || !password.startsWith(confirm));

  const clearMessages = () => {
    setError("");
    setNotice("");
    setAccountExists(false);
    setCodeInvalid(false);
  };

  const switchMode = (next) => {
    setMode(next);
    clearMessages();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    setBusy("login");
    try {
      await login(loginForm.email.trim(), loginForm.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  // 409 from either endpoint: this email already has an account
  const showAccountExists = () => {
    setStep("details");
    setCodeSentTo("");
    setAccountExists(true);
  };

  const sendCode = async ({ resend = false } = {}) => {
    clearMessages();
    setBusy("send");
    try {
      await api.sendOtp(email);
      setCodeSentTo(email);
      setCode("");
      setCooldown(RESEND_WAIT);
      setStep("verify");
      if (resend) setNotice("We sent a new code. The previous one no longer works.");
    } catch (err) {
      if (err.status === 409) return showAccountExists();
      // the backend replaces the code before emailing it, so the old one may be dead
      if (resend) setCodeSentTo("");
      setError(sendErrorText(err));
    } finally {
      setBusy(null);
    }
  };

  const handleDetails = (e) => {
    e.preventDefault();
    if (busy) return;
    clearMessages();
    const problem = validateSignup(signupForm);
    if (problem) return setError(problem);
    // Came back to edit something else: the code already sent is still good
    if (codeSentTo === email) return setStep("verify");
    sendCode();
  };

  const handleVerify = async () => {
    clearMessages();
    setBusy("verify");
    try {
      // eslint-disable-next-line no-unused-vars
      const { confirm_password: _check, ...details } = signupForm;
      await register({
        ...details,
        full_name: signupForm.full_name.trim(),
        email,
        study_year: Number(signupForm.study_year),
        otp: code,
      });
      navigate("/home", { replace: true });
    } catch (err) {
      if (err.status === 409) return showAccountExists();
      if (err.status === 400) {
        setCode("");
        setCodeInvalid(true);
        setError("That code didn't work. Check the newest email, or resend the code.");
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(null);
    }
  };

  const backToDetails = () => {
    clearMessages();
    setStep("details");
  };

  const logInInstead = () => {
    setLoginForm({ email, password: "" });
    switchMode("login");
  };

  const updateSignup = (field) => (e) =>
    setSignupForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className={`auth-page ${verifying ? "is-verifying" : ""}`}>
      <aside className="auth-hero">
        <div className="auth-brand">
          <span className="logo-mark" aria-hidden="true" />
          LincUP
        </div>
        <div className="auth-hero-copy">
          <p className="eyebrow">IIT Bombay · Campus life</p>
          <h1>
            Find your people.
            <br />
            <span className="auth-highlight">Make plans happen.</span>
          </h1>
          <p className="auth-lead">
            Clubs, events and student-made meetups, all in one place. Join
            communities, RSVP to what excites you and never miss out again.
          </p>
        </div>
        <ul className="auth-stickers">
          {STICKERS.map((s) => (
            <li key={s.text} className={`sticker tone-${s.tone}`}>
              <span aria-hidden="true">{s.emoji}</span> {s.text}
            </li>
          ))}
        </ul>
      </aside>

      <main className="auth-panel">
        <div className="auth-card">
          <div className="auth-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={mode === "login"}
              className={mode === "login" ? "active" : ""}
              onClick={() => switchMode("login")}
              disabled={Boolean(busy)}
            >
              Log in
            </button>
            <button
              role="tab"
              aria-selected={mode === "signup"}
              className={mode === "signup" ? "active" : ""}
              onClick={() => switchMode("signup")}
              disabled={Boolean(busy)}
            >
              Sign up
            </button>
          </div>

          {mode === "signup" && (
            <ol className="auth-steps" aria-label="Sign up progress">
              <li className={verifying ? "done" : "current"} aria-current={verifying ? undefined : "step"}>
                <span>{verifying ? "✓" : "1"}</span> Your details
              </li>
              <li className={verifying ? "current" : ""} aria-current={verifying ? "step" : undefined}>
                <span>2</span> Verify email
              </li>
            </ol>
          )}

          <h2>
            {mode === "login" ? "Welcome back 👋" : verifying ? "Check your inbox" : "Join LincUP"}
          </h2>
          <p className="muted auth-sub">
            {mode === "login"
              ? "Log in with your IITB email to see what's happening."
              : verifying
                ? "Enter the code we emailed you to finish creating your account."
                : "Create your account with your @iitb.ac.in email."}
          </p>

          {(error || accountExists) && (
            <div className="alert alert-error" role="alert" ref={alertRef}>
              {accountExists ? (
                <>
                  This email already has an account.{" "}
                  <button type="button" className="link-btn" onClick={logInInstead}>
                    Log in instead
                  </button>
                </>
              ) : (
                error
              )}
            </div>
          )}
          {notice && (
            <div className="alert alert-success" role="status">
              {notice}
            </div>
          )}

          {verifying ? (
            <VerifyEmailStep
              email={email}
              code={code}
              onCodeChange={(value) => {
                setCode(value);
                setCodeInvalid(false);
              }}
              invalid={codeInvalid}
              busy={busy}
              cooldown={cooldown}
              onSubmit={handleVerify}
              onResend={() => sendCode({ resend: true })}
              onBack={backToDetails}
            />
          ) : mode === "login" ? (
            <form onSubmit={handleLogin} noValidate>
              <div className="field">
                <label htmlFor="login-email">IITB email</label>
                <input
                  id="login-email"
                  className="input"
                  type="email"
                  autoComplete="email"
                  placeholder="rollno@iitb.ac.in"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="login-password">Password</label>
                <PasswordInput
                  id="login-password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((f) => ({ ...f, password: e.target.value }))
                  }
                  required
                />
              </div>
              <button
                className="btn btn-primary btn-block"
                disabled={Boolean(busy) || !loginForm.email || !loginForm.password}
              >
                {busy === "login" ? "Logging in…" : "Log in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleDetails} noValidate>
              <div className="field">
                <label htmlFor="su-name">Full name</label>
                <input
                  id="su-name"
                  className="input"
                  autoComplete="name"
                  maxLength={100}
                  value={signupForm.full_name}
                  onChange={updateSignup("full_name")}
                />
              </div>
              <div className="field">
                <label htmlFor="su-email">IITB email</label>
                <input
                  id="su-email"
                  className="input"
                  type="email"
                  autoComplete="email"
                  placeholder="rollno@iitb.ac.in"
                  value={signupForm.email}
                  readOnly={busy === "send"}
                  onChange={updateSignup("email")}
                />
              </div>
              <div className="field">
                <label htmlFor="su-password">Password</label>
                <PasswordInput
                  id="su-password"
                  autoComplete="new-password"
                  maxLength={128}
                  aria-describedby="su-password-hint"
                  value={signupForm.password}
                  onChange={updateSignup("password")}
                />
                <span id="su-password-hint" className="field-hint">
                  8+ characters with a letter, a digit and a special character.
                </span>
              </div>
              <div className="field">
                <label htmlFor="su-confirm">Confirm password</label>
                <PasswordInput
                  id="su-confirm"
                  autoComplete="new-password"
                  maxLength={128}
                  aria-invalid={passwordsDiffer}
                  aria-describedby="su-confirm-hint"
                  value={signupForm.confirm_password}
                  onChange={updateSignup("confirm_password")}
                />
                <span
                  id="su-confirm-hint"
                  className={`field-hint ${passwordsDiffer ? "field-hint-error" : ""}`}
                  aria-live="polite"
                >
                  {passwordsDiffer
                    ? "Doesn't match the password above."
                    : passwordsMatch
                      ? "✓ Passwords match"
                      : "Type the same password again."}
                </span>
              </div>
              <div className="field">
                <label htmlFor="su-dept">Department</label>
                <select
                  id="su-dept"
                  className="select"
                  value={signupForm.department}
                  onChange={updateSignup("department")}
                >
                  <option value="">Choose department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="su-degree">Degree</label>
                  <select
                    id="su-degree"
                    className="select"
                    value={signupForm.degree_program}
                    onChange={updateSignup("degree_program")}
                  >
                    <option value="">Choose</option>
                    {DEGREE_PROGRAMS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="su-year">Year</label>
                  <select
                    id="su-year"
                    className="select"
                    value={signupForm.study_year}
                    onChange={updateSignup("study_year")}
                  >
                    <option value="">Choose</option>
                    {STUDY_YEARS.map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary btn-block" disabled={Boolean(busy)}>
                {busy === "send"
                  ? "Sending code…"
                  : codeSentTo && codeSentTo === email
                    ? "Continue to verification"
                    : "Send verification code"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
