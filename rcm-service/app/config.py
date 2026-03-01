import os
from typing import Optional

import psycopg2
from dotenv import load_dotenv

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
QDRANT_COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "products_kb")

TREND_WINDOW_DAYS = int(os.getenv("RCM_TREND_WINDOW_DAYS", "14"))
TREND_DECAY_LAMBDA = float(os.getenv("RCM_TREND_DECAY_LAMBDA", "0.12"))
HISTORY_MIN_DISTINCT_ENOUGH = int(os.getenv("RCM_HISTORY_MIN_DISTINCT_ENOUGH", "3"))

BLEND_HOME_LIGHT_CONTENT = float(os.getenv("RCM_BLEND_HOME_LIGHT_CONTENT", "0.65"))
BLEND_HOME_LIGHT_TREND = float(os.getenv("RCM_BLEND_HOME_LIGHT_TREND", "0.35"))
BLEND_HOME_ENOUGH_CF = float(os.getenv("RCM_BLEND_HOME_ENOUGH_CF", "0.55"))
BLEND_HOME_ENOUGH_CONTENT = float(os.getenv("RCM_BLEND_HOME_ENOUGH_CONTENT", "0.45"))
BLEND_DETAIL_CONTENT = float(os.getenv("RCM_BLEND_DETAIL_CONTENT", "0.85"))
BLEND_DETAIL_CF = float(os.getenv("RCM_BLEND_DETAIL_CF", "0.15"))

EVENT_WEIGHTS = {
    "view": 1.0,
    "product_view": 1.0,
    "click": 2.0,
    "add_to_cart": 3.0,
    "purchase": 5.0,
}


def _get_database_url() -> Optional[str]:
    database_url = os.getenv("POSTGRES_URL")
    if not database_url:
        return None
    database_url = database_url.strip()
    return database_url or None


def connect_postgres(default_port: str = "5432"):
    database_url = _get_database_url()
    if database_url:
        return psycopg2.connect(database_url)

    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", default_port),
        dbname=os.getenv("DB_NAME", "smart_pharma"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "password"),
    )


def get_db_target(default_port: str = "5432") -> str:
    database_url = _get_database_url()
    if database_url:
        return database_url
    return f"{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', default_port)}"
