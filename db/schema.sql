
-- current schema , most prob will have to change but will update this as we go along

CREATE TABLE if not exists users (
    id varchar(10) primary key, -- was thinking of mapping enrollment id from email
    name varchar(20) not null, -- username
    email varchar(30) not null unique,
    password varchar(255) not null,
    branch varchar(20) not null, -- branch / programme or somehting, under consideration
    year int not null
);

create table if not exists departments (
    dept_code varchar(10) primary key, 
    dept_name varchar(100) not null
);

create table if not exists courses (
    -- id varchar(10) primary key,
    dept_code varchar(10) not null references departments(dept_code),
    course_code varchar(8) primary key,  -- unique course code so will have to update sem id every year or something or we can delete these and make new ones with same code but diff id and sem id so wont have to update enrolled and just truncate old course ids from there too
    course_name varchar(100) not null,
    instructor varchar(40) not null,
    year int not null,
    semester int not null
    -- sem_id varchar(10) references semester(id), -- 
);

create table if not exists skills (
    id varchar(10) primary key,
    name varchar(20) not null unique
);

create table if not exists user_skills (
    user_id varchar(10) references users(id),
    skill_id varchar(10) references skills(id),
    level int not null
);

-- // might not need this as the data has semester attribute
create table if not exists semester (
    id varchar(10) primary key,
    label varchar(10) not null unique, -- fall/spring
    year int not null,
    is_current boolean
);


create table if not exists enrolled (
    user_id varchar(10) references users(id),
    course_id varchar(10) references courses(id)
);

create table if not exists projects ( -- or teams? still considering 
    id varchar(10) primary key,
    name varchar(30) not null, -- unique ? project name? or team name? or both? even needed or not? is not null necessary?
    created_by varchar(10) references users(id)
);

create table if not exists members (
    user_id varchar(10) references users(id),
    project_id varchar(10) references projects(id)
);

create table if not exists posts (
    id varchar(10) primary key,
    type varchar(10) not null, -- announcement/discussion/doubt/finding someone or something else
    title varchar(30) not null,
    description text not null,
    skill_needed_id varchar(10) references skills(id), -- not sure if this is needed, will decide later, also if needed wont be just one skill
    -- cource_id , dont know is this is needed, will decide later
    created_by varchar(10) references users(id),
    created_at timestamp not null default current_timestamp -- 
);

create table if not exists applications (
    id varchar(10) primary key,
    user_id varchar(10) references users(id),
    post_id varchar(10) references posts(id),
    status varchar(10) not null
);

create table if not exists comments (
    id varchar(10) primary key,
    post_id varchar(10) references posts(id),
    user_id varchar(10) references users(id),
    content text not null,
    created_at timestamp not null default current_timestamp
)