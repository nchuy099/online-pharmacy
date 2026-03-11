#!/usr/bin/env python3
"""Build performance fixtures from DB data and seed runnable customer accounts.

Workflow:
1. Export categories, products, and variants from PostgreSQL into
   `testing/performance/data/`.
2. Seed runnable performance customers and addresses directly in PostgreSQL.
3. Import stock directly in PostgreSQL for every exported variant.

The exported fixtures are intentionally small in shape but can be large in row
count. They are what the k6 performance scripts read at runtime.
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
from psycopg2.extras import register_uuid

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
DEFAULT_CUSTOMER_PASSWORD = os.getenv("CUSTOMER_PASSWORD", "Password123!")
DEFAULT_OUTPUT_DIR = SCRIPT_DIR / "data"
DEFAULT_CUSTOMER_COUNT = int(os.getenv("PERF_CUSTOMER_COUNT", "100"))
DEFAULT_STOCK_QUANTITY = int(os.getenv("PERF_STOCK_QUANTITY", "100000"))
DEFAULT_ADDRESS_STREET_PREFIX = os.getenv("PERF_ADDRESS_PREFIX", "PFM address")
DEFAULT_RUN_PREFIX = os.getenv("PERF_RUN_PREFIX", "")
UTC = timezone.utc


@dataclass(frozen=True)
class CatalogCategory:
    id: uuid.UUID
    parent_id: uuid.UUID | None
    slug: str
    name: str
    level: int
    is_active: bool


@dataclass(frozen=True)
class CatalogProduct:
    id: uuid.UUID
    slug: str
    name: str
    category_ids: list[uuid.UUID]


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
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip("'").strip('"'))
        break


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export performance fixtures and seed runnable customers.")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--db-host", default=os.getenv("DB_HOST"))
    parser.add_argument("--db-port", default=os.getenv("DB_PORT"))
    parser.add_argument("--db-name", default=os.getenv("DB_NAME"))
    parser.add_argument("--db-user", default=os.getenv("DB_USER"))
    parser.add_argument("--db-password", default=os.getenv("DB_PASSWORD"))
    parser.add_argument("--database-url", default=os.getenv("DATABASE_URL"))
    parser.add_argument("--customer-password", default=DEFAULT_CUSTOMER_PASSWORD)
    parser.add_argument("--customer-count", type=int, default=DEFAULT_CUSTOMER_COUNT)
    parser.add_argument("--run-prefix", default=DEFAULT_RUN_PREFIX)
    parser.add_argument("--customer-prefix", default="PFM_")
    parser.add_argument("--address-street-prefix", default=DEFAULT_ADDRESS_STREET_PREFIX)
    parser.add_argument("--stock-quantity", type=int, default=DEFAULT_STOCK_QUANTITY)
    parser.add_argument("--catalog-limit", type=int, default=None)
    return parser.parse_args()


def money(value: Decimal | int | float | str) -> Decimal:
    if not isinstance(value, Decimal):
        value = Decimal(str(value))
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def normalize_slug(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def make_run_prefix(value: str | None) -> str:
    if value:
        return normalize_slug(value)
    stamp = datetime.now(tz=UTC).strftime("%Y%m%d%H%M%S")
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"pfm-{stamp}-{suffix}"


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


def fetch_categories(conn) -> list[CatalogCategory]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, parent_id, slug, name, level, is_active
            FROM categories
            WHERE is_active = TRUE
            ORDER BY level ASC, name ASC
            """
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
        )
        for row in rows
    ]


def fetch_products(conn) -> list[CatalogProduct]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT p.id, p.slug, p.name, COALESCE(array_agg(pc.category_id ORDER BY pc.category_id), '{}') AS category_ids
            FROM products p
            LEFT JOIN product_category pc ON pc.product_id = p.id
            WHERE p.is_active = TRUE
            GROUP BY p.id, p.slug, p.name
            ORDER BY p.created_at ASC, p.name ASC
            """
        )
        rows = cur.fetchall()
    return [
        CatalogProduct(
            id=row[0],
            slug=row[1],
            name=row[2],
            category_ids=[item for item in row[3] if item is not None],
        )
        for row in rows
    ]


def fetch_variants(conn) -> list[CatalogVariant]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                v.id,
                v.product_id,
                p.slug,
                p.name,
                v.sku,
                v.sale_price,
                COALESCE(v.average_cost, 0),
                COALESCE(i.quantity_on_hand - i.quantity_reserved, 0) AS quantity_available,
                v.is_default,
                v.is_active
            FROM product_variants v
            JOIN products p ON p.id = v.product_id
            LEFT JOIN inventories i ON i.variant_id = v.id
            WHERE v.is_active = TRUE
            ORDER BY v.created_at ASC, p.name ASC, v.sku ASC
            """
        )
        rows = cur.fetchall()
    return [
        CatalogVariant(
            id=row[0],
            product_id=row[1],
            product_slug=row[2],
            product_name=row[3],
            sku=row[4],
            sale_price=money(row[5]),
            average_cost=money(row[6]),
            quantity_available=int(row[7] or 0),
            is_default=row[8],
            is_active=row[9],
        )
        for row in rows
    ]


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


def build_customer_email(run_prefix: str, index: int, customer_prefix: str) -> str:
    return f"{customer_prefix}{run_prefix}_{index:05d}@example.com"


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


def seed_customers_and_addresses(
    *,
    conn,
    run_prefix: str,
    customer_count: int,
    customer_password: str,
    customer_prefix: str,
    address_template: AddressTemplate,
    address_street_prefix: str,
) -> list[dict[str, Any]]:
    customer_role_id = get_role_id(conn, "CUSTOMER")
    customers: list[dict[str, Any]] = []
    with conn.cursor() as cur:
        for index in range(1, customer_count + 1):
            email = build_customer_email(run_prefix, index, customer_prefix)
            full_name = build_customer_full_name(index)
            phone = build_customer_phone(run_prefix, index)

            cur.execute(
                """
                INSERT INTO users (
                    id,
                    role_id,
                    email,
                    full_name,
                    password,
                    status,
                    created_at,
                    updated_at
                )
                VALUES (
                    gen_random_uuid(),
                    %s,
                    %s,
                    %s,
                    crypt(%s, gen_salt('bf')),
                    'ACTIVE',
                    NOW(),
                    NOW()
                )
                RETURNING id
                """,
                (customer_role_id, email, full_name, customer_password),
            )
            user_id = cur.fetchone()[0]

            cur.execute(
                """
                INSERT INTO user_auth_providers (
                    id,
                    user_id,
                    provider,
                    provider_user_id,
                    email_at_provider,
                    created_at,
                    updated_at
                )
                VALUES (
                    gen_random_uuid(),
                    %s,
                    'LOCAL',
                    NULL,
                    %s,
                    NOW(),
                    NOW()
                )
                """,
                (user_id, email),
            )

            cur.execute(
                """
                INSERT INTO addresses (
                    id,
                    user_id,
                    full_name,
                    phone_number,
                    address,
                    ghn_province_id,
                    ghn_district_id,
                    ghn_ward_code,
                    province_name,
                    district_name,
                    ward_name,
                    is_default,
                    created_at,
                    updated_at
                )
                VALUES (
                    gen_random_uuid(),
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    TRUE,
                    NOW(),
                    NOW()
                )
                RETURNING id
                """,
                (
                    user_id,
                    full_name,
                    phone,
                    f"{address_street_prefix} {index:05d}",
                    address_template.ghn_province_id,
                    address_template.ghn_district_id,
                    address_template.ghn_ward_code,
                    address_template.province_name,
                    address_template.district_name,
                    address_template.ward_name,
                ),
            )
            address_id = cur.fetchone()[0]

            customers.append(
                {
                    "identifier": email,
                    "password": customer_password,
                    "fullName": full_name,
                    "userId": str(user_id),
                    "addressId": str(address_id),
                }
            )

    return customers


def ensure_inventory_row(conn, variant_id: uuid.UUID) -> uuid.UUID:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO inventories (
                id,
                variant_id,
                quantity_on_hand,
                quantity_reserved,
                reorder_level,
                safety_stock,
                created_at,
                updated_at
            )
            VALUES (
                gen_random_uuid(),
                %s,
                0,
                0,
                0,
                0,
                NOW(),
                NOW()
            )
            ON CONFLICT (variant_id) DO NOTHING
            RETURNING id
            """,
            (variant_id,),
        )
        row = cur.fetchone()
        if row:
            return row[0]

        cur.execute("SELECT id FROM inventories WHERE variant_id = %s", (variant_id,))
        existing = cur.fetchone()
        if not existing:
            raise RuntimeError(f"Inventory row missing for variant {variant_id}")
        return existing[0]


def seed_stock(
    *,
    conn,
    variants: list[CatalogVariant],
    stock_quantity: int,
    run_prefix: str,
) -> None:
    if stock_quantity <= 0:
        raise RuntimeError("stock_quantity must be > 0")

    with conn.cursor() as cur:
        total = len(variants)
        for index, variant in enumerate(variants, start=1):
            inventory_id = ensure_inventory_row(conn, variant.id)

            cur.execute(
                "SELECT quantity_on_hand FROM inventories WHERE id = %s FOR UPDATE",
                (inventory_id,),
            )
            row = cur.fetchone()
            current_qty = int(row[0] or 0) if row else 0

            unit_cost = money(variant.sale_price * Decimal("0.80"))
            total_qty = current_qty + stock_quantity
            current_avg = variant.average_cost
            weighted_avg = (
                money(
                    (current_avg * Decimal(current_qty) + unit_cost * Decimal(stock_quantity))
                    / Decimal(total_qty)
                )
                if total_qty > 0
                else unit_cost
            )

            cur.execute(
                """
                UPDATE inventories
                SET quantity_on_hand = quantity_on_hand + %s,
                    updated_at = NOW()
                WHERE id = %s
                """,
                (stock_quantity, inventory_id),
            )

            cur.execute(
                """
                INSERT INTO inventory_transactions (
                    id,
                    inventory_id,
                    type,
                    quantity,
                    unit_cost,
                    note,
                    created_at,
                    updated_at
                )
                VALUES (
                    gen_random_uuid(),
                    %s,
                    'IMPORT',
                    %s,
                    %s,
                    %s,
                    NOW(),
                    NOW()
                )
                """,
                (inventory_id, stock_quantity, unit_cost, f"PFM stock seed {run_prefix}"),
            )

            cur.execute(
                """
                UPDATE product_variants
                SET latest_import_cost = %s,
                    average_cost = %s,
                    updated_at = NOW()
                WHERE id = %s
                """,
                (unit_cost, weighted_avg, variant.id),
            )

            if index == 1 or index % 100 == 0 or index == total:
                print(f"[stock] imported {index}/{total} variants", flush=True)


def main() -> int:
    load_env_file()
    args = parse_args()
    run_prefix = make_run_prefix(args.run_prefix or None)
    output_dir = Path(args.output_dir)

    dsn = db_dsn(args)

    with psycopg2.connect(dsn) as conn:
        register_uuid()

        categories = fetch_categories(conn)
        products = fetch_products(conn)
        variants = fetch_variants(conn)

        if args.catalog_limit is not None:
            categories = categories[: args.catalog_limit]
            products = products[: args.catalog_limit]
            variants = variants[: args.catalog_limit]

    categories_payload = [
        {
            "id": str(item.id),
            "parentId": str(item.parent_id) if item.parent_id else None,
            "slug": item.slug,
            "name": item.name,
            "level": item.level,
            "isActive": item.is_active,
        }
        for item in categories
    ]
    products_payload = [
        {
            "id": str(item.id),
            "slug": item.slug,
            "name": item.name,
            "categoryIds": [str(category_id) for category_id in item.category_ids],
        }
        for item in products
    ]
    variants_payload = [
        {
            "id": str(item.id),
            "productId": str(item.product_id),
            "productSlug": item.product_slug,
            "productName": item.product_name,
            "sku": item.sku,
            "salePrice": str(item.sale_price),
            "quantityAvailable": item.quantity_available,
            "isDefault": item.is_default,
            "isActive": item.is_active,
        }
        for item in variants
    ]

    export_json(output_dir / "categories.json", categories_payload)
    export_json(output_dir / "products.json", products_payload)
    export_json(output_dir / "variants.json", variants_payload)

    customers_payload: list[dict[str, Any]] = []

    with psycopg2.connect(dsn) as conn:
        register_uuid()
        address_template = pick_address_template(conn)
        customers_payload = seed_customers_and_addresses(
            conn=conn,
            run_prefix=run_prefix,
            customer_count=args.customer_count,
            customer_password=args.customer_password,
            customer_prefix=args.customer_prefix,
            address_template=address_template,
            address_street_prefix=args.address_street_prefix,
        )

    export_json(output_dir / "customers.json", customers_payload)

    with psycopg2.connect(dsn) as conn:
        register_uuid()
        seed_stock(
            conn=conn,
            variants=variants,
            stock_quantity=args.stock_quantity,
            run_prefix=run_prefix,
        )

    print(
        "Performance fixtures ready: "
        f"categories={len(categories_payload)} "
        f"products={len(products_payload)} "
        f"variants={len(variants_payload)} "
        f"customers={len(customers_payload)} "
        f"stock_quantity={args.stock_quantity} "
        f"output={output_dir}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
