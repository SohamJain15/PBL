"""Runtime configuration, read from environment variables (prefix ``TPM_``)."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="TPM_", env_file=str(PROJECT_ROOT / ".env"), extra="ignore")

    data_dir: Path = PROJECT_ROOT / "data"
    # Regular files are served from raw.githubusercontent.com; Git-LFS files (tracking) from media.githubusercontent.com
    skillcorner_raw_url: str = "https://raw.githubusercontent.com/SkillCorner/opendata/master/data"
    skillcorner_lfs_url: str = "https://media.githubusercontent.com/media/SkillCorner/opendata/master/data"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    log_level: str = "INFO"
    default_match_id: int = 1886347

    @property
    def raw_dir(self) -> Path:
        return self.data_dir / "raw" / "skillcorner"

    @property
    def processed_dir(self) -> Path:
        return self.data_dir / "processed"

    @property
    def features_dir(self) -> Path:
        return self.data_dir / "features"

    @property
    def cache_dir(self) -> Path:
        return self.data_dir / "cache"


@lru_cache
def get_settings() -> Settings:
    return Settings()
