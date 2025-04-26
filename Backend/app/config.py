from pydantic_settings import BaseSettings  # Changed import
from typing import List

class Settings(BaseSettings):
   
    database_url: str
    
    jwt_secret_key: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int 
  
    debug: bool = True
    cors_origins: List[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"  
        env_file_encoding = "utf-8"
        extra = "forbid"


settings = Settings()


print(f"Database URL: {settings.database_url}")
print(f"JWT Secret Key: {settings.jwt_secret_key}")
print(f"JWT Algorithm: {settings.jwt_algorithm}")
print(f"Access Token Expiry (in minutes): {settings.access_token_expire_minutes}")
