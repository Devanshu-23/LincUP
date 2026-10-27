from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from app.DbAPIStructures import Request4registration
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