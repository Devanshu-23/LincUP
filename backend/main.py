from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Community
from app.DbAPIStructures import Request4registration, Request4community
from app.security import hash_password, verify_password

app = FastAPI(title="LincUP API")

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
    email: str,
    password: str,
    db: Session = Depends(get_db),
):
    email = email.strip().lower()

    # Find the registered user
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # Use the same error for an unknown email or incorrect password
    if user is None or not verify_password(
        password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    return {
        "message": "Login successful",
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
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