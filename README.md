# LincUP — IIT Bombay Campus Community & Event Platform

LincUP is a full-stack web application built for IIT Bombay students (`@iitb.ac.in`) to discover campus communities, RSVP to official events, coordinate casual hangouts through community posts and time-slot polls, and manage schedules with automated clash detection.

---

## Tech Stack

* **Frontend:** React, Vite, React Router, FullCalendar (`@fullcalendar/react`), CSS with theme variables
* **Backend:** Python, FastAPI, SQLAlchemy ORM, Pydantic, `python-jose` (JWT), `passlib` / `bcrypt`, `smtplib`
* **Database:** PostgreSQL

---

## Code Organization

```text
.
├── README.md
├── backend/
│   ├── main.py                      # FastAPI application entry point and all REST API routes
│   ├── create_tables.py             # Script to create PostgreSQL tables from SQLAlchemy models
│   ├── data/
│   │   └── departments.csv          # Reference list of IIT Bombay academic departments
│   └── app/
│       ├── database.py              # SQLAlchemy engine, SessionLocal, and Base configuration
│       ├── models.py                # PostgreSQL ORM table definitions
│       ├── DbAPIStructures.py       # Pydantic request/response schemas and IITB email validators
│       ├── auth.py                  # JWT token creation and verification helpers
│       ├── security.py              # Password hashing and verification utilities
│       └── otp_service.py           # Email OTP generation, SMTP delivery, and verification
│
└── frontend/
    ├── eslint.config.js             # ESLint rules for React code quality
    ├── index.html                   # HTML entry template
    ├── package.json                 # Frontend dependencies and npm scripts
    ├── package-lock.json            # Locked dependency versions
    ├── vite.config.js               # Vite dev server and API proxy configuration
    ├── public/
    │   ├── favicon.svg              # Browser tab icon
    │   └── placeholders/
    │       ├── event.svg            # Fallback cover image for events
    │       └── profile.svg          # Fallback avatar image for user profiles
    └── src/
        ├── main.jsx                 # React root mount point
        ├── App.jsx                  # Top-level route definitions and auth wrapper
        ├── index.css                # Global theme tokens, light/dark mode variables, base styles
        ├── api/
        │   └── client.js            # Centralized fetch wrapper and API endpoint methods
        ├── context/
        │   ├── AuthContext.js       # React context object for authenticated user state
        │   └── AuthProvider.jsx     # Session restoration, login/logout state, and expiry handling
        ├── hooks/
        │   ├── useApi.js            # Reusable data-fetching hook with loading, error, and reload states
        │   ├── useMediaQuery.js     # Responsive viewport breakpoint hook
        │   └── useTheme.js          # Light/dark theme state and persistence hook
        ├── utils/
        │   ├── constants.js         # Static IIT Bombay departments, degree programs, and study years
        │   ├── format.js            # Date/time formatters, UTC parsing, and community color tone helpers
        │   ├── media.js             # Image URL validation and fallback helpers
        │   ├── roles.js             # Community role (owner, convener, member) permission helpers
        │   └── schedule.js          # Event sorting, day grouping, and time-overlap clash detection
        ├── pages/
        │   ├── AuthPage.jsx / .css             # Login and multi-step registration with OTP verification
        │   ├── FeedPage.jsx / .css             # Home feed showing upcoming events across joined communities
        │   ├── CommunitiesPage.jsx / .css      # Directory of all campus communities with search and creation
        │   ├── CommunityDetailPage.jsx / .css  # Community hub with Events, General Posts, and Members tabs
        │   ├── PlannerPage.jsx / .css          # Personal schedule with FullCalendar month/week views and clash alerts
        │   └── ProfilePage.jsx / .css          # Student profile viewer and editor
        └── components/
            ├── AppLayout.jsx / Layout.css      # Main authenticated shell combining TopBar and BottomNav
            ├── TopBar.jsx                      # Top navigation bar, theme toggle, and user menu
            ├── BottomNav.jsx                   # Mobile bottom navigation bar
            ├── navItems.js                     # Navigation route definitions
            ├── ProtectedRoute.jsx              # Route guard redirecting unauthenticated users to login
            ├── Avatar.jsx / .css               # User initials/image avatar component
            ├── CommunityCard.jsx / .css        # Community summary card for directory listings
            ├── CreateCommunityModal.jsx        # Modal form to create a new community
            ├── CreateEventModal.jsx            # Modal form for owners/conveners to create official events
            ├── CreatePostModal.jsx             # Modal form for members to publish general discussion posts
            ├── EventCard.jsx / .css            # Event preview card with date, venue, and RSVP status
            ├── EventDrawer.jsx                 # Side drawer with event details, RSVP toggle, attendees, and comments
            ├── EventImage.jsx / .css           # Event cover image renderer with fallback handling
            ├── PostCard.jsx / .css             # General post preview card
            ├── PostDrawer.jsx                  # Side drawer with post details, time-slot poll, and comments
            ├── PostPoll.jsx / .css             # Interactive time-slot poll creator, voting UI, and slot finalizer
            ├── PostsTab.jsx                    # Tab view listing general posts inside a community
            ├── CommentsSection.jsx             # Reusable threaded comment list and submission form
            ├── PlannerCalendar.jsx / .css      # FullCalendar integration with clash highlighting
            ├── DayAgenda.jsx                   # Side panel listing events for the selected calendar day
            ├── VerifyEmailStep.jsx / .css      # Registration step handling email OTP dispatch and verification
            ├── OtpInput.jsx / .css             # 4-digit OTP input box component
            ├── PasswordInput.jsx / .css        # Password field with visibility toggle
            ├── ImageLinkField.jsx / .css       # URL input with live image preview
            ├── Modal.jsx / .css                # Reusable modal dialog wrapper
            ├── Drawer.jsx / .css               # Reusable slide-over drawer wrapper
            ├── ConfirmDialog.jsx               # Confirmation prompt for destructive actions (e.g., deleting events)
            ├── EmptyState.jsx                  # Placeholder UI for empty lists or 404 states
            ├── Spinner.jsx                     # Loading indicator component
            ├── FallbackImage.jsx               # Image component that swaps to a placeholder on load error
            └── Icon.jsx                        # Centralized SVG icon set
```

## Role of Each Backend File

| File                               | Role                                                                                                                                                                                                    |
| :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `backend/main.py`                | FastAPI app entry point, CORS setup, cookie-based auth dependency, and all REST API endpoints (auth, OTP, profiles, communities, conveners, events, RSVPs, comments, posts, polls, and `/me/events`). |
| `backend/app/database.py`        | Configures the PostgreSQL connection engine, `SessionLocal` factory, and declarative `Base`.                                                                                                        |
| `backend/app/models.py`          | SQLAlchemy ORM table definitions (`User`, `Community`, `Membership`, `Event`, `EventRSVP`, `Post`, `Comment`, `PollOption`, `PollVote`).                                              |
| `backend/app/DbAPIStructures.py` | Pydantic schemas for request/response validation, including `@iitb.ac.in` email enforcement.                                                                                                          |
| `backend/app/auth.py`            | Generates and verifies signed JWT tokens stored in the `lincup_session` HttpOnly cookie.                                                                                                              |
| `backend/app/security.py`        | Password hashing and verification utilities.                                                                                                                                                            |
| `backend/app/otp_service.py`     | Generates 4-digit OTPs, sends them via Gmail SMTP, and verifies codes during registration.                                                                                                              |
| `backend/create_tables.py`       | Creates all PostgreSQL tables defined in `models.py`.                                                                                                                                                 |

---

## Role of Each Frontend File

### Core, API & State

| File                                      | Role                                                                                                                |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| `frontend/vite.config.js`               | Vite dev server config and `/api` proxy to FastAPI (`http://localhost:8000`) for session cookie support.        |
| `frontend/src/App.jsx`                  | Top-level router mapping `/login`, `/`, `/communities`, `/communities/:id`, `/planner`, and `/profile`. |
| `frontend/src/index.css`                | Global theme tokens, light/dark mode variables, and base styles.                                                    |
| `frontend/src/api/client.js`            | Centralized `fetch` wrapper with `credentials: "include"`, 401 expiry handling, and API endpoint methods.       |
| `frontend/src/context/AuthProvider.jsx` | Manages logged-in user state, restores sessions via `/me`, and redirects on expiry.                               |
| `frontend/src/utils/schedule.js`        | Chronological event sorting, day grouping, and overlapping schedule clash detection.                                |
| `frontend/src/utils/roles.js`           | Permission helpers for `owner`, `convener`, and `member` community roles.                                     |

### Pages & Key Feature Components

| File                               | Role                                                                                                                                 |
| :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| `pages/AuthPage.jsx`             | Login and multi-step registration with password confirmation and email OTP verification (`VerifyEmailStep.jsx`, `OtpInput.jsx`). |
| `pages/FeedPage.jsx`             | Home feed displaying upcoming events across joined communities.                                                                      |
| `pages/CommunitiesPage.jsx`      | Directory of all campus communities with search and community creation (`CreateCommunityModal.jsx`).                               |
| `pages/CommunityDetailPage.jsx`  | Community hub with join/leave actions, convener nomination, and tabs for Events, General Posts, and Members.                         |
| `pages/PlannerPage.jsx`          | Personal schedule combining `PlannerCalendar.jsx` (FullCalendar month/week grid), `DayAgenda.jsx`, and clash warnings.           |
| `pages/ProfilePage.jsx`          | Student profile viewer and editor (`PUT /me`).                                                                                     |
| `components/EventDrawer.jsx`     | Side drawer with event details, RSVP toggle, attendee list, event deletion, and comments.                                            |
| `components/PostDrawer.jsx`      | Side drawer for general community posts containing discussion comments and `PostPoll.jsx`.                                         |
| `components/PostPoll.jsx`        | Time-slot poll creator (1–3 options), voting UI, and slot finalizer that pushes winning slots to voters' planners.                  |
| `components/CommentsSection.jsx` | Reusable threaded comment list and submission form for events and posts.                                                             |
| `components/AppLayout.jsx`       | Authenticated shell combining `TopBar.jsx`, `BottomNav.jsx`, and `ProtectedRoute.jsx`.                                         |

## Local Setup & Running

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/lincup
SECRET_KEY=<your-jwt-secret>
EMAIL=<sender-gmail@gmail.com>
EMAIL_PASSWORD=<16-char-gmail-app-password>
```

Create the database tables and start the FastAPI server:

```bash
python create_tables.py  #already created
uvicorn main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## AI & External Resource Use Statement

### External Libraries & Datasets

- **Backend:** FastAPI, Uvicorn, SQLAlchemy, Psycopg2, Pydantic, `python-jose`, `passlib` (`bcrypt`), `python-dotenv`, and Python standard library modules (`smtplib`, `random`).
- **Frontend:** React, React DOM, React Router (`react-router-dom`), FullCalendar (`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`), and Vite.
- **Official Documentation Referred:**

  - **Backend:** FastAPI official documentation & security tutorial (adapted for JWT authentication in `auth.py` and API routing), SQLAlchemy ORM documentation, Pydantic documentation, and Python `smtplib` documentation (for email OTP dispatch).
  - **Frontend:** React official documentation, React Router documentation, Vite documentation, MDN Web Docs (`Intl.DateTimeFormat`, `fetch`, CSS variables), and FullCalendar documentation.
- **Frontend External Libraries & Resources:**

  - **FullCalendar:** Used for the calendar in the Planner page (month, week, and day views) rather than building the calendar from scratch ([https://fullcalendar.io](https://fullcalendar.io)).
  - **Google Fonts:** Used *Bricolage Grotesque* for headings and *Plus Jakarta Sans* for normal text ([https://fonts.google.com](https://fonts.google.com)).
  - **Icons:** Small SVG icons from Lucide icons ([https://lucide.dev](https://lucide.dev)).

### AI-Assisted / AI-Generated Code

* **`frontend/src/components/PostPoll.jsx` & `PostPoll.css`:** Generated with AI assistance for the time-slot poll creation form, vote percentage calculation, and slot finalization UI, then integrated and tested with the backend endpoints.
* **`frontend/src/components/CreatePostModal.jsx` :** Used AI assistance to generate the initial component boilerplate/layout for community post creation and comment threads, followed by manual customization and styling.
* **Backend REST APIs (`backend/main.py`):** Written by using FastAPI/SQLAlchemy official documentation and the APIs already written, with occasional AI reference for minor syntax patterns and minimal endpoint boilerplate (such as CORS middleware setup and polling route structure).

- **Role-Based Access in Communities:** AI assistance was taken partially in making the owner and convener permission check, and the convener nomination API.
- **Leave-Community API:** Made using AI assistance.
- **Backend Debugging:** AI tools were used to help find and fix errors during development.
- **Frontend AI-Assisted Features:** Core pages, layout were written manually; AI assistance was used for:
  - **Animations:** Modal pop-in and fade-in, drawer slide-in, bottom sheet slide-up on mobile, and the loading spinner.
  - **Dark / Light Mode:** Theme switch, saving the choice, and loading it before the page shows so the screen does not flash.
  - **Planner Calendar:** Connecting FullCalendar to events, colours for each community, and the clash warning when two events overlap.
  - **Logout:** Logging out automatically when the session cookie expires.
  - **OTP Sign-Up Step:** The multi-box code input (paste, backspace, move focus).
  - **Responsive Layout:** Making pages work on mobile (bottom navigation, drawers turning into bottom sheets).
  - **Frontend Debugging:** Finding and fixing bugs related to wrong timezone and CSS problems.
- **Documentation Formatting:** Took AI's help for formatting and organizing this markdown file.
