import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import bookmarks, tags

app = FastAPI(title="Bookmark Manager API", version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bookmarks.router, prefix="/api/v1")
app.include_router(tags.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
