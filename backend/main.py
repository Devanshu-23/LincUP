from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Community, Membership
from app.DbAPIStructures import Request4registration, Request4community
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

@app.post("/communities", status_code=status.HTTP_201_CREATED)
def create_community(
    request: Request4community,
    created_by: int,
    db: Session = Depends(get_db),
):
    # Check whether the creator exists
    creator = db.query(User).filter(User.id == created_by).first()

    if creator is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

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

    community = Community(
        name=request.name,
        description=request.description,
        created_by=created_by,
    )

    try:
        db.add(community)
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
    }

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