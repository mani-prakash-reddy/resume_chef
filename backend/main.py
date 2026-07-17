from fastapi import FastAPI
from loguru import logger
from database.database import init_db
from config import settings
from auth.router import router as auth_router
from resumes.router import router as resumes_router
from ai.router import router as ai_router
from credits.router import router as credits_router
from billing.router import router as billing_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

app = FastAPI(
    title="Resume Chef API",
    description="AI-powered resume builder backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("Starting up...")
    await init_db()
    logger.info("Database initialized successfully")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )


# Routers
app.include_router(auth_router)
app.include_router(resumes_router)
app.include_router(ai_router)
app.include_router(credits_router)
app.include_router(billing_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}