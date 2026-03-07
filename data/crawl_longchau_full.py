import requests
from bs4 import BeautifulSoup
import json
import time
import os
import psycopg2
import psycopg2.extras
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import threading
import queue

# Configuration
SEARCH_API_URL = "https://api.nhathuoclongchau.com.vn/lccus/search-product-service/api/products/ecom/product/search/cate"
MAX_RESULT_COUNT = 20  # API Max
RETRY_DELAY = 5
REQUEST_DELAY = 0.5
DATABASE_URL = "postgresql://postgres:password@localhost:5432/smart_pharma"
MAX_THREADS = 8
COMMIT_INTERVAL = 100

# Categories to crawl
CATEGORIES = [
    "thuc-pham-chuc-nang/vitamin-khoang-chat",
    "thuc-pham-chuc-nang/sinh-ly-noi-tiet-to",
    "thuc-pham-chuc-nang/co-xuong-khop",
    "thuc-pham-chuc-nang/ho-tro-tieu-hoa",
    "thuc-pham-chuc-nang/than-kinh-nao",
    "thuc-pham-chuc-nang/lam-dep",
    "thuc-pham-chuc-nang/tim-mach-huyet-ap",
    "thuc-pham-chuc-nang/gan-mat",
    "thuc-pham-chuc-nang/bao-ve-mat",
    "thuc-pham-chuc-nang/suc-khoe-duong-ho-hap-ho-xoang",
    "thuc-pham-chuc-nang/tieu-duong",
    "thuc-pham-chuc-nang/sua",
    "thuc-pham-chuc-nang/ho-tro-mien-dich-tang-suc-de-khang",
    "thuc-pham-chuc-nang/than-tiet-nieu",
    "duoc-my-pham/cham-soc-da-mat",
    "duoc-my-pham/cham-soc-co-the",
    "duoc-my-pham/giai-phap-lan-da",
    "duoc-my-pham/cham-soc-toc-da-dau",
    "duoc-my-pham/my-pham-trang-diem",
    "duoc-my-pham/cham-soc-da-vung-mat",
    "duoc-my-pham/san-pham-tu-thien-nhien",
    "cham-soc-ca-nhan/ho-tro-tinh-duc",
    "cham-soc-ca-nhan/thuc-pham-do-uong",
    "cham-soc-ca-nhan/ve-sinh-ca-nhan",
    "cham-soc-ca-nhan/cham-soc-rang-mieng",
    "cham-soc-ca-nhan/do-dung-gia-dinh",
    "cham-soc-ca-nhan/hang-tong-hop",
    "cham-soc-ca-nhan/tinh-dau-cac-loai",
    "cham-soc-ca-nhan/thiet-bi-lam-dep",
    "trang-thiet-bi-y-te/dung-cu-y-te",
    "trang-thiet-bi-y-te/dung-cu-theo-doi",
    "trang-thiet-bi-y-te/dung-cu-so-cuu",
    "trang-thiet-bi-y-te/khau-trang",
    "thuoc"
]

# Set a limit per category if needed (e.g., 50). Set to None to fetch ALL products.
LIMIT_PER_CATEGORY = None 

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json"
}

REQUIRED_DETAIL_FIELDS = [
    "name", "webName", "primaryImage", "secondaryImages", "brand", 
    "brandOrigin", "producer", "warning", "prices", "ingredient", 
    "usage", "dosage", "adverseEffect", "preservation", "measureUnitName", "measureUnitCode",
    "price"
]

# Thread safety & Queue
print_lock = threading.Lock()
progress_counter = 0
db_queue = queue.Queue()
stop_worker = False

def init_db():
    print("Initializing database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Check if table exists and has old column name, or create new
        cur.execute("""
            CREATE TABLE IF NOT EXISTS raw_products (
                id SERIAL PRIMARY KEY,
                url TEXT UNIQUE,
                raw_json JSONB,
                crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Migration: Rename source_url to url if it exists
        cur.execute("""
            DO $$ 
            BEGIN 
                IF EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='raw_products' AND column_name='source_url') THEN
                    ALTER TABLE raw_products RENAME COLUMN source_url TO url;
                END IF;
            END $$;
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Database initialization failed: {e}")

def get_existing_urls():
    """Fetch all URLs already in the database to avoid re-crawling."""
    print("Fetching existing URLs from database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT url FROM raw_products")
        urls = {row[0] for row in cur.fetchall()}
        cur.close()
        conn.close()
        return urls
    except Exception as e:
        print(f"Failed to fetch existing URLs: {e}")
        return set()

def db_worker():
    """Persistent consumer of the db_queue. Commits every 50 records."""
    print("DB Worker: Starting persistent connection...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        insert_query = """
            INSERT INTO raw_products (url, raw_json, crawled_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (url) 
            DO UPDATE SET raw_json = EXCLUDED.raw_json, crawled_at = EXCLUDED.crawled_at;
        """
        
        batch = []
        while True:
            try:
                # Wait for record or check if we should stop
                record = db_queue.get(timeout=1.0)
                if record is None: # Sentinel value to stop
                    break
                
                url = f"https://nhathuoclongchau.com.vn/{record.get('slug', '').lstrip('/')}"
                batch.append((url, json.dumps(record), datetime.now()))
                
                if len(batch) >= COMMIT_INTERVAL:
                    psycopg2.extras.execute_batch(cur, insert_query, batch)
                    conn.commit()
                    print(f"DB Worker: Committed batch of {len(batch)}.")
                    batch = []
                    
                db_queue.task_done()
            except queue.Empty:
                if stop_worker:
                    break
                if batch: # Commit remaining if idle
                    psycopg2.extras.execute_batch(cur, insert_query, batch)
                    conn.commit()
                    print(f"DB Worker: Committed remaining {len(batch)} records (Idle).")
                    batch = []
                continue
        
        # Final cleanup
        if batch:
            psycopg2.extras.execute_batch(cur, insert_query, batch)
            conn.commit()
            print(f"DB Worker: Final commit of {len(batch)} records.")
            
        cur.close()
        conn.close()
        print("DB Worker: Connection closed.")
    except Exception as e:
        print(f"DB Worker Error: {e}")

def discover_products():
    all_discovered = {}
    for cate in CATEGORIES:
        print(f"Discovering category: {cate}")
        skip_count = 0
        total_to_fetch = LIMIT_PER_CATEGORY
        
        payload = {
            "category": [cate],
            "maxResultCount": MAX_RESULT_COUNT,
            "skipCount": skip_count
        }
        
        try:
            response = requests.post(SEARCH_API_URL, headers=HEADERS, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            api_total = data.get("totalCount", 0)
            total_to_fetch = min(LIMIT_PER_CATEGORY, api_total) if LIMIT_PER_CATEGORY else api_total
            print(f"  Category total: {api_total}. Planned to fetch: {total_to_fetch}")
            
            while skip_count < total_to_fetch:
                payload["skipCount"] = skip_count
                if skip_count > 0:
                    response = requests.post(SEARCH_API_URL, headers=HEADERS, json=payload, timeout=30)
                    data = response.json()
                
                products = data.get("products", [])
                if not products: break
                for p in products:
                    sku = p.get("sku")
                    if sku and sku not in all_discovered:
                        all_discovered[sku] = {"sku": sku, "slug": p.get("slug"), "category": p.get("category")}
                
                skip_count += MAX_RESULT_COUNT
                time.sleep(REQUEST_DELAY)
        except Exception as e:
            print(f"  Error discovering {cate}: {e}")
            
    return list(all_discovered.values())

def crawl_single_product(p):
    global progress_counter
    sku = p['sku']
    slug = p['slug']
    url = f"https://nhathuoclongchau.com.vn/{slug.lstrip('/')}"
    
    try:
        res = requests.get(url, headers=HEADERS, timeout=30)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "html.parser")
        script_tag = soup.find("script", {"id": "__NEXT_DATA__"})
        if script_tag:
            data = json.loads(script_tag.string)
            detail = data["props"]["pageProps"].get("product") or data["props"]["pageProps"].get("initialState", {}).get("productDetail")
            if detail:
                record = {"sku": sku, "slug": slug, "category": p.get("category")}
                for field in REQUIRED_DETAIL_FIELDS:
                    record[field] = detail.get(field)
                
                # Push to DB Queue
                db_queue.put(record)
                
                with print_lock:
                    progress_counter += 1
                    if progress_counter % 10 == 0:
                        print(f"Progress: {progress_counter} products crawled...")
    except Exception as e:
        with print_lock:
            print(f"Failed {url}: {e}")

def main():
    global stop_worker
    init_db()
    
    # Start DB Worker
    worker_thread = threading.Thread(target=db_worker, daemon=True)
    worker_thread.start()
    
    print("Step 1: Discovering products...")
    discovered = discover_products()
    
    # Step 1.5: Filter out already crawled products
    existing_urls = get_existing_urls()
    to_crawl = []
    for p in discovered:
        url = f"https://nhathuoclongchau.com.vn/{p['slug'].lstrip('/')}"
        if url not in existing_urls:
            to_crawl.append(p)
            
    print(f"Total Unique Products discovered: {len(discovered)}")
    print(f"Products already in DB: {len(existing_urls)}")
    print(f"New products to crawl: {len(to_crawl)}")
    
    if not to_crawl:
        print("No new products to crawl. Exiting Phase 2.")
    else:
        print("\nStep 2: Parallel Crawling & Parallel Saving...")
        with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
            executor.map(crawl_single_product, to_crawl)
    
    # Wait for queue to drain
    print("Finalizing... Waiting for DB worker to finish remaining tasks.")
    db_queue.join()
    stop_worker = True
    db_queue.put(None) # Sentinel
    worker_thread.join()
    
    print("Done!")

if __name__ == "__main__":
    main()

