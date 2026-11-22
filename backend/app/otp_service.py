import os
import smtplib
import random
from dotenv import load_dotenv


load_dotenv()
stored_otp = {}

def create_otp(email: str):
    otp = str(random.randint(1000, 9999))
    stored_otp[email] = otp
    # send_otp(email, otp)
    return otp

def send_otp(user_email: str, otp: str):
    backend_email = os.getenv("EMAIL")
    backend_password = os.getenv("EMAIL_PASSWORD")

    msg = f"Subject: LincUP OTP\n\nYour LincUP OTP is: {otp}"
    s = smtplib.SMTP('smtp.gmail.com', 587)

    s.starttls()
    s.login(backend_email, backend_password)
    s.sendmail(backend_email, user_email, msg)
    s.quit()

def check_otp(email: str, entered_otp: str):
    correct_otp = stored_otp.get(email)

    if correct_otp is None:
        return False
    if correct_otp != entered_otp :
        return False

    return True


