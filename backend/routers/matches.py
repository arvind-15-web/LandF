from fastapi import APIRouter, Depends, HTTPException, Body
from config import db
from dependencies import get_current_user
from bson import ObjectId
import datetime
from utils.notifications import create_notification
import hashlib

router = APIRouter()

@router.get("")
async def get_my_matches(user=Depends(get_current_user)):
    user_id = user["_id"]
    cursor = db.matches.find({"$or": [{"lostUser": user_id}, {"foundUser": user_id}]}).sort("matchScore", -1)
    matches = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["lostItem"] = str(doc["lostItem"])
        doc["foundItem"] = str(doc["foundItem"])
        doc["lostUser"] = str(doc["lostUser"])
        doc["foundUser"] = str(doc["foundUser"])
        matches.append(doc)
    return matches

@router.get("/{id}")
async def get_match(id: str, user=Depends(get_current_user)):
    match = await db.matches.find_one({"_id": ObjectId(id)})
    if not match: raise HTTPException(404, "Match not found")
    
    # Populate items and users
    match["lostItem"] = await db.items.find_one({"_id": match["lostItem"]})
    match["foundItem"] = await db.items.find_one({"_id": match["foundItem"]})
    match["lostUser"] = await db.users.find_one({"_id": match["lostUser"]})
    match["foundUser"] = await db.users.find_one({"_id": match["foundUser"]})
    
    # Clean up ObjectIds
    match["_id"] = str(match["_id"])
    if match["lostItem"]: match["lostItem"]["_id"] = str(match["lostItem"]["_id"])
    if match["foundItem"]: match["foundItem"]["_id"] = str(match["foundItem"]["_id"])
    if match["lostUser"]: match["lostUser"]["_id"] = str(match["lostUser"]["_id"])
    if match["foundUser"]: match["foundUser"]["_id"] = str(match["foundUser"]["_id"])
    
    if match.get("requestedBy"): match["requestedBy"] = str(match["requestedBy"])
    
    return match

@router.post("/{id}/request")
async def request_contact(id: str, user=Depends(get_current_user)):
    match = await db.matches.find_one({"_id": ObjectId(id)})
    if not match: raise HTTPException(404, "Match not found")
    
    if match["status"] != "MATCHED":
        raise HTTPException(400, "Invalid status")
        
    await db.matches.update_one({"_id": ObjectId(id)}, {"$set": {"status": "REQUESTED", "requestedBy": user["_id"]}})
    
    other_user_id = match["foundUser"] if match["lostUser"] == user["_id"] else match["lostUser"]
    
    await create_notification(
        other_user_id, 'Contact Request', f'{user.get("name")} wants to contact you.',
        'contact_request', '/matches', ObjectId(id)
    )
    return {"message": "Contact requested"}

@router.post("/{id}/respond")
async def respond_contact(id: str, action: str = Body(..., embed=True), user=Depends(get_current_user)):
    match = await db.matches.find_one({"_id": ObjectId(id)})
    if not match: raise HTTPException(404, "Match not found")
    
    new_status = "APPROVED" if action == "accept" else "REJECTED"
    await db.matches.update_one({"_id": ObjectId(id)}, {"$set": {"status": new_status}})
    
    if new_status == "APPROVED":
        await create_notification(
            match["requestedBy"], 'Request Accepted!', 'Your contact request was approved.',
            'request_accepted', '/matches', ObjectId(id)
        )
    return {"message": "Responded", "status": new_status}

@router.post("/{id}/generate-code")
async def generate_code(id: str, user=Depends(get_current_user)):
    match = await db.matches.find_one({"_id": ObjectId(id)})
    if not match: raise HTTPException(404, "Match not found")
    
    code = str(ObjectId())[:6].upper()
    hashed = hashlib.sha256(code.encode()).hexdigest()
    
    await db.items.update_one({"_id": match["foundItem"]}, {"$set": {"secretCodePlain": code}})
    await db.items.update_one({"_id": match["lostItem"]}, {"$set": {"secretCodeHash": hashed}})
    return {"message": "Code generated"}

@router.post("/{id}/handshake")
async def handshake(id: str, secretCode: str = Body(..., embed=True), user=Depends(get_current_user)):
    match = await db.matches.find_one({"_id": ObjectId(id)})
    if not match: raise HTTPException(404, "Match not found")
    
    lost_item = await db.items.find_one({"_id": match["lostItem"]})
    if not lost_item.get("secretCodeHash"): raise HTTPException(400, "No code generated")
    
    if hashlib.sha256(secretCode.encode()).hexdigest() != lost_item["secretCodeHash"]:
        raise HTTPException(400, "Invalid secret code")
        
    await db.matches.update_one({"_id": ObjectId(id)}, {"$set": {"status": "COMPLETED"}})
    await db.items.update_many({"_id": {"$in": [match["lostItem"], match["foundItem"]]}}, {"$set": {"status": "resolved"}})
    
    return {"message": "Handshake successful! Items resolved."}

@router.post("/{id}/rate")
async def rate_match(id: str, rating: int = Body(..., embed=True), user=Depends(get_current_user)):
    match = await db.matches.find_one({"_id": ObjectId(id)})
    if not match: raise HTTPException(404, "Match not found")
    await db.matches.update_one({"_id": ObjectId(id)}, {"$set": {"ratingGiven": True, "rating": rating}})
    other_user_id = match["foundUser"] if match["lostUser"] == user["_id"] else match["lostUser"]
    await db.users.update_one({"_id": other_user_id}, {"$inc": {"stars": rating}})
    return {"message": "Rating submitted successfully!"}
