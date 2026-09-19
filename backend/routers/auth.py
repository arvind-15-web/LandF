from fastapi import APIRouter, Depends, HTTPException, Body
from firebase_admin import auth as firebase_auth
from config import db
from dependencies import get_current_user
from models.schemas import UserSchema
import datetime

router = APIRouter()

@router.post("/register")
async def register(firebaseToken: str = Body(...), name: str = Body(...), phone: str = Body(""), fcmToken: str = Body("")):
    try:
        decoded = firebase_auth.verify_id_token(firebaseToken)
        uid = decoded.get("uid")
        resolved_phone = decoded.get("phone_number") or phone or ""
        resolved_email = decoded.get("email") or ""
        
        user = await db.users.find_one({"firebaseUid": uid})
        if user:
            update_data = {"name": name, "updatedAt": datetime.datetime.utcnow()}
            if resolved_email: update_data["email"] = resolved_email
            if resolved_phone: update_data["phone"] = resolved_phone
            if fcmToken: update_data["fcmToken"] = fcmToken
            
            await db.users.update_one({"_id": user["_id"]}, {"$set": update_data})
            updated_user = await db.users.find_one({"_id": user["_id"]})
            updated_user["_id"] = str(updated_user["_id"])
            return {"message": "User updated", "user": updated_user}
            
        new_user = {
            "firebaseUid": uid,
            "name": name,
            "email": resolved_email,
            "phone": resolved_phone,
            "profileImage": decoded.get("picture", ""),
            "fcmToken": fcmToken,
            "stars": 0,
            "createdAt": datetime.datetime.utcnow(),
            "updatedAt": datetime.datetime.utcnow()
        }
        res = await db.users.insert_one(new_user)
        new_user["_id"] = str(res.inserted_id)
        return {"message": "User registered successfully", "user": new_user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    user["_id"] = str(user["_id"])
    return {"user": user}

@router.patch("/fcm-token")
async def update_fcm(fcmToken: str = Body(...), user=Depends(get_current_user)):
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"fcmToken": fcmToken}})
    return {"message": "FCM token updated"}
