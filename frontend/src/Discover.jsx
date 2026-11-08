
import { useMemo, useState } from "react";
import "./Discover.css";

const opportunities = [
  {
    id: 1,
    type: "Project",
    category: "Course project",
    title: "Building an AI-powered study companion",
    description:
      "Looking for teammates to build a tool that helps students organize notes, discover resources, and study together.",
    author: "Aarav Mehta",
    initials: "AM",
    course: "CS",
    branch: "CSE",
    year: "2nd year",
    skills: ["Python", "React", "AI/ML"],
    needed: ["Frontend", "UI/UX"],
    spots: 2,
    color: "green",
  },
  {
    id: 2,
    type: "Project",
    category: "Personal project",
    title: "A better way to discover campus events",
    description:
      "Want to make a simple platform where students can find events, share plans, and discover things happening around campus.",
    author: "Isha Kapoor",
    initials: "IK",
    course: "Personal",
    branch: "Electrical",
    year: "2nd year",
    skills: ["JavaScript", "Design", "APIs"],
    needed: ["Backend", "Product ideas"],
    spots: 2,
    color: "purple",
  },
  {
    id: 3,
    type: "Activity",
    category: "Outdoor activity",
    title: "Sunrise hike and chai this Sunday",
    description:
      "Taking a break from screens and deadlines. Join us for a morning outdoors and a relaxed chai session afterward.",
    author: "Rohan Shah",
    initials: "RS",
    course: "Social",
    branch: "Mechanical",
    year: "3rd year",
    skills: ["Hiking", "Photography", "Good vibes"],
    needed: ["Anyone interested"],
    spots: 5,
    color: "orange",
  },
  {
    id: 4,
    type: "Event role",
    category: "Volunteering",
    title: "Help bring our student showcase to life",
    description:
      "We are organizing a student showcase and need enthusiastic volunteers to help with coordination and event operations.",
    author: "Priya Nair",
    initials: "PN",
    course: "Campus event",
    branch: "Chemical",
    year: "3rd year",
    skills: ["Teamwork", "Communication"],
    needed: ["Volunteers", "Coordination"],
    spots: 4,
    color: "blue",
  },
  {
    id: 5,
    type: "Project",
    category: "Course project",
    title: "Visualizing data that tells a story",
    description:
      "Looking for someone interested in data visualization to turn interesting datasets into clear, interactive stories.",
    author: "Kabir Rao",
    initials: "KR",
    course: "CS",
    branch: "CSE",
    year: "1st year",
    skills: ["Python", "Data analysis", "D3.js"],
    needed: ["Visualization", "Design"],
    spots: 1,
    color: "green",
  },
  {
    id: 6,
    type: "Event role",
    category: "Creative role",
    title: "Capture moments at our cultural evening",
    description:
      "We need a creative photographer or videographer to document performances, candid moments, and the people behind the event.",
    author: "Ananya Das",
    initials: "AD",
    course: "Campus event",
    branch: "Civil",
    year: "2nd year",
    skills: ["Photography", "Video editing"],
    needed: ["Photographer", "Videographer"],
    spots: 2,
    color: "pink",
  },
];

const categories = [
  "Everything",
  "Projects",
  "Activities",
  "Event roles",
];

const branches = [
  "All branches",
  "CSE",
  "Electrical",
  "Mechanical",
  "Chemical",
  "Civil",
];

const years = [
  "All years",
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
];

const skillOptions = [
  "Any skill",
  "Python",
  "React",
  "AI/ML",
  "Design",
  "Photography",
  "Data analysis",
  "JavaScript",
];

function Brand() {
  return (
    <span className="brand" aria-label="LincUP">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      <span>
        Linc<span className="brand-accent">UP</span>
      </span>
    </span>
  );
}

function DiscoverHeader({ theme, toggleTheme, onHome }) {
  return (
    <header className="site-header">
      <div className="container nav-container">
        <a
          className="discover-brand-link"
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            onHome();
          }}
        >
          <Brand />
        </a>

        <nav className="discover-nav" aria-label="Main navigation">
          <button
            className="discover-nav-active"
            type="button"
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
          >
            Discover
          </button>

          <a
            href="#opportunity-results"
            onClick={(event) => {
              event.preventDefault();
              document
                .getElementById("opportunity-results")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Opportunities
          </a>

          <a
            href="#community-note"
            onClick={(event) => {
              event.preventDefault();
              document
                .getElementById("community-note")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Community
          </a>

          <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span aria-hidden="true">
              {theme === "dark" ? "☀" : "☾"}
            </span>
            <span className="theme-toggle-label">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </span>
          </button>

          <button
            className="discover-profile"
            type="button"
            aria-label="Return to homepage"
            onClick={onHome}
          >
            Y
          </button>
        </nav>
      </div>
    </header>
  );
}

function OpportunityCard({ opportunity, interested, onInterest }) {
  return (
    <article className="discover-card">
      <div className="discover-card-top">
        <span className={`opportunity-icon ${opportunity.color}`}>
          {opportunity.type === "Project"
            ? "⌘"
            : opportunity.type === "Activity"
              ? "↗"
              : "♡"}
        </span>

        <span className="opportunity-type">
          {opportunity.category}
        </span>

        <button
          className={`save-button ${interested ? "saved" : ""}`}
          type="button"
          onClick={() => onInterest(opportunity.id)}
          aria-label={
            interested
              ? `Remove interest in ${opportunity.title}`
              : `Show interest in ${opportunity.title}`
          }
          aria-pressed={interested}
          title={interested ? "Interested" : "I'm interested"}
        >
          {interested ? "♥" : "♡"}
        </button>
      </div>

      <h3>{opportunity.title}</h3>

      <p className="discover-description">
        {opportunity.description}
      </p>

      <div className="discover-tags">
        {opportunity.skills.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>

      <div className="looking-for">
        <span className="looking-label">LOOKING FOR</span>

        <div className="discover-tags needed-tags">
          {opportunity.needed.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>

      <div className="discover-card-footer">
        <div className="opportunity-author">
          <span className={`author-avatar ${opportunity.color}`}>
            {opportunity.initials}
          </span>

          <div>
            <strong>{opportunity.author}</strong>
            <span>
              {opportunity.branch} · {opportunity.year}
            </span>
          </div>
        </div>

        <span className="spots-label">
          {opportunity.spots} spot
          {opportunity.spots === 1 ? "" : "s"} open
        </span>
      </div>

      <button
        className={`interest-button ${
          interested ? "interest-active" : ""
        }`}
        type="button"
        onClick={() => onInterest(opportunity.id)}
        aria-pressed={interested}
      >
        {interested ? "Interested ✓" : "I'm interested ↗"}
      </button>
    </article>
  );
}

function Discover({ theme, toggleTheme, onHome }) {
  const [category, setCategory] = useState("Everything");
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("All branches");
  const [year, setYear] = useState("All years");
  const [skill, setSkill] = useState("Any skill");
  const [interested, setInterested] = useState([]);

  const filteredOpportunities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return opportunities.filter((item) => {
      const searchableText = [
        item.title,
        item.description,
        item.author,
        item.category,
        item.course,
        item.branch,
        ...item.skills,
        ...item.needed,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesCategory =
        category === "Everything" ||
        (category === "Projects" && item.type === "Project") ||
        (category === "Activities" && item.type === "Activity") ||
        (category === "Event roles" && item.type === "Event role");

      const matchesBranch =
        branch === "All branches" || item.branch === branch;

      const matchesYear =
        year === "All years" || item.year === year;

      const matchesSkill =
        skill === "Any skill" ||
        [...item.skills, ...item.needed].some(
          (itemSkill) =>
            itemSkill.toLowerCase() === skill.toLowerCase()
        );

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBranch &&
        matchesYear &&
        matchesSkill
      );
    });
  }, [category, search, branch, year, skill]);

  function toggleInterest(id) {
    setInterested((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id]
    );
  }

  function resetFilters() {
    setCategory("Everything");
    setSearch("");
    setBranch("All branches");
    setYear("All years");
    setSkill("Any skill");
  }

  const hasFilters =
    category !== "Everything" ||
    search !== "" ||
    branch !== "All branches" ||
    year !== "All years" ||
    skill !== "Any skill";

  return (
    <div className={`site-shell theme-${theme} discover-page`}>
      <div className="announcement">
        <span className="announcement-dot" />
        Good things happen when we find our people.
      </div>

      <DiscoverHeader
        theme={theme}
        toggleTheme={toggleTheme}
        onHome={onHome}
      />

      <main>
        <section className="discover-hero">
          <div className="container">
            <div className="discover-welcome">
              <div>
                <p className="eyebrow">
                  YOUR CAMPUS, A LITTLE CLOSER
                </p>

                <h1>
                  Find your people.
                  <br />
                  <span className="serif-accent">
                    Find your thing.
                  </span>
                </h1>

                <p className="discover-intro">
                  Projects to build, plans to make, people to meet.
                  Your next great campus experience could start right
                  here.
                </p>
              </div>

              <div className="discover-welcome-note">
                <span aria-hidden="true">✳</span>
                <p>
                  You bring something unique.
                  <br />
                  <strong>
                    Find others who complement it.
                  </strong>
                </p>
              </div>
            </div>

            <div className="discover-search">
              <span className="search-symbol" aria-hidden="true">
                ⌕
              </span>

              <input
                type="search"
                aria-label="Search opportunities"
                placeholder="Search projects, skills, activities, people..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button
                  className="clear-search"
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}

              <span className="search-shortcut">DISCOVER</span>
            </div>

            <div
              className="category-tabs"
              aria-label="Opportunity category"
            >
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    category === item ? "category-active" : ""
                  }
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section
          className="discover-results-section"
          id="opportunity-results"
        >
          <div className="container">
            <div className="filter-layout">
              <aside className="filter-panel">
                <div className="filter-heading">
                  <h2>Refine your search</h2>
                  <button type="button" onClick={resetFilters}>
                    Reset
                  </button>
                </div>

                <label
                  className="filter-label"
                  htmlFor="branch-filter"
                >
                  Branch
                </label>

                <select
                  id="branch-filter"
                  value={branch}
                  onChange={(event) => setBranch(event.target.value)}
                >
                  {branches.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <label
                  className="filter-label"
                  htmlFor="year-filter"
                >
                  Academic year
                </label>

                <select
                  id="year-filter"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                >
                  {years.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <label
                  className="filter-label"
                  htmlFor="skill-filter"
                >
                  Skill or interest
                </label>

                <select
                  id="skill-filter"
                  value={skill}
                  onChange={(event) => setSkill(event.target.value)}
                >
                  {skillOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <div className="filter-note">
                  <span aria-hidden="true">♡</span>
                  <p>
                    Different strengths make stronger teams. Look
                    for the skills your project needs.
                  </p>
                </div>
              </aside>

              <div className="results-main">
                <div className="results-heading">
                  <div>
                    <p className="eyebrow">
                      OPPORTUNITIES AROUND YOU
                    </p>

                    <h2>
                      {category === "Everything"
                        ? "Explore the community"
                        : category}
                    </h2>

                    <p className="results-count">
                      {filteredOpportunities.length} opportunit
                      {filteredOpportunities.length === 1
                        ? "y"
                        : "ies"}{" "}
                      to discover
                    </p>
                  </div>

                  <span className="sample-label">
                    SAMPLE LISTINGS
                  </span>
                </div>

                {filteredOpportunities.length > 0 ? (
                  <div className="discover-grid">
                    {filteredOpportunities.map((opportunity) => (
                      <OpportunityCard
                        key={opportunity.id}
                        opportunity={opportunity}
                        interested={interested.includes(
                          opportunity.id
                        )}
                        onInterest={toggleInterest}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-results">
                    <span aria-hidden="true">⌕</span>
                    <h3>No matches just yet</h3>
                    <p>
                      Try a different search or clear a filter to
                      discover more opportunities.
                    </p>
                    <button
                      className="interest-button"
                      type="button"
                      onClick={resetFilters}
                    >
                      {hasFilters
                        ? "Clear all filters"
                        : "Explore all"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          className="discover-community"
          id="community-note"
        >
          <div className="container discover-community-inner">
            <div>
              <p className="eyebrow">SOMETHING MISSING?</p>

              <h2>
                Your idea could be
                <br />
                <span className="serif-accent">
                  someone else's next thing.
                </span>
              </h2>

              <p>
                Have a project, activity, or event role in mind? The
                best connections start when someone takes the first
                step.
              </p>
            </div>

            <button
              className="create-opportunity-button"
              type="button"
              onClick={() =>
                window.alert(
                  "Creating opportunities will be available when the posting flow is implemented."
                )
              }
            >
              Create an opportunity ↗
            </button>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} LincUP</span>
          <span>Made with care, for campus communities. ♡</span>
        </div>
      </footer>
    </div>
  );
}

export default Discover;
