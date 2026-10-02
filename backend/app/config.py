from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = 'sqlite:///./school_attendance.db'
    SECRET_KEY: str = 'dev-secret-key-change-in-production'
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    CORS_ORIGINS: list[str] = ['*']
    DEFAULT_ADMIN_EMAIL: str = 'admin@school.com'
    DEFAULT_ADMIN_PASSWORD: str = 'admin123'
    SCHOOL_NAME: str = 'Delhi Public School'
    ATTENDANCE_THRESHOLD: float = 75.0

    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

@lru_cache
def get_settings() -> Settings:
    return Settings()
