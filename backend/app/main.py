from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import analysis, features, heatmaps, matches, patterns, tracking
from app.core.config import get_settings
from app.core.exceptions import TacticalLabError
from app.core.logging import configure_logging, get_logger

settings = get_settings()
configure_logging(settings.log_level)
log = get_logger("tactical-lab")

app = FastAPI(title="Tactical Lab API", version="0.1.0",
              description="Spatiotemporal tactical pattern mining — research prototype")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(GZipMiddleware, minimum_size=1024)


@app.exception_handler(TacticalLabError)
async def handle_domain_error(_: Request, exc: TacticalLabError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": str(exc)})


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


for module in (matches, tracking, features, patterns, analysis, heatmaps):
    app.include_router(module.router, prefix="/api")
