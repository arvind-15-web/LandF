import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import firebase_admin
from firebase_admin import credentials
import cloudinary

load_dotenv()

# MongoDB
MONGO_URI = os.getenv("MONGO_URI")
client = AsyncIOMotorClient(MONGO_URI)
# Get database name from URI or default to 'test'
db_name = MONGO_URI.split('/')[-1].split('?')[0] if '/' in MONGO_URI else 'test'
if not db_name:
    db_name = 'test'
db = client[db_name]

# Firebase
if not firebase_admin._apps:
    private_key = os.getenv("FIREBASE_PRIVATE_KEY", "")
    private_key = private_key.replace('\\n', '\n')
    
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
        "private_key": private_key,
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "token_uri": "https://oauth2.googleapis.com/token",
    })
    firebase_admin.initialize_app(cred)

# Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
