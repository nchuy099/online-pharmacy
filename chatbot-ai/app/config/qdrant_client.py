import os

from qdrant_client import QdrantClient

qdrant = QdrantClient(
    url=os.getenv("QDRANT_URL", ""),
    api_key=os.getenv("QDRANT_API_KEY", ""),
    timeout=5,
)
# In a real app, you would define your collection name and create it here if needed.
