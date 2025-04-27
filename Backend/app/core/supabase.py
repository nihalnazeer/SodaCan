from supabase import create_client, Client, create_async_client, AsyncClient
from dotenv import load_dotenv
import os
import logging
import asyncio

# Configure logging
logging.basicConfig(filename='log.txt', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_REST_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

logger.debug(f"SUPABASE_URL: {SUPABASE_URL}")
logger.debug(f"SUPABASE_KEY: {SUPABASE_KEY[:10]}...")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("SUPABASE_REST_URL or SUPABASE_ANON_KEY is missing in .env")
    raise ValueError("SUPABASE_REST_URL and SUPABASE_ANON_KEY must be set in .env")

# Strip /rest/v1/ if present
SUPABASE_URL = SUPABASE_URL.rstrip('/')
if SUPABASE_URL.endswith('/rest/v1'):
    SUPABASE_URL = SUPABASE_URL[:-8]
logger.debug(f"Cleaned SUPABASE_URL: {SUPABASE_URL}")

# Validate URL format
if not SUPABASE_URL.startswith("https://"):
    logger.error(f"Invalid SUPABASE_URL format: {SUPABASE_URL}")
    raise ValueError("SUPABASE_REST_URL must start with https://")

# Sync client for HTTP endpoints
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase sync client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Supabase sync client: {str(e)}")
    raise

# Async client should be initialized in an async context
# We'll create a function to initialize it when needed
async def initialize_async_client():
    try:
        client = await create_async_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase async client initialized successfully")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase async client: {str(e)}")
        raise

# Global variable to store the initialized async client
_async_supabase = None

def get_supabase_client() -> Client:
    """Return sync Supabase client for dependency injection."""
    logger.debug("Providing sync Supabase client")
    return supabase

async def get_async_supabase_client() -> AsyncClient:
    """Return async Supabase client for WebSocket real-time."""
    global _async_supabase
    if _async_supabase is None:
        logger.debug("Initializing async Supabase client")
        _async_supabase = await initialize_async_client()
    logger.debug(f"Providing async Supabase client: {type(_async_supabase)}")
    return _async_supabase