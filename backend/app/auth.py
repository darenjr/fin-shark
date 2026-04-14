import os
from fastapi import Header, HTTPException


def verify_passcode(x_passcode: str = Header(...)):
    expected = os.environ.get("APP_PASSCODE", "")
    if not expected:
        raise HTTPException(status_code=500, detail="APP_PASSCODE not configured on server")
    if x_passcode != expected:
        raise HTTPException(status_code=401, detail="Invalid passcode")
