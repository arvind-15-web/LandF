from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from config import db
import os
from routers import auth, items, matches, notifications, users

app = FastAPI(title="Lost & Found API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(matches.router, prefix="/api/matches", tags=["matches"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.get("/api/health")
async def health_check():
    return {"status": "OK", "message": "Lost & Found API (Python/FastAPI) is running"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
