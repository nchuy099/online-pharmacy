import os

from app.config import gemini_client
from app.config.qdrant_client import qdrant

collection_name = (os.getenv("QDRANT_COLLECTION") or "products_kb").strip()


def _embed_content(text: str) -> list[float]:
    client = gemini_client._build_client()
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config={"output_dimensionality": 768},
    )
    return result.embeddings[0].values


def setup_collection():
    from qdrant_client.http.models import Distance, VectorParams

    if not qdrant.collection_exists(collection_name):
        qdrant.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=768, distance=Distance.COSINE),
        )


def ingest_product(product_data: dict):
    document_text = (
        f"Ten thuoc: {product_data['name']}\n"
        f"Thanh phan: {product_data.get('ingredients', '')}\n"
        f"Chi dinh: {product_data.get('uses', '')}"
    )

    vector = _embed_content(document_text)

    payload = {
        "slug": product_data["slug"],
        "name": product_data["name"],
        "text": document_text,
        "brand": product_data.get("brand", ""),
    }

    qdrant.upsert(
        collection_name=collection_name,
        points=[
            {
                "id": product_data["id"],
                "vector": vector,
                "payload": payload,
            }
        ],
    )
