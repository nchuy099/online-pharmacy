import os
import sys
import time
import argparse
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from urllib.parse import urlparse

# Get the root directory (parent of the 'scripts' directory)
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

load_dotenv()
from scripts.knowledge_base.ingestion_service import setup_collection, qdrant, collection_name

def log(message):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}", flush=True)


def retry_qdrant_upsert(
    upsert_fn,
    product_code,
    max_attempts=5,
    initial_delay_seconds=0.5,
    backoff_multiplier=2.0,
    sleep_fn=time.sleep,
):
    delay_seconds = initial_delay_seconds
    for attempt in range(1, max_attempts + 1):
        try:
            upsert_fn()
            if attempt > 1:
                log(
                    f"[Phase 2] Qdrant upsert recovered for product_code={product_code} "
                    f"on attempt {attempt}/{max_attempts}."
                )
            return
        except Exception as exc:
            if attempt == max_attempts:
                log(
                    f"[Phase 2] Qdrant upsert failed after {max_attempts} attempts "
                    f"for product_code={product_code}: {exc}"
                )
                raise
            log(
                f"[Phase 2] Qdrant upsert attempt {attempt}/{max_attempts} failed "
                f"for product_code={product_code}: {exc}. Retrying in {delay_seconds:.1f}s..."
            )
            sleep_fn(delay_seconds)
            delay_seconds *= backoff_multiplier

def get_db_connection(connection_name="default"):
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        parsed = urlparse(database_url)
        dbname = parsed.path.lstrip("/")
        host = parsed.hostname
        port = parsed.port or 5432
        sslmode = os.getenv("DB_SSLMODE", "require")
        log(f"[DB:{connection_name}] Connecting via DATABASE_URL host={host} port={port} db={dbname} sslmode={sslmode}")
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            dbname=parsed.path.lstrip("/"),
            user=parsed.username,
            password=parsed.password,
            sslmode=sslmode,
            connect_timeout=10,
        )
    else:
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME", "smart_pharma")
        db_user = os.getenv("DB_USER", "postgres")
        db_password = os.getenv("DB_PASSWORD", "password")
        log(f"[DB:{connection_name}] Connecting via DB_* host={db_host} port={db_port} db={db_name}")
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            dbname=db_name,
            user=db_user,
            password=db_password,
            connect_timeout=10,
        )

    with conn.cursor() as cursor:
        cursor.execute("SELECT current_database(), current_user")
        current_db, current_user = cursor.fetchone()
    log(f"[DB:{connection_name}] Connected successfully to db={current_db} user={current_user}")
    if current_db != "smart_pharma":
        log(f"[DB:{connection_name}] WARNING expected db=smart_pharma but connected to db={current_db}")
    return conn


def strip_html(text):
    if not text:
        return ""
    return BeautifulSoup(str(text), "html.parser").get_text(separator=" ", strip=True)


def build_document_text(product):
    usage_clean = strip_html(product["usage"])
    dosage_clean = strip_html(product["dosage"])
    warning_clean = strip_html(product["careful"])
    description_clean = strip_html(product["description"])
    adverse_effect_clean = strip_html(product["adverse_effect"])
    preservation_clean = strip_html(product["preservation"])
    category_names = product["category_names"] or "Không có thông tin"
    brand = product["brand"] or "Không rõ"
    brand_origin = product["brand_origin"] or "Không rõ"
    producer = product["producer"] or "Không rõ"
    variants_text = product["variants_text"] or "Không có thông tin variant"
    display_name = product["web_name"] or product["name"]

    return f"""
Tên thuốc/sản phẩm: {display_name}
Tên hệ thống: {product['name']}
Thương hiệu: {brand} - Xuất xứ: {brand_origin}
Nhà sản xuất: {producer}
Danh mục: {category_names}
Liều dùng: {dosage_clean or 'Không có thông tin'}
Thành phần (Ingredients): {product['ingredients'] or 'Không có thông tin'}
Mô tả: {description_clean or 'Không có thông tin'}
Thông tin variants:
{variants_text}
Công dụng: {usage_clean or 'Không có thông tin'}
Cảnh báo: {warning_clean or 'Không có cảnh báo'}
Tác dụng phụ: {adverse_effect_clean or 'Không có thông tin'}
Bảo quản: {preservation_clean or 'Không có thông tin'}
"""

def fetch_products_for_kb():
    """
    Fetch all active products and aggregate related info used by KB.
    """
    query = """
    SELECT 
        p.id, 
        p.code,
        p.slug,
        p.name, 
        p.web_name,
        p.brand, 
        p.brand_origin, 
        p.producer,
        p.description,
        p.dosage, 
        p.usage,
        p.careful,
        p.adverse_effect,
        p.preservation,
        
        -- Aggregate categories (single row per product)
        (
            SELECT string_agg(DISTINCT c.name, ', ' ORDER BY c.name)
            FROM product_category pc
            JOIN categories c ON c.id = pc.category_id
            WHERE pc.product_id = p.id
        ) as category_names,

        -- Aggregate ingredients
        (
            SELECT string_agg(pi.name || ' (' || COALESCE(pi.short_description, '') || ')', ', ')
            FROM product_ingredients pi
            WHERE pi.product_id = p.id
        ) as ingredients,

        -- Aggregate active variants for richer KB context
        (
            SELECT string_agg(
                'SKU: ' || COALESCE(pv.sku, 'N/A')
                || ' | Đơn vị: ' || COALESCE(pv.unit_type, 'N/A')
                || ' | Quy cách: ' || COALESCE(pv.specification, 'N/A')
                || ' | Giá bán: ' || COALESCE(pv.sale_price::text, '0'),
                E'\n'
                ORDER BY pv.is_default DESC, pv.created_at ASC
            )
            FROM product_variants pv
            WHERE pv.product_id = p.id
              AND pv.is_active = true
        ) as variants_text

    FROM products p
    WHERE p.is_active = true
    """

    conn = get_db_connection("fetch_products")
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            log("[Phase fetch_products] Running products query...")
            cursor.execute(query)
            rows = cursor.fetchall()
            log(f"[Phase fetch_products] Query completed, fetched {len(rows)} active products.")
            return rows
    finally:
        conn.close()
        log("[DB:fetch_products] Connection closed.")

def ensure_pre_embed_table(conn):
    log("[Phase ensure_pre_embed_table] Ensuring pre_embed_products table exists (resume mode)...")
    with conn.cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pre_embed_products (
                product_id UUID NOT NULL UNIQUE,
                product_code TEXT PRIMARY KEY,
                slug TEXT,
                name TEXT,
                document_text TEXT NOT NULL,
                is_embedded BOOLEAN DEFAULT FALSE
            )
        """)

        # Keep backward compatibility if table was created with older schema.
        cursor.execute("ALTER TABLE pre_embed_products ADD COLUMN IF NOT EXISTS product_id UUID")
        cursor.execute("ALTER TABLE pre_embed_products ADD COLUMN IF NOT EXISTS product_code TEXT")
        cursor.execute("ALTER TABLE pre_embed_products ADD COLUMN IF NOT EXISTS slug TEXT")
        cursor.execute("ALTER TABLE pre_embed_products ADD COLUMN IF NOT EXISTS name TEXT")
        cursor.execute("ALTER TABLE pre_embed_products ADD COLUMN IF NOT EXISTS document_text TEXT")
        cursor.execute("ALTER TABLE pre_embed_products ADD COLUMN IF NOT EXISTS is_embedded BOOLEAN DEFAULT FALSE")

        cursor.execute("ALTER TABLE pre_embed_products ALTER COLUMN document_text SET NOT NULL")
        cursor.execute("ALTER TABLE pre_embed_products ALTER COLUMN product_id SET NOT NULL")

        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'pre_embed_products_pkey'
                      AND conrelid = 'pre_embed_products'::regclass
                ) THEN
                    ALTER TABLE pre_embed_products
                    ADD CONSTRAINT pre_embed_products_pkey PRIMARY KEY (product_code);
                END IF;
            END $$;
        """)
        cursor.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_pre_embed_products_product_id
            ON pre_embed_products (product_id)
        """)

        conn.commit()
    log("[Phase ensure_pre_embed_table] Table pre_embed_products is ready (existing state preserved).")

def run_prepare_phase(conn):
    products = fetch_products_for_kb()
    log(f"[Phase 1] Source products fetched: {len(products)}")

    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT product_id, product_code, document_text FROM pre_embed_products")
        existing_rows = cursor.fetchall()

    existing_by_code = {row["product_code"]: row for row in existing_rows}
    existing_by_id = {str(row["product_id"]): row for row in existing_rows}

    inserted = 0
    updated = 0
    skipped = 0
    reembed_queued = 0
    started_at = time.time()

    with conn.cursor() as cursor:
        for product in products:
            product_id = str(product["id"])
            product_code = product["code"]
            document_text = build_document_text(product)
            existing = existing_by_code.get(product_code) or existing_by_id.get(product_id)

            if not existing:
                cursor.execute(
                    """
                    INSERT INTO pre_embed_products
                        (product_id, product_code, slug, name, document_text, is_embedded)
                    VALUES (%s, %s, %s, %s, %s, FALSE)
                    """,
                    (product["id"], product_code, product["slug"], product["name"], document_text),
                )
                inserted += 1
                existing_ref = {
                    "product_id": product["id"],
                    "product_code": product_code,
                    "document_text": document_text,
                }
                existing_by_code[product_code] = existing_ref
                existing_by_id[product_id] = existing_ref
                continue

            old_product_id = str(existing["product_id"])
            old_product_code = existing["product_code"]
            old_document_text = existing["document_text"]
            is_changed = (
                old_product_id != product_id
                or old_product_code != product_code
                or old_document_text != document_text
            )

            if not is_changed:
                skipped += 1
                continue

            cursor.execute(
                """
                UPDATE pre_embed_products
                SET product_id = %s,
                    product_code = %s,
                    slug = %s,
                    name = %s,
                    document_text = %s,
                    is_embedded = CASE
                        WHEN document_text != %s THEN FALSE
                        ELSE is_embedded
                    END
                WHERE product_id = %s OR product_code = %s
                """,
                (
                    product["id"],
                    product_code,
                    product["slug"],
                    product["name"],
                    document_text,
                    document_text,
                    product["id"],
                    product_code,
                ),
            )
            updated += 1
            if old_document_text != document_text:
                reembed_queued += 1

            existing_ref = {
                "product_id": product["id"],
                "product_code": product_code,
                "document_text": document_text,
            }
            existing_by_code[product_code] = existing_ref
            existing_by_id[product_id] = existing_ref

    conn.commit()
    elapsed = time.time() - started_at
    log(
        f"[Phase 1] Done in {elapsed:.2f}s | inserted={inserted}, updated={updated}, "
        f"unchanged={skipped}, reembed_queued={reembed_queued}"
    )


def run_ingest_phase(conn):
    from scripts.knowledge_base.ingestion_service import _embed_content

    log("Setting up Qdrant Collection...")
    setup_collection()
    log(f"Qdrant collection ready: {collection_name}")

    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """
            SELECT product_id, product_code, slug, name, document_text
            FROM pre_embed_products
            WHERE is_embedded = FALSE
            """
        )
        un_embedded = cursor.fetchall()

    total_remaining = len(un_embedded)
    log(f"[Phase 2] Pending records for embed+upsert: {total_remaining}")
    if total_remaining == 0:
        log("[Phase 2] Nothing to process.")
        return

    success = 0
    failed = 0
    started_at = time.time()

    for i, record in enumerate(un_embedded, start=1):
        try:
            vector = _embed_content(record["document_text"])

            points = [
                {
                    "id": str(record["product_id"]),
                    "vector": vector,
                    "payload": {
                        "id": str(record["product_id"]),
                        "code": record["product_code"],
                        "slug": record["slug"],
                        "name": record["name"],
                        "text": record["document_text"],
                    },
                }
            ]
            retry_qdrant_upsert(
                upsert_fn=lambda: qdrant.upsert(
                    collection_name=collection_name,
                    points=points,
                ),
                product_code=record["product_code"],
            )

            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE pre_embed_products SET is_embedded = TRUE WHERE product_code = %s",
                    (record["product_code"],),
                )
            conn.commit()
            success += 1

            if i % 100 == 0 or i == total_remaining:
                log(f"[Phase 2] Progress {i}/{total_remaining} | success={success}, failed={failed}")
        except Exception as e:
            failed += 1
            log(
                f"[Phase 2] Failed product_code={record['product_code']} "
                f"product_id={record['product_id']}: {e}"
            )
            conn.rollback()

    elapsed = time.time() - started_at
    log(f"[Phase 2] Done in {elapsed:.2f}s | success={success}, failed={failed}")


def parse_args():
    parser = argparse.ArgumentParser(description="Build products knowledge base.")
    parser.add_argument(
        "--phase",
        choices=["prepare", "ingest", "all"],
        default="all",
        help="prepare: products -> pre_embed_products, ingest: pre_embed_products -> qdrant, all: run both",
    )
    return parser.parse_args()


def build_knowledge_base(phase="all"):
    log("Connecting main DB session...")
    conn = get_db_connection("main")
    try:
        ensure_pre_embed_table(conn)

        if phase in ("prepare", "all"):
            log("[Phase 1] Start: products -> pre_embed_products")
            run_prepare_phase(conn)

        if phase in ("ingest", "all"):
            log("[Phase 2] Start: pre_embed_products (is_embedded=false) -> qdrant")
            run_ingest_phase(conn)

    except Exception as e:
        log(f"Main error: {e}")
    finally:
        conn.close()
        log("[DB:main] Connection closed.")

    log("Knowledge base construction complete!")

if __name__ == "__main__":
    args = parse_args()
    build_knowledge_base(args.phase)
