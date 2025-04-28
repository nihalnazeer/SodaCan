from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int

    # Pusher configuration
    pusher_app_id: str
    pusher_key: str
    pusher_secret: str
    pusher_cluster: str

    debug: bool = True
    cors_origins: str = "http://localhost:3000"  # Add this line to declare the field

    # Then add the property to parse it
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
