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
├── hooks/                 # useApi (loading/error state), useTheme, useMediaQuery
├── components/            # TopBar, BottomNav, cards, modals, drawers, comments
├── pages/                 # AuthPage, FeedPage, CommunitiesPage,
│                          # CommunityDetailPage, PlannerPage, ProfilePage
├── utils/                 # date formatting, clash detection, constants, image URLs
└── index.css              # design tokens (light + dark) and base styles
```

## Pages

| Route              | Page                | Backend endpoints used |
| ------------------ | ------------------- | ---------------------- |
| `/login`           | Login / sign up     | `POST /login`, `POST /register` |
| `/home`            | Home feed           | `/me/communities`, `/me/events`, `/communities/:id/events` |
| `/communities`     | Directory           | `GET/POST /communities`, join / leave |
| `/communities/:id` | Community page      | community, events, posts, members, create event / post |
| (drawer)           | Event details       | `/events/:id/rsvp(s)`, `/events/:id/comment(s)` |
| (drawer)           | Post details        | `/posts/:id/comment(s)`, `/users/:id` |
| `/planner`         | Personal planner    | `/me/events` (Calendar and All events tabs, clash detection) |
| `/profile`         | Profile             | `GET/PUT /me` |

## Planner calendar

The calendar is [FullCalendar](https://fullcalendar.io/) v6 (MIT, no API key).
Overlapping upcoming events get a warning sign on the event and on the day.
It is themed with our design tokens in `components/PlannerCalendar.css` and
shows times in the browser's timezone. Run `npm install` after pulling.

## Images

Events and the profile show a placeholder (`public/placeholders/`) until the backend
has an image. All assumptions about the backend are in `utils/media.js`:

- Events use the existing `image_url` field.
- Profiles expect `image_url` on `GET /me`. Rename it there if the backend differs.
- Values can be full `http(s)` URLs or paths served by the backend (`/uploads/x.png`).

## Waiting on backend

- **Images**: `POST` events drops `image_url`, users have no image field, and there is no upload API.
- **Posts**: no author name or `created_at` in the response; names are looked up with `/users/:id`.
  Text is capped at 500 characters in the UI because that is the size of the DB column.
- **`GET /users/:id/feed`**: the feed is currently assembled in `loadFeed()` (`FeedPage.jsx`).
- **`GET /departments`**: departments come from `utils/constants.js` for now.
- **Community categories / club info**: not returned by `/communities` yet.
