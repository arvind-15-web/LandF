import datetime
from bson import ObjectId
from firebase_admin import messaging
from config import db

async def create_notification(user_id: ObjectId, title: str, message: str, type_: str, link: str = "", related_match: ObjectId = None):
    try:
        notif = {
            "userId": user_id,
            "title": title,
            "message": message,
            "type": type_,
            "link": link,
            "relatedMatch": related_match,
            "read": False,
            "createdAt": datetime.datetime.utcnow(),
            "updatedAt": datetime.datetime.utcnow()
        }
        res = await db.notifications.insert_one(notif)
        
        user = await db.users.find_one({"_id": user_id})
        if user and user.get("fcmToken"):
            await send_push_notification(user["fcmToken"], title, message, {"link": link})
            
        return res.inserted_id
    except Exception as e:
        print(f"Notification creation error: {e}")

async def send_push_notification(fcm_token: str, title: str, body: str, data: dict = None):
    if not data: data = {}
    str_data = {str(k): str(v) for k, v in data.items()}
    try:
        msg = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data=str_data,
            token=fcm_token
        )
        messaging.send(msg)
    except Exception as e:
        print(f"FCM push failed: {e}")
