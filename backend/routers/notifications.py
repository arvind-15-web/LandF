from fastapi import APIRouter, Depends
from config import db
from dependencies import get_current_user
from bson import ObjectId

router = APIRouter()

@router.get("")
async def get_notifications(user=Depends(get_current_user), limit: int = 50):
    cursor = db.notifications.find({"userId": user["_id"]}).sort("createdAt", -1).limit(limit)
    notifs = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["userId"] = str(doc["userId"])
        if doc.get("relatedMatch"):
            doc["relatedMatch"] = str(doc["relatedMatch"])
        notifs.append(doc)
    
    unread_count = await db.notifications.count_documents({"userId": user["_id"], "read": False})
    return {"notifications": notifs, "unreadCount": unread_count}

@router.patch("/{id}/read")
async def mark_read(id: str, user=Depends(get_current_user)):
    await db.notifications.update_one(
        {"_id": ObjectId(id), "userId": user["_id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}

@router.patch("/read-all")
async def mark_all_read(user=Depends(get_current_user)):
    await db.notifications.update_many(
        {"userId": user["_id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All marked as read"}
