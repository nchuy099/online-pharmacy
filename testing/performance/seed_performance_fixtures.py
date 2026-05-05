#!/usr/bin/env python3
"""Build product-focused performance fixtures from DB data.

Workflow:
1. Pick categories with at least 10 primary-image products.
2. Export about 20 categories and 1000 products into `testing/performance/data/products.json`.
3. Keep the fixture focused on product-read load tests only.
"""

from __future__ import annotations

import argparse
import json
import hashlib
import os
import random
import re
import string
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Any

import psycopg2
from psycopg2.extras import execute_values, register_uuid

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
DEFAULT_OUTPUT_DIR = SCRIPT_DIR / "data"
UTC = timezone.utc


@dataclass(frozen=True)
class CatalogCategory:
    id: uuid.UUID
    parent_id: uuid.UUID | None
    slug: str
    name: str
    level: int
    is_active: bool
    product_count: int


@dataclass(frozen=True)
class CatalogProduct:
    id: uuid.UUID
    slug: str
    name: str
    category_slug: str


@dataclass(frozen=True)
class CatalogVariant:
    id: uuid.UUID
    product_id: uuid.UUID
    product_slug: str
    product_name: str
    sku: str
    sale_price: Decimal
    average_cost: Decimal
    quantity_available: int
    is_default: bool
    is_active: bool


@dataclass(frozen=True)
class AddressTemplate:
    ghn_province_id: int | None
    ghn_district_id: int | None
    ghn_ward_code: str | None
    province_name: str | None
    district_name: str | None
    ward_name: str | None
    address: str


def load_env_file() -> None:
    for candidate in (
        SCRIPT_DIR / ".env",
        REPO_ROOT / "data" / ".env",
        REPO_ROOT / ".env",
        Path("data/.env"),
        Path(".env"),
    ):
        if not candidate.exists():
            continue
        with candidate.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                if line.startswith("export "):
                    line = line[len("export ") :]
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip("'").strip('"'))
        break


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export product-only performance fixtures.")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--db-host", default=os.getenv("DB_HOST"))
    parser.add_argument("--db-port", default=os.getenv("DB_PORT"))
    parser.add_argument("--db-name", default=os.getenv("DB_NAME"))
    parser.add_argument("--db-user", default=os.getenv("DB_USER"))
    parser.add_argument("--db-password", default=os.getenv("DB_PASSWORD"))
    parser.add_argument("--database-url", default=os.getenv("DATABASE_URL"))
    parser.add_argument("--catalog-limit", type=int, default=1000)
    parser.add_argument("--primary-image-only", action="store_true")
    return parser.parse_args()


def money(value: Decimal | int | float | str) -> Decimal:
    if not isinstance(value, Decimal):
        value = Decimal(str(value))
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def normalize_slug(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def db_dsn(args: argparse.Namespace) -> str:
    if args.database_url:
        return args.database_url

    required = ["db_host", "db_port", "db_name", "db_user", "db_password"]
    missing = [name for name in required if not getattr(args, name)]
    if missing:
        raise RuntimeError(f"Missing DB env vars: {', '.join(missing)}")

    return (
        f"dbname={args.db_name} "
        f"user={args.db_user} "
        f"password={args.db_password} "
        f"host={args.db_host} "
        f"port={args.db_port}"
    )


def fetch_categories(conn, *, min_product_count: int = 10, limit: int = 20) -> list[CatalogCategory]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                c.id,
                c.parent_id,
                c.slug,
                c.name,
                c.level,
                c.is_active,
                COUNT(DISTINCT p.id) AS product_count
            FROM categories c
            JOIN product_category pc ON pc.category_id = c.id
            JOIN products p ON p.id = pc.product_id
            WHERE c.is_active = TRUE
              AND p.is_active = TRUE
              AND EXISTS (
                  SELECT 1
                  FROM product_images pi
                  WHERE pi.product_id = p.id
                    AND pi.is_primary = TRUE
              )
            GROUP BY c.id, c.parent_id, c.slug, c.name, c.level, c.is_active
            HAVING COUNT(DISTINCT p.id) >= %s
            ORDER BY product_count DESC, c.level ASC, c.name ASC
            LIMIT %s
            """,
            (min_product_count, limit),
        )
        rows = cur.fetchall()
    return [
        CatalogCategory(
            id=row[0],
            parent_id=row[1],
            slug=row[2],
            name=row[3],
            level=row[4],
            is_active=row[5],
            product_count=int(row[6]),
        )
        for row in rows
    ]


def fetch_products_for_categories(
    conn,
    category_ids: list[uuid.UUID],
) -> list[CatalogProduct]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                p.id,
                p.slug,
                p.name,
                c.slug AS category_slug,
                p.created_at
            FROM products p
            JOIN product_category pc ON pc.product_id = p.id
            JOIN categories c ON c.id = pc.category_id
            WHERE p.is_active = TRUE
              AND c.id = ANY(%s)
              AND EXISTS (
                  SELECT 1
                  FROM product_images pi
                  WHERE pi.product_id = p.id
                    AND pi.is_primary = TRUE
              )
            ORDER BY c.slug ASC, p.created_at ASC, p.name ASC
            """,
            (category_ids,),
        )
        rows = cur.fetchall()
    return [
        CatalogProduct(
            id=row[0],
            slug=row[1],
            name=row[2],
            category_slug=row[3],
        )
        for row in rows
    ]


def select_products_for_export(
    categories: list[CatalogCategory],
    category_products: list[CatalogProduct],
    *,
    limit: int,
) -> list[CatalogProduct]:
    category_order = [category.slug for category in categories]
    buckets: dict[str, list[CatalogProduct]] = {slug: [] for slug in category_order}
    for product in category_products:
        buckets.setdefault(product.category_slug, []).append(product)

    selected: list[CatalogProduct] = []
    seen_ids: set[uuid.UUID] = set()
    progress = True
    while len(selected) < limit and progress:
        progress = False
        for category_slug in category_order:
            queue = buckets.get(category_slug, [])
            while queue and queue[0].id in seen_ids:
                queue.pop(0)
            if not queue:
                continue

            product = queue.pop(0)
            if product.id in seen_ids:
                continue

            selected.append(product)
            seen_ids.add(product.id)
            progress = True
            if len(selected) >= limit:
                break

    return selected


def export_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=True, indent=2)


def pick_address_template(conn) -> AddressTemplate:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                ghn_province_id,
                ghn_district_id,
                ghn_ward_code,
                province_name,
                district_name,
                ward_name,
                address
            FROM addresses
            WHERE ghn_province_id IS NOT NULL
              AND ghn_district_id IS NOT NULL
              AND ghn_ward_code IS NOT NULL
            ORDER BY is_default DESC, created_at ASC
            LIMIT 1
            """
        )
        row = cur.fetchone()

    if not row:
        raise RuntimeError("No GHN-enabled address template found in the database")

    return AddressTemplate(
        ghn_province_id=row[0],
        ghn_district_id=row[1],
        ghn_ward_code=row[2],
        province_name=row[3],
        district_name=row[4],
        ward_name=row[5],
        address=row[6],
    )


def build_customer_email(run_prefix: str, index: int, customer_prefix: str, customer_count: int) -> str:
    width = max(4, len(str(customer_count)))
    return f"{customer_prefix}{run_prefix}_{index:0{width}d}@example.com"


def build_customer_full_name(index: int) -> str:
    return f"PFM User {index:05d}"


def build_customer_phone(run_prefix: str, index: int) -> str:
    digest = hashlib.sha1(run_prefix.encode("utf-8")).hexdigest()
    seed_block = int(digest[:8], 16) % 1_000_000
    return f"09{seed_block:06d}{index:04d}"


def get_role_id(conn, role_name: str) -> uuid.UUID:
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM roles WHERE name = %s LIMIT 1", (role_name,))
        row = cur.fetchone()
    if not row:
        raise RuntimeError(f"Role not found: {role_name}")
    return row[0]


def main() -> int:
    load_env_file()
    args = parse_args()
    output_dir = Path(args.output_dir)

    dsn = db_dsn(args)
    print("[phase] select categories", flush=True)

    with psycopg2.connect(dsn) as conn:
        register_uuid()
        categories = fetch_categories(conn, min_product_count=10, limit=20)
        if not categories:
            raise RuntimeError("No categories with at least 10 primary-image products were found")

        category_products = fetch_products_for_categories(conn, [category.id for category in categories])
        products = select_products_for_export(
            categories,
            category_products,
            limit=args.catalog_limit,
        )

    products_payload = [
        {
            "id": str(item.id),
            "slug": item.slug,
            "name": item.name,
            "categorySlug": item.category_slug,
        }
        for item in products
    ]

    export_json(output_dir / "products.json", products_payload)
    for stale_name in ("categories.json", "customers.json", "variants.json"):
        stale_path = output_dir / stale_name
        if stale_path.exists():
            stale_path.unlink()

    print(
        f"Performance fixtures ready: categories={len(categories)} products={len(products_payload)} output={output_dir}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
