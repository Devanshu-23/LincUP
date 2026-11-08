import Discover from "./Discover";
import { useEffect, useState } from "react";
import "./App.css";

const opportunities = [
  {
    number: "01",
    icon: "✳",
    type: "ACADEMIC",
    title: "Build something together.",
    description:
      "Find project partners who bring different skills, fresh perspectives, and the motivation to build something meaningful.",
    tags: ["Course projects", "Hackathons", "Research"],
    link: "#matching",
    theme: "sage",
  },
  {
    number: "02",
    icon: "↗",
    type: "EXPERIENCES",
    title: "Say yes to something new.",
    description:
      "Find people who want to explore the same interests, try a new activity, or turn a free afternoon into a memory.",
    tags: ["Hikes", "Sports", "Personal projects"],
    link: "#community",
    theme: "peach",
  },
  {
    number: "03",
    icon: "♡",
    type: "CAMPUS LIFE",
    title: "Make every event a team effort.",
    description:
      "Need a photographer, volunteers, or someone to help make your next campus event happen? Find them here.",
    tags: ["Volunteering", "Events", "Creative roles"],
    link: "#community",
    theme: "lavender",
  },
];

function Brand({ light = false }) {
  return (
    <a
      className={`brand ${light ? "brand-light" : ""}`}
      href="#home"
      aria-label="LincUP home"
    >
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      <span>
        Linc<span className="brand-accent">UP</span>
      </span>
    </a>
  );
}

function Arrow({ diagonal = false }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}

function OpportunityCard({ opportunity }) {
  return (
    <article className={`opportunity-card ${opportunity.theme}`}>
      <div className="card-top">
        <span className="card-icon" aria-hidden="true">
          {opportunity.icon}
        </span>
        <span className="card-number">{opportunity.number}</span>
      </div>

      <p className="eyebrow">{opportunity.type}</p>
      <h3>{opportunity.title}</h3>
      <p className="card-description">{opportunity.description}</p>

      <div className="tag-list">
        {opportunity.tags.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      <a className="card-link" href={opportunity.link}>
        Explore possibilities <Arrow diagonal />
      </a>
    </article>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("lincup-theme") || "dark",
  );

  useEffect(() => {
    localStorage.setItem("lincup-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");

  function handleJoin(event) {
    event.preventDefault();

    if (!email.trim()) {
      setNotice("Enter your college email to get started.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setNotice("Please enter a valid email address.");
      return;
    }

    // Demo only: real college verification will use the backend OTP API.
    setNotice(
      "You're ready to get started! College email verification will be available when authentication is connected.",
    );
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  if (currentPage === "discover") {
  return (
    <Discover
      theme={theme}
      toggleTheme={toggleTheme}
      onHome={() => setCurrentPage("home")}
    />
  );
  }

  return (
    <div id="home" className={`site-shell theme-${theme}`}>
      <div className="announcement">
        <span className="announcement-dot" />A little more connection can go a
        long way.
      </div>

      <header className="site-header">
        <div className="container nav-container">
          <Brand />

          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>

          <nav className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
            <a
              href="#discover"
              onClick={(event) => {
                event.preventDefault();
                closeMenu();
                setCurrentPage("discover");
              }}
            >
            Discover
            </a>
            <a href="#matching" onClick={closeMenu}>
              How it works
            </a>
            <a href="#community" onClick={closeMenu}>
              Community
            </a>
            <button
              className="theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
              <span className="theme-toggle-label">
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            </button>
            <a className="nav-join" href="#join" onClick={closeMenu}>
              Find your people <Arrow diagonal />
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero container">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="kicker-line" />
              MADE FOR CAMPUS LIFE
            </div>

            <h1>
              Life is better
              <br />
              when we build
              <br />
              <span className="heading-highlight">it together.</span>
            </h1>

            <p className="hero-description">
              Somewhere on your campus, someone shares your idea. Someone has
              the skill you need. Someone is looking for a person just like you.
              You just haven't met them yet.
            </p>

            <div className="hero-actions">
              <a className="button button-primary" href="#discover">
                Find your people <Arrow diagonal />
              </a>
              <a className="button button-secondary" href="#matching">
                Get to know LincUP <Arrow />
              </a>
            </div>

            <div className="hero-note">
              <span className="note-heart">♡</span>
              More than networking. A place to belong.
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />

            <div className="hero-image-frame">
              <img
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=85"
                alt="Friends spending time together outdoors"
              />
              <div className="image-caption">
                <span className="caption-heart">♡</span>
                <div>
                  <strong>Good things happen together.</strong>
                  <span>Start with one connection.</span>
                </div>
              </div>
            </div>

            <div className="floating-note note-top">
              <span className="floating-icon">✳</span>
              <span>
                <strong>Shared interests</strong>
                <small>Bring people closer</small>
              </span>
            </div>

            <div className="floating-note note-bottom">
              <span className="floating-icon people-icon">↗</span>
              <span>
                <strong>Complementary skills</strong>
                <small>Stronger teams start here</small>
              </span>
            </div>

            <span className="visual-spark spark-one">✳</span>
            <span className="visual-spark spark-two">✦</span>
          </div>
        </section>

        <section className="connection-strip">
          <div className="container strip-inner">
            <p>One campus. A thousand possibilities.</p>
            <div className="strip-items">
              <span>Ideas</span>
              <span className="strip-star">✳</span>
              <span>People</span>
              <span className="strip-star">✳</span>
              <span>Possibilities</span>
              <span className="strip-star">✳</span>
              <span>Belonging</span>
            </div>
          </div>
        </section>

        <section className="discover-section section-padding" id="discover">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">THERE'S A PLACE FOR YOU HERE</p>
                <h2>
                  What brings you
                  <br />
                  <span className="serif-accent">to the table?</span>
                </h2>
              </div>
              <p className="section-intro">
                Whatever you're dreaming up, curious about, or hoping to try,
                there's someone on campus who might want to be part of it.
              </p>
            </div>

            <div className="opportunity-grid">
              {opportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.number}
                  opportunity={opportunity}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="matching-section section-padding" id="matching">
          <div className="container matching-layout">
            <div className="matching-visual" aria-hidden="true">
              <div className="match-ring ring-one" />
              <div className="match-ring ring-two" />

              <div className="match-center">
                <span>✳</span>
                <strong>Better</strong>
                <strong>together.</strong>
              </div>

              <div className="skill-bubble bubble-top">
                <span className="bubble-symbol">⌘</span>
                <span>
                  <strong>Design</strong>
                  <small>Creative thinking</small>
                </span>
              </div>

              <div className="skill-bubble bubble-left">
                <span className="bubble-symbol">{"</>"}</span>
                <span>
                  <strong>Development</strong>
                  <small>Build it</small>
                </span>
              </div>

              <div className="skill-bubble bubble-right">
                <span className="bubble-symbol">◉</span>
                <span>
                  <strong>Research</strong>
                  <small>Find answers</small>
                </span>
              </div>
            </div>

            <div className="matching-copy">
              <p className="eyebrow">DIFFERENT STRENGTHS. SHARED AMBITION.</p>
              <h2>
                You don't need
                <br />
                another you.
                <br />
                <span className="serif-accent">You need your people.</span>
              </h2>

              <p>
                Great teams aren't made of people who all know the same things.
                They're made of people who bring different strengths to a shared
                goal.
              </p>

              <p>
                LincUP helps you discover teammates based on your skills,
                interests, course, branch, and year, so you can find people who
                complement what you bring.
              </p>

              <a className="text-link" href="#join">
                Find your kind of team <Arrow diagonal />
              </a>
            </div>
          </div>
        </section>

        <section className="community-section section-padding" id="community">
          <div className="container community-layout">
            <div className="community-copy">
              <p className="eyebrow">LIFE HAPPENS BETWEEN THE LECTURES</p>
              <h2>
                Make room for
                <br />
                <span className="serif-accent">the unexpected.</span>
              </h2>
              <p>
                A spontaneous hike. A side project that becomes something big.
                An event that needs one more helping hand. Campus life gets
                better when you have people to share it with.
              </p>
              <a className="button button-light" href="#discover">
                Explore opportunities <Arrow diagonal />
              </a>
            </div>

            <div className="community-quote">
              <span className="quote-mark">“</span>
              <blockquote>
                We're not meant to do everything alone. Sometimes, all it takes
                is finding the right people to begin.
              </blockquote>
              <div className="quote-decoration">
                <span />
                <span />
                <span />
              </div>
              <p>A campus feels smaller when we feel connected.</p>
            </div>
          </div>
        </section>

        <section className="join-section section-padding" id="join">
          <div className="container join-container">
            <span className="join-spark join-spark-one">✳</span>
            <span className="join-spark join-spark-two">✦</span>

            <p className="eyebrow">YOUR NEXT CONNECTION STARTS HERE</p>
            <h2>
              There's more out there.
              <br />
              <span className="serif-accent">Let's find it together.</span>
            </h2>
            <p className="join-description">
              Bring your ideas, your skills, your curiosity. There's a place for
              you in this community.
            </p>

            <form className="join-form" onSubmit={handleJoin}>
              <label className="visually-hidden" htmlFor="college-email">
                College email address
              </label>
              <input
                id="college-email"
                type="email"
                placeholder="Enter your college email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setNotice("");
                }}
                required
              />
              <button className="button button-primary" type="submit">
                Let's connect <Arrow diagonal />
              </button>
            </form>

            {notice && (
              <p className="form-notice" role="status">
                {notice}
              </p>
            )}

            <p className="join-footnote">
              Made for students. Built around real connections.
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-main">
          <div className="footer-brand">
            <Brand light />
            <p>
              A little less alone.
              <br />A lot more together.
            </p>
          </div>

          <div className="footer-links">
            <div>
              <strong>EXPLORE</strong>
              <a href="#discover">Opportunities</a>
              <a href="#matching">How it works</a>
              <a href="#community">Community</a>
            </div>
            <div>
              <strong>THE IDEA</strong>
              <a href="#home">Our purpose</a>
              <a href="#join">Join LincUP</a>
            </div>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} LincUP</span>
          <span>Made with care, for campus communities. ♡</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
