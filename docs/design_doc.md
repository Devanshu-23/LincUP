# LincUp - design doc

## Team Ownership

### D : Activities, Posts & Database

- db schema and models
- course and department scraping (might not need now but can use for profile? argh)
- activities and posts APIs
- RSVP toggle(marking interested for activities) and personal planner.  // use something other than rsvp? like interested or
- comments and discussion threads
- home feed queries (thinking of whowing activites that are rsvped and at bottom communities you are a member of)
- database seeding and final merges

### V : Auth & Communities Backend - FastAPI

- signup and login
- password hashing and email verification
- Pydantic schemas
- communities APIs
- community creation and listing
- join/leave functionality
- official club information

### A : Frontend - React

- signup and login UI
- bottom navigation (Feed, Communities, Planner)
- home feed and community cards
- communities directory
- community detail page
- activities and general posts tabs
- personal planner
- comments drawer
- API integration

## 2. Navigation Flow & Pages

![1793651103777](image/design_doc/1793651103777.png)

### Home page tabs

Tab 1: Home Feed (`/home`) 

- Upcoming RSVP'd activities and posts
- Joined community cards

Tab 2: Communities (`/communities`)

- Browse all communities
- Join/leave communities
- Open community pages

Tab 3: Planner (`/planner`)

- All RSVP'd activities and posts
- Chronological schedule
- Remove RSVP or view discussions

### Other pages

Community Page (`/communities/:id`)

- Community details and club info
- Join/leave toggle
- Activities tab (official club events)
- General Posts tab (student hangouts)
- Create activity or post

Comments Drawer

- Activity/post details
- RSVP count
- Live discussion thread

## 3. Database Schema (`app/models.py`)

### Users (V / D)

- id, full\_name, email
- department, degree\_program, study\_year
- password\_hash, email\_verified, created\_at

### Communities (V)

- id, name, category, description
- club\_name, club\_info
- created\_by, created\_at

### Memberships (V)

- id, user\_id, community\_id
- role, joined\_at

### Activities (D)

- id, community\_id, title, description
- location, start\_time, created\_by, created\_at

### Posts (D)

- id, community\_id, title, content
- location, event\_time, author\_id, created\_at

### RSVPs (D) 

- id, user\_id, activity\_id, post\_id
- created\_at

### Comments (V)

- id, user\_id, activity\_id, post\_id
- comment\_text, created\_at

// check if both a..id and p..id needed or can be merged into one single id of some kind that if start with A activity and P for post

### Email Verification Tokens (V)

- id, user\_id, token\_hash
- expires\_at, used\_at, created\_at

## 4. Backend APIs

### Auth & Communities (V)

- `POST /register` — Register student
- `POST /login` — Login
- `GET /communities` — List communities
- `POST /communities` — Create community
- `GET /communities/:id` — Get community details
- `POST /communities/:id/join` — Join community.  // membership and all that sir has added will need to be checked if needed or not
- `DELETE /communitites/:id/leave` leave community
- `GET /comments` — Get comments
- `POST /comments` — Add comment

### Activities, Posts & Discussions (D)

- `GET /departments` — List departments
- `GET /users/:id/feed` — Get home feed
- `GET /users/:id/planner` — Get personal planner
- `GET /communities/:id/activities` — List activities
- `POST /communities/:id/activities` — Create activity
- `GET /communities/:id/posts` — List posts
- `POST /communities/:id/posts` — Create post
- `POST /rsvps` — Toggle RSVP
- 

## 5. Frontend Files (`frontend/src/`)

- `pages/AuthPage.jsx` — Login and signup
- `components/BottomNav.jsx` — Bottom navigation
- `pages/FeedPage.jsx` — Home feed
- `pages/CommunitiesPage.jsx` — Communities directory
- `pages/CommunityDetailPage.jsx` — Community details and tabs
- `pages/PlannerPage.jsx` — Personal planner
- `components/CommentsSection.jsx` — Discussion section    // rename?
- `api/client.js` — Backend API integration
