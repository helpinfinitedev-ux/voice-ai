from dotenv import load_dotenv
from fastapi import FastAPI, Request
from src.router import phone_agent_router
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from src.auth.session import authenticate_request

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(lifespan=lifespan)

@app.middleware("http")
async def authentication_middleware(request: Request, call_next):
    if "webhook" not in request.url.path:
        if not authenticate_request(request):
            return JSONResponse(status_code=401, content={"message": "Unable to complete request"})

    response = await call_next(request)
    return response 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(phone_agent_router.router)