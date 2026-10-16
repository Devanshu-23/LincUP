from fastapi import FastAPI, status
from pydantic import BaseModel


app = FastAPI()


@app.get("/hello", status_code=status.HTTP_200_OK)
def hello():
    return {"message": "Hello, LincUP!"}

@app.get("/search")
def search(course_ID: str, skill: str):
    return {"course_ID" : course_ID,
            "skill" : skill,
            "message" : f"Searching for {skill} in course {course_ID}"
            }

class Student(BaseModel):
    name: str
    course: str
    skill: str

class StudentResponse(BaseModel):
    name: str
    course: str
    
@app.post(
    "/students",
    status_code=status.HTTP_201_CREATED,
    response_model=StudentResponse
)
def create_student(student: Student):
    return {
        "name": student.name,
        "course": student.course,
        "skill": student.skill
    }