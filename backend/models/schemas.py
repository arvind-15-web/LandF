from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate)
            ])
        ])

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class MongoBaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str, datetime: lambda dt: dt.isoformat()}
    }

class UserSchema(MongoBaseModel):
    firebaseUid: str
    name: str
    email: str = ""
    phone: str = ""
    profileImage: str = ""
    stars: int = 0
    fcmToken: str = ""

class ItemSchema(MongoBaseModel):
    type: Literal['lost', 'found']
    title: str
    description: str
    category: Literal['wallet', 'phone', 'documents', 'keys', 'bag', 'jewelry', 'electronics', 'clothing', 'pet', 'other']
    location: str
    date: datetime
    images: List[str] = []
    reportedBy: PyObjectId
    contactName: str
    contactPhone: str
    status: Literal['active', 'matched', 'resolved'] = 'active'
    secretCodeHash: Optional[str] = None
    
class MatchSchema(MongoBaseModel):
    lostItem: PyObjectId
    foundItem: PyObjectId
    lostUser: PyObjectId
    foundUser: PyObjectId
    matchScore: int = 0
    status: Literal['MATCHED', 'REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'] = 'MATCHED'
    requestedBy: Optional[PyObjectId] = None
    rating: Optional[int] = None
    ratingGiven: bool = False

class NotificationSchema(MongoBaseModel):
    userId: PyObjectId
    title: str
    message: str
    link: str = ""
    read: bool = False
    type: Literal['match_found', 'contact_request', 'request_accepted', 'request_rejected', 'handshake_complete']
    relatedMatch: Optional[PyObjectId] = None
