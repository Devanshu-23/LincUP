# LincUP Frontend

React + Vite frontend for LincUP, the IIT Bombay campus community platform.
Owner: Amish (see `docs/design_doc.md`).

## Getting started

```bash
# 1. start the backend (from backend/) on port 8000
uvicorn main:app --reload --port 8000

# 2. start the frontend
cd frontend
npm install
npm run dev     # http://localhost:5173
```

During development Vite proxies every `/api/*` request to the backend
(`vite.config.js`), so the httpOnly session cookie works without CORS issues.
Point it at a different backend with `VITE_BACKEND_URL=http://host:port npm run dev`.

Other scripts: `npm run lint`, `npm run build`, `npm run preview`.

## Structure

```
src/
├── api/client.js          # every backend endpoint in one place
├── context/               # AuthProvider + useAuth (session from /me)
├── hooks/                 # useApi (loading/error state), useTheme
├── components/            # TopBar, BottomNav, cards, modals, EventDrawer, comments
├── pages/                 # AuthPage, FeedPage, CommunitiesPage,
│                          # CommunityDetailPage, PlannerPage, ProfilePage
├── utils/                 # date formatting, clash detection, constants
└── index.css              # design tokens (light + dark) and base styles
```

## Pages

| Route              | Page                | Backend endpoints used |
| ------------------ | ------------------- | ---------------------- |
| `/login`           | Login / sign up     | `POST /login`, `POST /register` |
| `/home`            | Home feed           | `/me/communities`, `/me/events`, `/communities/:id/events` |
| `/communities`     | Directory           | `GET/POST /communities`, join / leave |
| `/communities/:id` | Community page      | community, events, members, create event |
| (drawer)           | Event details       | `/events/:id/rsvp(s)`, `/events/:id/comment(s)` |
| `/planner`         | Personal planner    | `/me/events` (+ clash detection) |
| `/profile`         | Profile             | `GET/PUT /me` |

## Waiting on backend

- **General posts**: tab placeholder on the community page until the posts API exists.
- **`GET /users/:id/feed`**: the feed is currently assembled in `loadFeed()` (`FeedPage.jsx`).
- **`GET /departments`**: departments come from `utils/constants.js` for now.
- **Community categories / club info**: not returned by `/communities` yet.
