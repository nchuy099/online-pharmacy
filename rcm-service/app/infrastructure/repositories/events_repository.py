from contextlib import closing
import logging
import time
from typing import Dict, List

from app.config import connect_postgres
from app.config import EVENT_WEIGHTS, TREND_DECAY_LAMBDA, TREND_WINDOW_DAYS

logger = logging.getLogger(__name__)


def _to_history_key(user_id: str):
    return int(user_id) if user_id.isdigit() else user_id


def fetch_trending_scores(top_k: int = 50) -> Dict[str, float]:
    start = time.perf_counter()
    logger.info("Computing trending scores (top_k=%s)", top_k)
    try:
        with closing(connect_postgres()) as conn, closing(conn.cursor()) as cur:
            query = """
                SELECT
                    item_id,
                    SUM(
                        CASE
                            WHEN LOWER(event_type) = 'purchase' THEN 5
                            WHEN LOWER(event_type) = 'add_to_cart' THEN 3
                            WHEN LOWER(event_type) = 'click' THEN 2
                            WHEN LOWER(event_type) IN ('view', 'product_view') THEN 1
                            ELSE 0
                        END
                        * EXP(-%s * EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0)
                    ) AS score
                FROM events
                WHERE item_id IS NOT NULL
                  AND created_at >= NOW() - (%s::text || ' days')::interval
                GROUP BY item_id
                ORDER BY score DESC
                LIMIT %s
            """
            cur.execute(query, (TREND_DECAY_LAMBDA, TREND_WINDOW_DAYS, top_k))
            rows = cur.fetchall()

        result = {str(item_id): float(score) for item_id, score in rows if item_id is not None}
        logger.info(
            "Trending score query done in %.2f ms (rows=%s)",
            (time.perf_counter() - start) * 1000,
            len(result),
        )
        return result
    except Exception as exc:
        logger.exception("Error fetching trending products: %s", exc)
        return {}


def fetch_user_history_summary(user_id: str) -> Dict[str, int | bool]:
    start = time.perf_counter()
    logger.info("Fetching user history summary for user_id=%s", user_id)
    try:
        with closing(connect_postgres()) as conn, closing(conn.cursor()) as cur:
            query = """
                SELECT
                    COUNT(*)::int AS total_events,
                    COUNT(DISTINCT item_id)::int AS distinct_items,
                    COALESCE(SUM(CASE WHEN LOWER(event_type) IN ('click', 'add_to_cart', 'purchase') THEN 1 ELSE 0 END), 0)::int AS meaningful_events,
                    COALESCE(SUM(CASE WHEN LOWER(event_type) = 'purchase' THEN 1 ELSE 0 END), 0)::int AS purchase_events
                FROM events
                WHERE user_id = %s
                  AND item_id IS NOT NULL
                  AND created_at >= NOW() - (%s::text || ' days')::interval
            """
            cur.execute(query, (_to_history_key(user_id), TREND_WINDOW_DAYS))
            row = cur.fetchone() or (0, 0, 0, 0)

        total_events, distinct_items, meaningful_events, purchase_events = row
        summary = {
            "total_events": int(total_events or 0),
            "distinct_items": int(distinct_items or 0),
            "meaningful_events": int(meaningful_events or 0),
            "has_purchase": int(purchase_events or 0) > 0,
        }
        logger.info(
            "User history summary fetched in %.2f ms for user_id=%s: %s",
            (time.perf_counter() - start) * 1000,
            user_id,
            summary,
        )
        return summary
    except Exception as exc:
        logger.exception("Error fetching user history summary: %s", exc)
        return {
            "total_events": 0,
            "distinct_items": 0,
            "meaningful_events": 0,
            "has_purchase": False,
        }


def fetch_user_recent_item_ids(user_id: str, limit: int = 5) -> List[str]:
    start = time.perf_counter()
    logger.info("Fetching recent item ids for user_id=%s limit=%s", user_id, limit)
    try:
        with closing(connect_postgres()) as conn, closing(conn.cursor()) as cur:
            query = """
                SELECT
                    item_id,
                    SUM(
                        CASE
                            WHEN LOWER(event_type) = 'purchase' THEN 5
                            WHEN LOWER(event_type) = 'add_to_cart' THEN 3
                            WHEN LOWER(event_type) = 'click' THEN 2
                            WHEN LOWER(event_type) IN ('view', 'product_view') THEN 1
                            ELSE 0
                        END
                    ) AS score,
                    MAX(created_at) AS latest_event
                FROM events
                WHERE user_id = %s
                  AND item_id IS NOT NULL
                  AND created_at >= NOW() - (%s::text || ' days')::interval
                GROUP BY item_id
                ORDER BY score DESC, latest_event DESC
                LIMIT %s
            """
            cur.execute(query, (_to_history_key(user_id), TREND_WINDOW_DAYS, limit))
            rows = cur.fetchall()

        item_ids = [str(row[0]) for row in rows if row[0] is not None]
        logger.info(
            "Fetched %s recent item ids in %.2f ms for user_id=%s",
            len(item_ids),
            (time.perf_counter() - start) * 1000,
            user_id,
        )
        return item_ids
    except Exception as exc:
        logger.exception("Error fetching user recent items: %s", exc)
        return []


def fetch_item_cf_candidates(seed_item_ids: List[str], top_n: int = 50) -> Dict[str, float]:
    if not seed_item_ids:
        logger.info("Skipping item_cf candidates because seed list is empty")
        return {}

    # Shared item-based CF:
    # cf_score(candidate) = SUM_user(seed_weight(user) * candidate_weight(user, candidate))
    # where weights are aggregated from user interactions on seed/candidate items.
    start = time.perf_counter()
    logger.info("Fetching item_cf candidates (seed_count=%s, top_n=%s)", len(seed_item_ids), top_n)
    try:
        with closing(connect_postgres()) as conn, closing(conn.cursor()) as cur:
            query = """
                WITH scoped_events AS (
                    SELECT
                        user_id,
                        item_id::text AS item_id,
                        CASE
                            WHEN LOWER(event_type) = 'purchase' THEN %s
                            WHEN LOWER(event_type) = 'add_to_cart' THEN %s
                            WHEN LOWER(event_type) = 'click' THEN %s
                            WHEN LOWER(event_type) IN ('view', 'product_view') THEN %s
                            ELSE 0
                        END AS event_weight
                    FROM events
                    WHERE item_id IS NOT NULL
                      AND created_at >= NOW() - (%s::text || ' days')::interval
                ),
                seed_scores AS (
                    SELECT
                        user_id,
                        item_id AS seed_item_id,
                        SUM(event_weight) AS seed_weight
                    FROM scoped_events
                    WHERE item_id = ANY(%s::text[])
                    GROUP BY user_id, item_id
                ),
                candidate_scores AS (
                    SELECT
                        s2.user_id,
                        s2.item_id AS candidate_item_id,
                        SUM(s2.event_weight) AS candidate_weight
                    FROM scoped_events s2
                    GROUP BY s2.user_id, s2.item_id
                )
                SELECT
                    c.candidate_item_id,
                    SUM(s.seed_weight * c.candidate_weight) AS score
                FROM seed_scores s
                JOIN candidate_scores c
                  ON c.user_id = s.user_id
                WHERE c.candidate_item_id <> s.seed_item_id
                  AND c.candidate_item_id <> ALL(%s::text[])
                GROUP BY c.candidate_item_id
                ORDER BY score DESC
                LIMIT %s
            """
            cur.execute(
                query,
                (
                    EVENT_WEIGHTS["purchase"],
                    EVENT_WEIGHTS["add_to_cart"],
                    EVENT_WEIGHTS["click"],
                    EVENT_WEIGHTS["view"],
                    TREND_WINDOW_DAYS,
                    seed_item_ids,
                    seed_item_ids,
                    top_n,
                ),
            )
            rows = cur.fetchall()

        result = {str(item_id): float(score) for item_id, score in rows if item_id is not None}
        logger.info(
            "item_cf candidates fetched in %.2f ms (candidate_count=%s)",
            (time.perf_counter() - start) * 1000,
            len(result),
        )
        return result
    except Exception as exc:
        logger.exception("Error fetching item_cf candidates: %s", exc)
        return {}
