import logging

logging.basicConfig(
    filename='test_rooms_import.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    from app.api.rooms import router
    logger.debug("Successfully imported app.api.rooms")
except Exception as e:
    logger.error(f"Failed to import app.api.rooms: {str(e)}", exc_info=True)




