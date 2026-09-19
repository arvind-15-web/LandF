from fastapi import Header, HTTPException, Depends
from firebase_admin import auth
from config import db

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        user = await db.users.find_one({"firebaseUid": uid})
        if not user:
            raise HTTPException(status_code=404, detail="User not found in DB")
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
