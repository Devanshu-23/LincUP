import requests 
import pandas as pd

url = "https://www.cse.iitb.ac.in/~internal-live/api/courses/autumn_courses/" 

response = requests.get(url)
data = response.json()
df = pd.DataFrame(data)
df.to_csv("autumn_courses.csv")