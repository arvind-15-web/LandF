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
        # Populate items and users
        lost_item = await db.items.find_one({"_id": doc["lostItem"]})
        found_item = await db.items.find_one({"_id": doc["foundItem"]})
        lost_user = await db.users.find_one({"_id": doc["lostUser"]})
        found_user = await db.users.find_one({"_id": doc["foundUser"]})
        
        doc["_id"] = str(doc["_id"])
        
        if lost_item:
            lost_item["_id"] = str(lost_item["_id"])
            if "reportedBy" in lost_item: lost_item["reportedBy"] = str(lost_item["reportedBy"])
            doc["lostItem"] = lost_item
        else: doc["lostItem"] = None
            
        if found_item:
            found_item["_id"] = str(found_item["_id"])
            if "reportedBy" in found_item: found_item["reportedBy"] = str(found_item["reportedBy"])
            doc["foundItem"] = found_item
        else: doc["foundItem"] = None
            
        is_approved = doc.get("status") in ["APPROVED", "COMPLETED"]
            
        if lost_user:
            lost_user["_id"] = str(lost_user["_id"])
            doc["lostUser"] = {"_id": lost_user["_id"], "name": lost_user.get("name"), "profileImage": lost_user.get("profileImage")}
            if is_approved: doc["lostUser"]["phoneNumber"] = lost_user.get("phoneNumber")
        else: doc["lostUser"] = None
            
        if found_user:
            found_user["_id"] = str(found_user["_id"])
            doc["foundUser"] = {"_id": found_user["_id"], "name": found_user.get("name"), "profileImage": found_user.get("profileImage")}
            if is_approved: doc["foundUser"]["phoneNumber"] = found_user.get("phoneNumber")
        else: doc["foundUser"] = None

        if doc.get("requestedBy"): doc["requestedBy"] = str(doc["requestedBy"])
        matches.append(doc)
    return matches

@router.get("/{id}")
async def get_match(id: str, user=Depends(get_current_user)):
    match = await db.matches.find_one({"_id": ObjectId(id)})
    if not match: raise HTTPException(404, "Match not found")
    
    # Populate items and users
    lost_item = await db.items.find_one({"_id": match["lostItem"]})
    found_item = await db.items.find_one({"_id": match["foundItem"]})
    lost_user = await db.users.find_one({"_id": match["lostUser"]})
    found_user = await db.users.find_one({"_id": match["foundUser"]})
    
    match["_id"] = str(match["_id"])
    
    if lost_item:
        lost_item["_id"] = str(lost_item["_id"])
        if "reportedBy" in lost_item: lost_item["reportedBy"] = str(lost_item["reportedBy"])
        match["lostItem"] = lost_item
    else: match["lostItem"] = None
        
    if found_item:
        found_item["_id"] = str(found_item["_id"])
        if "reportedBy" in found_item: found_item["reportedBy"] = str(found_item["reportedBy"])
        match["foundItem"] = found_item
    else: match["foundItem"] = None
        
    is_approved = match.get("status") in ["APPROVED", "COMPLETED"]
        
    if lost_user:
        lost_user["_id"] = str(lost_user["_id"])
        match["lostUser"] = {
            "_id": lost_user["_id"], 
            "name": lost_user.get("name"), 
            "profileImage": lost_user.get("profileImage")
        }
        if is_approved:
            match["lostUser"]["phoneNumber"] = lost_user.get("phoneNumber")
    else: match["lostUser"] = None
        
    if found_user:
        found_user["_id"] = str(found_user["_id"])
        match["foundUser"] = {
            "_id": found_user["_id"], 
            "name": found_user.get("name"), 
            "profileImage": found_user.get("profileImage")
        }
        if is_approved:
            match["foundUser"]["phoneNumber"] = found_user.get("phoneNumber")
    else: match["foundUser"] = None
    
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
