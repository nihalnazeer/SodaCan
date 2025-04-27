from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int
    supabase_rest_url: str
    supabase_websocket_url: str
    supabase_anon_key: str
    debug: bool = True
    cors_origins: List[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "forbid"

settings = Settings()

if settings.debug:
    print(f"Database URL: {settings.database_url}")
    print(f"JWT Secret Key: {settings.jwt_secret_key}")
    print(f"JWT Algorithm: {settings.jwt_algorithm}")
    print(f"Access Token Expiry (in minutes): {settings.access_token_expire_minutes}")
    print(f"Refresh Token Expiry (in days): {settings.refresh_token_expire_days}")
    print(f"Supabase REST URL: {settings.supabase_rest_url}")
    print(f"Supabase WebSocket URL: {settings.supabase_websocket_url}")
    print(f"Supabase Anon Key: {settings.supabase_anon_key}")
    print(f"Debug Mode: {settings.debug}")
    print(f"CORS Origins: {settings.cors_origins}")