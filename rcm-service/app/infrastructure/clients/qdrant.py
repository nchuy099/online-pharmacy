import logging
import time

from qdrant_client import QdrantClient

from app.config import QDRANT_API_KEY, QDRANT_URL

logger = logging.getLogger(__name__)

_qdrant_client = None
_assets_loaded = False


def load_assets() -> None:
    global _qdrant_client, _assets_loaded

    if _assets_loaded:
        logger.debug("Recommendation assets already loaded, skipping reload")
        return

    start = time.perf_counter()
    logger.info("Loading recommendation assets")
    try:
        _qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    except Exception as exc:
        logger.exception("Error loading recommendation assets: %s", exc)
    finally:
        _assets_loaded = True
        logger.info(
            "Asset loading finished in %.2f ms (qdrant_client=%s)",
            (time.perf_counter() - start) * 1000,
            _qdrant_client is not None,
        )


def get_qdrant_client():
    load_assets()
    return _qdrant_client
