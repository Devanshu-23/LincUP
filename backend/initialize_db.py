import os
import sqlite3
import pandas as pd

DATABASE =  "../db/lincup.db" # app or lincup.db?
# if os.path.exists(DATABASE):
#     os.remove(DATABASE)  

SCHEMA = "../db/schema.sql"
COURSES_CSV = "data/courses.csv"
DEPARTMENTS_CSV = "data/departments.csv"

conn = sqlite3.connect(DATABASE)
cursor = conn.cursor()

# cursor.execute()
try :
    with open(SCHEMA, "r") as f:
        schema_sql = f.read()

    cursor.executescript(schema_sql)
    conn.commit()

    courses = pd.read_csv(COURSES_CSV)
    departments = pd.read_csv(DEPARTMENTS_CSV)
    courses.to_sql("courses", conn, if_exists = "append", index = False)
    departments.to_sql("departments", conn, if_exists = "append", index = False)

except Exception as e:
    # print(f"error: {e}")
    print(f"Error: {e.__cause__ or e}")

cursor.close()
conn.close()
