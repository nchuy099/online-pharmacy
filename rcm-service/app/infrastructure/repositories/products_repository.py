from contextlib import closing
import logging
import time
from typing import Dict, List
from uuid import UUID

from app.config import connect_postgres
from app.domain.models import RecProduct, RecProductVariant

logger = logging.getLogger(__name__)


def _parse_uuid_ids(ids: List[str]) -> List[str]:
    valid: List[str] = []
    for item_id in ids:
        try:
            valid.append(str(UUID(str(item_id))))
        except Exception:
            continue
    return valid


def fetch_product_summaries(product_ids: List[str]) -> Dict[str, RecProduct]:
    if not product_ids:
        logger.info("Skipping product summary fetch because product_ids is empty")
        return {}

    valid_uuid_ids = _parse_uuid_ids(product_ids)
    if not valid_uuid_ids:
        logger.warning("No valid UUID product IDs found in recommendation results")
        return {}

    start = time.perf_counter()
    logger.info(
        "Fetching product summaries for %s IDs (%s valid UUIDs)",
        len(product_ids),
        len(valid_uuid_ids),
    )
    try:
        with closing(connect_postgres()) as conn, closing(conn.cursor()) as cur:
            query = """
                SELECT
                    p.id::text AS product_id,
                    p.slug,
                    p.name,
                    p.web_name,
                    COALESCE(primary_img.url, fallback_img.url) AS primary_image,
                    COALESCE(rv.avg_rating, 0)::float8 AS average_rating,
                    COALESCE(rv.total_reviews, 0)::int AS total_reviews,
                    v.id::text AS variant_id,
                    v.sale_price::float8 AS sale_price,
                    COALESCE(v.is_default, false) AS is_default,
                    COALESCE(v.is_active, true) AS is_active,
                    CASE
                        WHEN i.id IS NULL THEN NULL
                        ELSE (COALESCE(i.quantity_on_hand, 0) - COALESCE(i.quantity_reserved, 0))
                    END::int AS available_quantity
                FROM products p
                LEFT JOIN LATERAL (
                    SELECT pi.url
                    FROM product_images pi
                    WHERE pi.product_id = p.id
                      AND pi.is_primary = true
                    ORDER BY pi.id ASC
                    LIMIT 1
                ) primary_img ON true
                LEFT JOIN LATERAL (
                    SELECT pi.url
                    FROM product_images pi
                    WHERE pi.product_id = p.id
                    ORDER BY pi.id ASC
                    LIMIT 1
                ) fallback_img ON true
                LEFT JOIN (
                    SELECT
                        r.product_id,
                        AVG(r.rating)::float8 AS avg_rating,
                        COUNT(*)::int AS total_reviews
                    FROM reviews r
                    GROUP BY r.product_id
                ) rv ON rv.product_id = p.id
                LEFT JOIN product_variants v ON v.product_id = p.id
                LEFT JOIN inventories i ON i.variant_id = v.id
                WHERE p.is_active = true
                  AND p.id = ANY(%s::uuid[])
                ORDER BY p.id, v.is_default DESC, v.id
            """
            cur.execute(query, (valid_uuid_ids,))
            rows = cur.fetchall()
    except Exception as exc:
        logger.exception("Error fetching product summaries: %s", exc)
        return {}

    product_map: Dict[str, RecProduct] = {}
    for (
        product_id,
        slug,
        name,
        web_name,
        primary_image,
        average_rating,
        total_reviews,
        variant_id,
        sale_price,
        is_default,
        is_active,
        available_quantity,
    ) in rows:
        pid = str(product_id)
        if pid not in product_map:
            product_map[pid] = RecProduct(
                id=pid,
                slug=str(slug),
                name=str(name),
                web_name=web_name,
                primary_image=primary_image,
                average_rating=float(average_rating or 0.0),
                total_reviews=int(total_reviews or 0),
                variants=[],
            )

        if variant_id is not None and sale_price is not None:
            product_map[pid].variants.append(
                RecProductVariant(
                    id=str(variant_id),
                    sale_price=float(sale_price),
                    is_default=bool(is_default),
                    is_active=bool(is_active),
                    available_quantity=int(available_quantity) if available_quantity is not None else None,
                )
            )

    logger.info(
        "Fetched product summaries in %.2f ms (rows=%s, unique_products=%s)",
        (time.perf_counter() - start) * 1000,
        len(rows),
        len(product_map),
    )
    return product_map


def filter_active_in_stock_ids(product_ids: List[str]) -> List[str]:
    if not product_ids:
        return []

    valid_uuid_ids = _parse_uuid_ids(product_ids)
    if not valid_uuid_ids:
        return []

    try:
        with closing(connect_postgres()) as conn, closing(conn.cursor()) as cur:
            query = """
                SELECT DISTINCT p.id::text AS product_id
                FROM products p
                JOIN product_variants v ON v.product_id = p.id
                LEFT JOIN inventories i ON i.variant_id = v.id
                WHERE p.is_active = true
                  AND COALESCE(v.is_active, true) = true
                  AND (COALESCE(i.quantity_on_hand, 0) - COALESCE(i.quantity_reserved, 0)) > 0
                  AND p.id = ANY(%s::uuid[])
            """
            cur.execute(query, (valid_uuid_ids,))
            rows = cur.fetchall()
    except Exception as exc:
        logger.exception("Error filtering active/in-stock ids: %s", exc)
        return []

    allowed = {str(row[0]) for row in rows if row and row[0] is not None}
    return [pid for pid in product_ids if pid in allowed]

