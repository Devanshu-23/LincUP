import pandas as pd
# read
df = pd.read_csv("../../data/autumn_courses_raw.csv")

df["year"] = pd.to_datetime(df["date"]).dt.year
df = df[["crsecode", "crsename", "autumncourse", "autumninstructor", "offered", "year"]]

# save
df.to_csv("../../data/autumn_courses.csv")

