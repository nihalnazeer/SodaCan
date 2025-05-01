from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Optional

class Settings(BaseSettings):
    database_url: str = Field(default="postgresql://postgres:password@localhost/sodacan")
    jwt_secret_key: str = Field(default="your-secret-key")
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=90)
    refresh_token_expire_days: int = Field(default=3)
    pusher_app_id: Optional[str] = None
    pusher_key: Optional[str] = None
    pusher_secret: Optional[str] = None
    pusher_cluster: Optional[str] = None
    debug: bool = Field(default=True)
    cors_origins: str = Field(default="http://localhost:3000")

    @property
    def parsed_cors_origins(self) -> List[str]:
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "forbid"

settings = Settings()