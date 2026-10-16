from curl_cffi import requests
import pandas as pd
from bs4 import BeautifulSoup

url = "https://portal.iitb.ac.in/asc/Courses"
b_url = "https://portal.iitb.ac.in/asc/"

YEAR = 2026
SEMESTER = 1 # FALL/AUTUMN ?

session = requests.Session()

headers = {
    "Referer": url,
    "Origin": "https://portal.iitb.ac.in/asc"
}

response = session.get(url)

soup = BeautifulSoup(response.content, "html.parser")

departments = []
for d in soup.find_all("a", attrs={"onclick": True}):
    name = d.get_text()
    codes = d["onclick"].split("'")[1].split(",")[:-1]
    for c in codes:
        departments.append({"dept_code": c, "dept_name": name})

courses = []
for d in departments:
    code = d["dept_code"]
    name = d["dept_name"]

    r1 = session.post(url, data = {"deptcd": code, "deptname": name}, headers = headers)
    s1 = BeautifulSoup(r1.text, "html.parser")
    for f in s1.find_all("frame", attrs = {"name": "content"}):
        src = f.get("src")
        f_url = b_url + src
        course_response = session.post(f_url, headers = headers)
        course_soup = BeautifulSoup(course_response.text, "html.parser")
        for table_row in course_soup.find_all("tr"):
            present = table_row.find("a", attrs = {"title":"Click Here to view Course Details"})
            if present:
                cols = table_row.find_all("td")
                courses.append({
                    "dept_code": code,
                    "course_code": cols[1].get_text(strip = True),
                    "course_name": cols[2].get_text(strip = True),
                    "instructor": cols[3].get_text(strip = True),
                    "year": YEAR,
                    "semester": SEMESTER
                })

df1 = pd.DataFrame(departments)
df1 = df1.drop_duplicates(subset=["dept_code"], keep="first")
df1.to_csv("../../data/departments.csv", index = False)
df2 = pd.DataFrame(courses)
df2 = df2.drop_duplicates(subset=["course_code"], keep="first")
df2.to_csv("../../data/courses.csv", index = False)

