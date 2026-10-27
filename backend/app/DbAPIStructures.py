
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional


class Request4registration(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    department: str = Field(min_length=2, max_length=150)
    degree_program: str
    study_year: int = Field(ge=1)

    @field_validator("full_name", "department")
    @classmethod
    def strip_whitespace(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty")
        return value

    @field_validator("email")
    @classmethod
    def email_accept(cls, email):
        email = str(email).strip().lower()

        if not email.endswith("@iitb.ac.in"):
            raise ValueError("Only IIT Bombay email addresses are allowed")

        return email

    @field_validator("password")
    @classmethod
    def password_accept(cls, password):
        if not any(char.isalpha() for char in password):
            raise ValueError("Password must contain a letter")

        if not any(char.isdigit() for char in password):
            raise ValueError("Password must contain a digit")

        if not any(not char.isalnum() for char in password):
            raise ValueError("Password must contain a special character")

        return password

#Community GET Request
class Request4community(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("Community name cannot be empty")
        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value):
        if value is not None:
            value = value.strip()
        return value