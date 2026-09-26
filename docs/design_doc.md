# LincUp - design doc

## Team Ownership

### D :

- db schema
- mathing engine,
- course scrapping from the department site(cse only for now),
- sql queries?,
- final merges

### A : Frontend - REACT

- signup and login
- search results
- posts

  - create posts
  - post lists
  - apply to posts
- live notifications
- customizing profile + skills form
- special roles based ui ?

### V: Backend - FastAPI

- authorization through otp
- course team search
- posts/application


## DB schema

### Users

- id
- name
- email
- branch
- year ?

### skills

- id
- name

### user skills

- user_id
- skill_id
- level

### Semesters

* id
* label
* is_current

### Courses

* id
* code
* name
* semester (Fall/Spring)
* year

### Enrollments

* user_id
* course_id

### Teams

* id
* course_id
* created_by

### Team Members

* team_id
* user_id

### Posts

* id
* type
* title
* description
* skill_needed_id
* course-id ??
* created_by

### Applications

* id
* post_id
* user_id
* status

### Comments

- id
- post_id
- user_id
- comment_text
- created_at

## Backend APIs



POST /auth/signup

POST /auth/verify-otp

GET  /me

PUT  /me/skills

GET  /courses               (D)

GET  /enrollments/me        (D)

GET  /search/course-team

POST /teams

POST /posts

GET  /posts

POST /posts/:id/apply

GET  /posts/:id/applicants

GET  /notifications

POST /posts/:id/comments

GET /posts/:id/comments
