from pydantic_settings import BaseSettings  # Changed import
from typing import List

class Settings(BaseSettings):
    # PostgreSQL database URL
    database_url: str
    # JWT configuration
    jwt_secret_key: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    # Debug and CORS configuration
    debug: bool = True
    cors_origins: List[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"  # Load environment variables from the .env file
        env_file_encoding = "utf-8"

# Now you can instantiate the settings object
settings = Settings()

# Check that the variables are loaded correctly
print(f"Database URL: {settings.database_url}")
print(f"JWT Secret Key: {settings.jwt_secret_key}")
print(f"JWT Algorithm: {settings.jwt_algorithm}")
print(f"Access Token Expiry (in minutes): {settings.access_token_expire_minutes}")
