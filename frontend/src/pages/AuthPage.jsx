import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DEGREE_PROGRAMS, DEPARTMENTS, STUDY_YEARS } from "../utils/constants";
import "./AuthPage.css";

const EMPTY_SIGNUP = {
  full_name: "",
  email: "",
  password: "",
  department: "",
  degree_program: "",
  study_year: "",
};

// Same rules as the backend's UserCreate validator, checked early for nicer UX
function validateSignup(form) {
  if (form.full_name.trim().length < 2) return "Please enter your full name.";
  if (!form.email.trim().toLowerCase().endsWith("@iitb.ac.in"))
    return "Use your IIT Bombay email (ending in @iitb.ac.in).";
  if (form.password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(form.password)) return "Password must contain a letter.";
  if (!/\d/.test(form.password)) return "Password must contain a digit.";
  if (!/[^a-zA-Z0-9]/.test(form.password))
    return "Password must contain a special character.";
  if (!form.department) return "Please choose your department.";
  if (!form.degree_program) return "Please choose your degree program.";
  if (!form.study_year) return "Please choose your year of study.";
  return null;
}

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
  const [submitting, setSubmitting] = useState(false);

  // Where to go after logging in (the page that sent us here, or the feed)
  const redirectTo = location.state?.from?.pathname || "/home";

  if (user) return <Navigate to={redirectTo} replace />;

  const switchMode = (next) => {
    setMode(next);
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(loginForm.email.trim(), loginForm.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const problem = validateSignup(signupForm);
    if (problem) return setError(problem);
    setError("");
    setSubmitting(true);
    try {
      await register({
        ...signupForm,
        full_name: signupForm.full_name.trim(),
        email: signupForm.email.trim().toLowerCase(),
        study_year: Number(signupForm.study_year),
      });
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateSignup = (field) => (e) =>
    setSignupForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="auth-page">
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
            >
              Log in
            </button>
            <button
              role="tab"
              aria-selected={mode === "signup"}
              className={mode === "signup" ? "active" : ""}
              onClick={() => switchMode("signup")}
            >
              Sign up
            </button>
          </div>

          <h2>{mode === "login" ? "Welcome back 👋" : "Join LincUP"}</h2>
          <p className="muted auth-sub">
            {mode === "login"
              ? "Log in with your IITB email to see what's happening."
              : "Create your account with your @iitb.ac.in email."}
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          {mode === "login" ? (
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
                <input
                  id="login-password"
                  className="input"
                  type="password"
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
                disabled={submitting || !loginForm.email || !loginForm.password}
              >
                {submitting ? "Logging in…" : "Log in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} noValidate>
              <div className="field">
                <label htmlFor="su-name">Full name</label>
                <input
                  id="su-name"
                  className="input"
                  autoComplete="name"
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
                  onChange={updateSignup("email")}
                />
              </div>
              <div className="field">
                <label htmlFor="su-password">Password</label>
                <input
                  id="su-password"
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  value={signupForm.password}
                  onChange={updateSignup("password")}
                />
                <span className="field-hint">
                  8+ characters with a letter, a digit and a special character.
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
              <button className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
