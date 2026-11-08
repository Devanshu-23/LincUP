from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Community, Membership, Event, EventRSVP, Comment
from app.DbAPIStructures import UserCreate, CommunityCreate, EventCreate, UserProfileUpdate, CommentCreate
from app.security import hash_password, verify_password
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.auth import create_access_token, verify_access_token
from fastapi.middleware.cors import CORSMiddleware

import os

app = FastAPI(title="LincUP API")
#cors middleware to allow frontend to also access these apis
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
SESSION_COOKIE = "lincup_session"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Provide a database session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Welcome to LincUP API"}


# @app.get("/hello")
# def hello():
#     return {"message": "Hello, LincUP!"}


@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    request: UserCreate,
    db: Session = Depends(get_db),
):
    email = str(request.email).strip().lower()

    # Check whether this email is already registered
    existing_user = (db.query(User).filter(User.email == email).first())

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already registered",
        )

    # Create and save the user
    user = User(
        full_name=request.full_name,
        email=email,
        department=request.department,
        degree_program=request.degree_program,
        study_year=request.study_year,
        password_hash=hash_password(request.password),
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User Registration failed",
        )

    return {
        "message": "User Registration successful",
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "department": user.department,
        "degree_program": user.degree_program,
        "study_year": user.study_year,
    }

@app.post("/login")
def login(
    response: Response,
    email: str,
    password: str,
    db: Session = Depends(get_db),
):
    email = email.strip().lower()

    user = db.query(User).filter(User.email == email).first()

    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(user.id)

    response.set_cookie(
        key=SESSION_COOKIE,
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=30 * 60,
        path="/",
    )

    return {
        "message": "Login successful",
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
    }
#Access Token with validity period

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
):
    token = request.cookies.get(SESSION_COOKIE)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in",
        )

    try:
        user_id = verify_access_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please log in again.",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found. Please log in again.",
        )

    return user

#Function for Verifying the privilege level of user before giving him access to privileged functionalities, #future scope for now
def verify_community_privilege(
    community_id: int,
    current_user: User,
    db: Session,
):
    #Check whether the community exists
    community = (
        db.query(Community)
        .filter(Community.id == community_id)
        .first()
    )

    if community is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found",
        )

    # Find the user's membership
    membership = (
        db.query(Membership)
        .filter(
            Membership.community_id == community_id,
            Membership.user_id == current_user.id,
        )
        .first()
    )

    # Check whether the user is a member
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this community",
        )

    # Check the user's privilege level
    if membership.role not in ["owner", "convener"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to perform this action",
        )

    return membership

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key=SESSION_COOKIE,
        path="/",
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
    )

    return {"message": "Logged out successfully"}

@app.get("/session-check")
def session_check(
    current_user: User = Depends(get_current_user),
):
    return {
        "message": "You are logged in",
        "user_id": current_user.id,
        "full_name": current_user.full_name,
    }

# API to get the profile of the currently logged-in user
@app.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "department": current_user.department,
        "degree_program": current_user.degree_program,
        "study_year": current_user.study_year,
        "created_at": current_user.created_at,
    }

# API to update the profile of the currently logged-in user
@app.put("/me")
def update_my_profile(
    request: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:

        current_user.full_name = request.full_name
        current_user.department = request.department
        current_user.degree_program = request.degree_program
        current_user.study_year = request.study_year

        db.commit()
        db.refresh(current_user)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile",
        )

    return {
        "message": "Profile updated successfully",
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "department": current_user.department,
        "degree_program": current_user.degree_program,
        "study_year": current_user.study_year,
        "created_at": current_user.created_at,
    }


# API to get the public profile of another student

@app.get("/users/{user_id}")
def get_user_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find the requested user
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    # Check whether the user exists
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Return public profile information
    return {
        "id": user.id,
        "full_name": user.full_name,
        "department": user.department,
        "degree_program": user.degree_program,
        "study_year": user.study_year,
    }

#community

@app.get("/communities") #Get all existing communities
def list_communities(db: Session = Depends(get_db)):
    communities = db.query(Community).order_by(Community.id).all()

    return [
        {
            "id": community.id,
            "name": community.name,
            "description": community.description,
            "created_by": community.created_by,
        }
        for community in communities
    ]

@app.get("/communities/{community_id}") #Get community in specific
def get_community(
    community_id: int,
    db: Session = Depends(get_db)
):
    community = db.query(Community).filter(
        Community.id == community_id
    ).first()

    if community is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found"
        )

    return {
        "id": community.id,
        "name": community.name,
        "description": community.description,
        "created_by": community.created_by,
    }

#creating new communities

@app.post("/communities", status_code=status.HTTP_201_CREATED)
def create_community(
    request: CommunityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    existing = (
        db.query(Community)
        .filter(Community.name == request.name)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A community with this name already exists",
        )

    # Create the community using the logged-in user's ID
    community = Community(
        name=request.name,
        description=request.description,
        created_by=current_user.id,
    )

    try:
        db.add(community)

        # Get the new community ID before creating its membership
        db.flush()

        # Automatically make the creator an owner and member
        membership = Membership(
            user_id=current_user.id,
            community_id=community.id,
            role="owner",
        )

        db.add(membership)

        # Save both records together
        db.commit()
        db.refresh(community)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create community",
        )

    return {
        "id": community.id,
        "name": community.name,
        "description": community.description,
        "created_by": community.created_by,
        "role": "owner",
    }

#API for joining the communities

@app.post("/communities/{community_id}/join")
def join_community(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check that the community exists
    community = (
        db.query(Community)
        .filter(Community.id == community_id)
        .first()
    )

    if community is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found",
        )

    # Check whether this user has already joined
    existing_membership = (
        db.query(Membership)
        .filter(
            Membership.user_id == current_user.id,
            Membership.community_id == community_id,
        )
        .first()
    )

    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already joined this community",
        )

    # Create the membership for the logged-in user
    membership = Membership(
        user_id=current_user.id,
        community_id=community_id,
        role="member",
    )

    try:
        db.add(membership)
        db.commit()
        db.refresh(membership)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join community",
        )

    return {
        "message": "Successfully joined community",
        "community_id": community_id,
        "membership_id": membership.id,
        "role": membership.role,
    }
#Display communities which we have joined

@app.get("/me/communities")
def get_my_communities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memberships = (
        db.query(Membership)
        .filter(Membership.user_id == current_user.id)
        .all()
    )

    return [
        {
            "id": membership.community.id,
            "name": membership.community.name,
            "description": membership.community.description,
            "joined_at": membership.joined_at,
            "role": membership.role,
        }
        for membership in memberships
    ]

#Exiting the community

@app.delete("/communities/{community_id}/leave")
def leave_community(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check whether the community exists
    community = (
        db.query(Community)
        .filter(Community.id == community_id)
        .first()
    )

    if community is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found",
        )

    # Check whether the user is a member of this community
    membership = (
        db.query(Membership)
        .filter(
            Membership.user_id == current_user.id,
            Membership.community_id == community_id,
        )
        .first()
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are not a member of this community",
        )

    # Prevent the community owner from leaving 
    if community.created_by == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Community owners cannot leave their own community",
        )

    try:
        # Find all events belonging to this community
        community_event_ids = (
            db.query(Event.id)
            .filter(Event.community_id == community_id)
            .subquery()
        )

        # Cancel all active event RSVPs made by this user
        db.query(EventRSVP).filter(
            EventRSVP.user_id == current_user.id,
            EventRSVP.event_id.in_(community_event_ids),
            EventRSVP.status == "going",
        ).update(
            {EventRSVP.status: "cancelled"},
            synchronize_session=False,
        )

        # Remove the user's community membership
        db.delete(membership)

        # Save both changes together
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to leave community",
        )

    return {
        "message": "Successfully left community",
        "community_id": community_id,
    }

#Event creation by community creator only

@app.post(
    "/communities/{community_id}/events",
    status_code=status.HTTP_201_CREATED,
)
def create_community_event(
    community_id: int,
    request: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    community = (
        db.query(Community)
        .filter(Community.id == community_id)
        .first()
    )

    if community is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found",
        )

    # Only the creator of this community may create its events
    if community.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You don't have permission to create events for "
                "this community. Please contact the community creator."
            ),
        )

    event = Event(
        community_id=community.id,
        created_by=current_user.id,
        title=request.title,
        description=request.description,
        start_at=request.start_at,
        end_at=request.end_at,
        location=request.location,
    )

    try:
        db.add(event)
        db.commit()
        db.refresh(event)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create event",
        )

    return {
        "id": event.id,
        "community_id": event.community_id,
        "created_by": event.created_by,
        "title": event.title,
        "description": event.description,
        "start_at": event.start_at,
        "end_at": event.end_at,
        "location": event.location,
        "image_url": event.image_url,
    }

#Fetch events pertaining to a community

@app.get("/communities/{community_id}/events")
def list_community_events(
    community_id: int,
    db: Session = Depends(get_db),
):
    # Check that the community exists
    community = (
        db.query(Community)
        .filter(Community.id == community_id)
        .first()
    )

    if community is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found",
        )

    # Retrieve events for this community, earliest first
    events = (
        db.query(Event)
        .filter(Event.community_id == community_id)
        .order_by(Event.start_at)
        .all()
    )

    return [
        {
            "id": event.id,
            "community_id": event.community_id,
            "created_by": event.created_by,
            "title": event.title,
            "description": event.description,
            "start_at": event.start_at,
            "end_at": event.end_at,
            "location": event.location,
            "image_url": event.image_url,
        }
        for event in events
    ]

#Attend Events organized by community

@app.post("/events/{event_id}/rsvp", status_code=status.HTTP_201_CREATED)
def attend_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check whether the event exists
    event = (
        db.query(Event)
        .filter(Event.id == event_id)
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # Check whether the user belongs to this community
    membership = (
        db.query(Membership)
        .filter(
            Membership.user_id == current_user.id,
            Membership.community_id == event.community_id,
        )
        .first()
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Join this community before attending its events",
        )

    # Check for an existing rsvp record
    rsvp = (
        db.query(EventRSVP)
        .filter(
            EventRSVP.event_id == event_id,
            EventRSVP.user_id == current_user.id,
        )
        .first()
    )

    try:
        if rsvp is not None:
            db.delete(rsvp)
            db.commit()
            return {
                "message": "RSVP removed",
                "event_id": event_id,
                "user_id": current_user.id,
                "status": "not going",
            }

        else:
            rsvp = EventRSVP(
                event_id=event_id,
                user_id=current_user.id,
                status="going",
            )
            db.add(rsvp)
            db.commit()
            db.refresh(rsvp)
            return {
                "message": "Successfully RSVPd for the event",
                "event_id": event_id,
                "user_id": current_user.id,
                "status": rsvp.status,
            }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register rsvp",
        )


#API to choose to abstain from attending the event which was previously opted to attend
# tried going/notgoing in single api , will use this again if that really didnt work out as planned
# @app.delete("/events/{event_id}/attend")
# def cancel_event_attendance(
#     event_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
# ):
#     # Check whether the event exists
#     event = (
#         db.query(Event)
#         .filter(Event.id == event_id)
#         .first()
#     )

#     if event is None:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Event not found",
#         )

#     # Find this user's rsvp record
#     rsvp = (
#         db.query(EventRSVP)
#         .filter(
#             EventRSVP.event_id == event_id,
#             EventRSVP.user_id == current_user.id,
#         )
#         .first()
#     )

#     if rsvp is None or rsvp.status != "going":
#         raise HTTPException(
#             status_code=status.HTTP_409_CONFLICT,
#             detail="You are not currently attending this event",
#         )

#     # Change status instead of deleting the record
#     rsvp.status = "cancelled"

#     try:
#         db.commit()
#     except Exception:
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Failed to cancel rsvp",
#         )

#     return {
#         "message": "Attendance successfully cancelled",
#         "event_id": event_id,
#         "user_id": current_user.id,
#         "status": rsvp.status,
#     }

#Events being attended by a specific logged in user

@app.get("/me/events")
def get_my_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rsvps = (
        db.query(EventRSVP)
        .filter(
            EventRSVP.user_id == current_user.id,
        )
        .all()
    )

    events = []

    for rsvp in rsvps:
        event = (
            db.query(Event)
            .filter(Event.id == rsvp.event_id)
            .first()
        )

        if event is None:
            continue

        events.append({
            "id": event.id,
            "community_id": event.community_id,
            "title": event.title,
            "description": event.description,
            "start_at": event.start_at,
            "end_at": event.end_at,
            "location": event.location,
            "image_url": event.image_url,
        })

    return events

#Endpoint for getting list of all participants of a community

@app.get("/communities/{community_id}/members")
def get_community_members(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    # Check whether the community exists
    community = (
        db.query(Community)
        .filter(Community.id == community_id)
        .first()
    )

    if community is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found",
        )

    # Check whether the requesting user is a member
    membership = (
        db.query(Membership)
        .filter(
            Membership.community_id == community_id,
            Membership.user_id == current_user.id,
        )
        .first()
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of this community to view its participants",
        )

    # Fetch all community participants
    members = (
        db.query(Membership, User)
        .join(User, Membership.user_id == User.id)
        .filter(Membership.community_id == community_id)
        .all()
    )

    return [
        {
            "user_id": user.id,
            "full_name": user.full_name,
            "department": user.department,
            "degree_program": user.degree_program,
            "study_year": user.study_year,
            "role": membership.role,
            "joined_at": membership.joined_at,
        }
        for membership, user in members
    ]
#Endpoint for finding all the rsvps of an event

@app.get("/events/{event_id}/rsvps")
def get_event_rsvps(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    # Check whether the event exists
    event = (
        db.query(Event)
        .filter(Event.id == event_id)
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # Check whether the requesting user belongs to the event's community
    membership = (
        db.query(Membership)
        .filter(
            Membership.community_id == event.community_id,
            Membership.user_id == current_user.id,
        )
        .first()
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of this community to view event rsvps",
        )

    # Fetch all users who are currently attending
    rsvps = (
        db.query(EventRSVP, User)
        .join(User, EventRSVP.user_id == User.id)
        .filter(
            EventRSVP.event_id == event_id,
            # EventRSVP.status == "going",
        )
        .all()
    )

    return [
        {
            "user_id": user.id,
            "full_name": user.full_name,
            "department": user.department,
            "degree_program": user.degree_program,
            "study_year": user.study_year,
        }
        for rsvp, user in rsvps
    ]

@app.post("/events/{event_id}/comment", )
def add_event_comment(
    event_id: int,
    req: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = (db.query(Event).filter(Event.id == event_id).first())
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    comment = Comment(user_id = current_user.id, event_id = event_id, content = req.content)
    try: 
        db.add(comment)
        db.commit()
        db.refresh(comment)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Comment not created")

    return {
        "id": comment.id,
        "author": {
            "id": current_user.id,
            "full_name": current_user.full_name
        },
        # "event": {
        #     "id": event.id,
        #     "title": event.title
        # },
        "event_id": comment.event_id,
        "content": comment.content,
        "created_at": comment.created_at
    }

@app.get("/events/{event_id}/comments")
def get_event_comments(
    event_id: int, 
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No such event exist.")

    comments = db.query(Comment).filter(Comment.event_id == event_id).order_by(Comment.created_at.asc()).all()

    return [
        {
            "id": comment.id,
            "author": {
                "id": comment.writer.id,
                "full_name": comment.writer.full_name
            },
            "event_id": comment.event_id,
            "content": comment.content,
            "created_at": comment.created_at
        }
        for comment in comments
    ]

    
    