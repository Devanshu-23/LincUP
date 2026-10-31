from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Community, Membership, CommunityEvent, EventAttendance
from app.DbAPIStructures import Request4registration, Request4community, Request4event
from app.security import hash_password, verify_password
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.auth import create_access_token, verify_access_token

import os

from jose import JWTError


app = FastAPI(title="LincUP API")
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


@app.get("/hello")
def hello():
    return {"message": "Hello, LincUP!"}


@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    request: Request4registration,
    db: Session = Depends(get_db),
):
    email = str(request.email).strip().lower()

    # Check whether this email is already registered
    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

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
            detail="Registration failed",
        )

    return {
        "message": "Registration successful",
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

#Function for Verifying the privilege level of user before giving him access to privileged functionalities
 
def verify_community_privilege(
    community_id: int,
    current_user: User,
    db: Session,
):
    # 1. Check whether the community exists
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

    # 2. Find the user's membership
    membership = (
        db.query(Membership)
        .filter(
            Membership.community_id == community_id,
            Membership.user_id == current_user.id,
        )
        .first()
    )

    # 3. Check whether the user is a member
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this community",
        )

    # 4. Check the user's privilege level
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
    request: Request4community,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check whether a community with this name already exists
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

@app.get("/my-communities")
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
    # 1. Check whether the community exists
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

    # 2. Check whether the user is a member of this community
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

    # 3. Prevent the community owner from leaving
    if community.created_by == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Community owners cannot leave their own community",
        )

    try:
        # 4. Find all events belonging to this community
        community_event_ids = (
            db.query(CommunityEvent.id)
            .filter(CommunityEvent.community_id == community_id)
            .subquery()
        )

        # 5. Cancel all active event RSVPs made by this user
        db.query(EventAttendance).filter(
            EventAttendance.user_id == current_user.id,
            EventAttendance.event_id.in_(community_event_ids),
            EventAttendance.status == "going",
        ).update(
            {EventAttendance.status: "cancelled"},
            synchronize_session=False,
        )

        # 6. Remove the user's community membership
        db.delete(membership)

        # 7. Save both changes together
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
    request: Request4event,
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

    event = CommunityEvent(
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
        db.query(CommunityEvent)
        .filter(CommunityEvent.community_id == community_id)
        .order_by(CommunityEvent.start_at)
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

@app.post("/events/{event_id}/attend", status_code=status.HTTP_201_CREATED)
def attend_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Check whether the event exists
    event = (
        db.query(CommunityEvent)
        .filter(CommunityEvent.id == event_id)
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # 2. Check whether the user belongs to this community
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

    # 3. Check for an existing attendance record
    attendance = (
        db.query(EventAttendance)
        .filter(
            EventAttendance.event_id == event_id,
            EventAttendance.user_id == current_user.id,
        )
        .first()
    )

    if attendance is not None:
        if attendance.status == "going":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You are already attending this event",
            )

        # Reactivate a previously cancelled RSVP
        attendance.status = "going"

    else:
        attendance = EventAttendance(
            event_id=event_id,
            user_id=current_user.id,
            status="going",
        )
        db.add(attendance)

    try:
        db.commit()
        db.refresh(attendance)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register attendance",
        )

    return {
        "message": "Successfully registered for the event",
        "event_id": event_id,
        "user_id": current_user.id,
        "status": attendance.status,
    }

#API to choose to abstain from attending the event which was previously opted to attend


@app.delete("/events/{event_id}/attend")
def cancel_event_attendance(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Check whether the event exists
    event = (
        db.query(CommunityEvent)
        .filter(CommunityEvent.id == event_id)
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # 2. Find this user's attendance record
    attendance = (
        db.query(EventAttendance)
        .filter(
            EventAttendance.event_id == event_id,
            EventAttendance.user_id == current_user.id,
        )
        .first()
    )

    if attendance is None or attendance.status != "going":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are not currently attending this event",
        )

    # 3. Change status instead of deleting the record
    attendance.status = "cancelled"

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel attendance",
        )

    return {
        "message": "Attendance successfully cancelled",
        "event_id": event_id,
        "user_id": current_user.id,
        "status": attendance.status,
    }

#Events being attended by a specific logged in user

@app.get("/my-events")
def get_my_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attendances = (
        db.query(EventAttendance)
        .filter(
            EventAttendance.user_id == current_user.id,
            EventAttendance.status == "going",
        )
        .all()
    )

    events = []

    for attendance in attendances:
        event = (
            db.query(CommunityEvent)
            .filter(CommunityEvent.id == attendance.event_id)
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
            "attendance_status": attendance.status,
        })

    return events

#Endpoint for getting list of all participants of a community

@app.get("/communities/{community_id}/members")
def get_community_members(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    # 1. Check whether the community exists
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

    # 2. Check whether the requesting user is a member
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

    # 3. Fetch all community participants
    members = (
        db.query(Membership, User)
        .join(User, Membership.user_id == User.id)
        .filter(Membership.community_id == community_id)
        .all()
    )

    # 4. Prepare the response
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
#Endpoint for finding all the attendees of an event

@app.get("/events/{event_id}/attendees")
def get_event_attendees(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    # 1. Check whether the event exists
    event = (
        db.query(CommunityEvent)
        .filter(CommunityEvent.id == event_id)
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # 2. Check whether the requesting user belongs to the event's community
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
            detail="You must be a member of this community to view event attendees",
        )

    # 3. Fetch all users who are currently attending
    attendees = (
        db.query(EventAttendance, User)
        .join(User, EventAttendance.user_id == User.id)
        .filter(
            EventAttendance.event_id == event_id,
            EventAttendance.status == "going",
        )
        .all()
    )

    # 4. Prepare the response
    return [
        {
            "user_id": user.id,
            "full_name": user.full_name,
            "department": user.department,
            "degree_program": user.degree_program,
            "study_year": user.study_year,
        }
        for attendance, user in attendees
    ]