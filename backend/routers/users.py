from fastapi import APIRouter, Depends, HTTPException, Body
from config import db
from dependencies import get_current_user
from bson import ObjectId

router = APIRouter()

from fastapi import Form, UploadFile, File
from typing import Optional
import cloudinary.uploader
import datetime

@router.patch("/profile")
async def update_profile(
    name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    profileImage: Optional[UploadFile] = File(None),
    user=Depends(get_current_user)
):
    update_data = {"updatedAt": datetime.datetime.utcnow()}
    if name is not None: update_data["name"] = name
    if phone is not None: update_data["phone"] = phone
    
    if profileImage and profileImage.filename:
        try:
            res = cloudinary.uploader.upload(profileImage.file)
            update_data["profileImage"] = res.get("secure_url")
        except Exception as e:
            print("Cloudinary error:", e)
            
    await db.users.update_one({"_id": user["_id"]}, {"$set": update_data})
    return {"message": "Profile updated successfully"}

@router.get("/{id}")
async def get_user_profile(id: str, user=Depends(get_current_user)):
    target_user = await db.users.find_one({"_id": ObjectId(id)})
    if not target_user:
        raise HTTPException(404, "User not found")
        
    # Remove sensitive info
    return {
        "_id": str(target_user["_id"]),
        "name": target_user.get("name"),
        "profileImage": target_user.get("profileImage"),
        "stars": target_user.get("stars", 0)
    }

@router.post("/{id}/rate")
async def rate_user(id: str, rating: int = Body(..., embed=True), user=Depends(get_current_user)):
    target_user = await db.users.find_one({"_id": ObjectId(id)})
    if not target_user: raise HTTPException(404, "User not found")
    
    await db.users.update_one({"_id": ObjectId(id)}, {"$inc": {"stars": rating}})
    return {"message": "User rated successfully"}
