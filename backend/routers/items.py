from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from typing import List, Optional
from config import db
from dependencies import get_current_user
import cloudinary.uploader
from bson import ObjectId
import datetime
from utils.matching import run_auto_matching

router = APIRouter()

@router.post("")
async def create_item(
    type: str = Form(...), title: str = Form(...), description: str = Form(...),
    category: str = Form(...), location: str = Form(...), date: str = Form(...),
    contactName: Optional[str] = Form(None), contactPhone: Optional[str] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    user=Depends(get_current_user)
):
    if images is None: images = []
    image_urls = []
    for img in images:
        if not img.filename: continue
        try:
            res = cloudinary.uploader.upload(img.file)
            image_urls.append(res.get("secure_url"))
        except Exception as e:
            print("Cloudinary error:", e)
            
    new_item = {
        "type": type, "title": title, "description": description,
        "category": category, "location": location, "date": datetime.datetime.fromisoformat(date.replace("Z", "+00:00")) if "T" in date else datetime.datetime.utcnow(),
        "contactName": contactName or user.get("name", ""), "contactPhone": contactPhone or user.get("phone", ""),
        "images": image_urls, "reportedBy": user["_id"], "status": "active",
        "createdAt": datetime.datetime.utcnow(), "updatedAt": datetime.datetime.utcnow()
    }
    
    res = await db.items.insert_one(new_item)
    new_item["_id"] = res.inserted_id
    
    # Run auto matching synchronously (Required for Vercel Serverless)
    await run_auto_matching(new_item)
    
    new_item["_id"] = str(new_item["_id"])
    new_item["reportedBy"] = str(new_item["reportedBy"])
    return new_item

@router.get("/my/items")
async def get_my_items(user=Depends(get_current_user)):
    cursor = db.items.find({"reportedBy": user["_id"]}).sort("createdAt", -1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["reportedBy"] = str(doc["reportedBy"])
        items.append(doc)
    return items

@router.get("")
async def get_items(type: Optional[str] = None, user_id: Optional[str] = None, status: Optional[str] = "active"):
    query = {}
    if type: query["type"] = type
    if user_id: query["reportedBy"] = ObjectId(user_id)
    if status and status != "all": query["status"] = status
    
    cursor = db.items.find(query).sort("createdAt", -1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["reportedBy"] = str(doc["reportedBy"])
        items.append(doc)
    return {"items": items}

@router.get("/{id}")
async def get_item(id: str):
    item = await db.items.find_one({"_id": ObjectId(id)})
    if not item: raise HTTPException(status_code=404, detail="Item not found")
    
    user_doc = await db.users.find_one({"_id": ObjectId(item["reportedBy"])})
    if user_doc:
        item["reportedBy"] = {
            "_id": str(user_doc["_id"]),
            "name": user_doc.get("name"),
            "profileImage": user_doc.get("profileImage"),
            "stars": user_doc.get("stars", 0)
        }
    else:
        item["reportedBy"] = str(item["reportedBy"])
        
    item["_id"] = str(item["_id"])
    return item

@router.delete("/{id}")
async def delete_item(id: str, user=Depends(get_current_user)):
    item = await db.items.find_one({"_id": ObjectId(id)})
    if not item: raise HTTPException(404, "Not found")
    if str(item["reportedBy"]) != str(user["_id"]): raise HTTPException(403, "Not authorized")
    
    # Delete from cloudinary
    if item.get("images"):
        for url in item["images"]:
            try:
                # Extract public_id roughly (assuming standard format)
                public_id = url.split("/")[-1].split(".")[0]
                cloudinary.uploader.destroy(public_id)
            except Exception as e:
                print("Cloudinary delete error:", e)
                
    # Delete from mongo
    await db.items.delete_one({"_id": ObjectId(id)})
    # Delete related matches
    await db.matches.delete_many({"$or": [{"lostItem": ObjectId(id)}, {"foundItem": ObjectId(id)}]})
    return {"message": "Item deleted successfully"}
