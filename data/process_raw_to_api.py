import argparse
import json
import os
import re
import time
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Tuple

import psycopg2
import requests

def _load_env_file() -> None:
    env_paths = [
        os.path.join(os.path.dirname(__file__), ".env"),
        ".env",
    ]
    for path in env_paths:
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip("'").strip('"')
                os.environ.setdefault(key, value)
        break

_load_env_file()

BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
ADMIN_URL = f"{BASE_URL}/admin"
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/smart_pharma")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "50"))
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))

if not os.getenv("DATABASE_URL"):
    raise RuntimeError("DATABASE_URL env var is required")


@dataclass
class Counters:
    scanned: int = 0
    category_created: int = 0
    category_reused: int = 0
    product_created: int = 0
    product_skipped: int = 0
    product_failed: int = 0
    invalid_slug: int = 0
    no_category: int = 0
    no_variant: int = 0
    errors: List[str] = field(default_factory=list)


class Importer:
    def __init__(self, dry_run: bool = False, limit: Optional[int] = None):
        self.dry_run = dry_run
        self.limit = limit
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.counters = Counters()
        self.category_cache: Dict[str, str] = {}
        self.category_by_name: Dict[str, str] = {}
        self.category_by_path_slug: Dict[str, str] = {}
        self.category_by_context_slug: Dict[Tuple[str, int, str], str] = {}
        self.category_by_context_name: Dict[Tuple[str, int, str], str] = {}
        self.existing_product_slugs: set[str] = set()
        self.log_category_steps = os.getenv("LOG_CATEGORY_STEPS", "false").lower() in ("1", "true", "yes")

    def run(self) -> None:
        start = datetime.now()
        self._login()
        self._load_existing_categories()
        self._load_existing_product_slugs()

        rows = self._fetch_raw_rows()
        if self.limit:
            rows = rows[: self.limit]

        prepared: List[Tuple[int, Dict[str, Any], str]] = []

        print(f"[INFO] Phase 1: ensuring categories from {len(rows)} raw rows")
        for row_id, raw in rows:
            self.counters.scanned += 1
            leaf_category_id = self._ensure_category_chain(raw)
            if not leaf_category_id:
                self.counters.no_category += 1
                self.counters.product_failed += 1
                self._record_error(row_id, "category", "cannot resolve leaf category")
                continue
            prepared.append((row_id, raw, leaf_category_id))

        print(f"[INFO] Phase 2: importing products (prepared={len(prepared)})")
        batch: List[Tuple[int, Dict[str, Any]]] = []

        for row_id, raw, leaf_category_id in prepared:
            payload = self._map_product_payload(row_id, raw, leaf_category_id)
            if payload is None:
                continue
            slug = payload["slug"]
            if slug in self.existing_product_slugs:
                self.counters.product_skipped += 1
                continue
            batch.append((row_id, payload))
            if len(batch) >= BATCH_SIZE:
                self._submit_batch(batch)
                batch = []

        if batch:
            self._submit_batch(batch)

        self._print_summary(start)

    def run_sync_categories_only(self) -> None:
        start = datetime.now()
        self._login()
        self._load_existing_categories()

        rows = self._fetch_raw_rows()
        if self.limit:
            rows = rows[: self.limit]

        print(f"[INFO] Sync categories only from {len(rows)} raw rows")
        for row_id, raw in rows:
            self.counters.scanned += 1
            leaf_category_id = self._ensure_category_chain(raw)
            if not leaf_category_id:
                self.counters.no_category += 1
                self.counters.product_failed += 1
                self._record_error(row_id, "category", "cannot resolve leaf category")

        self._print_summary(start)

    def _login(self) -> None:
        payload = {"identifier": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        response = self.session.post(f"{BASE_URL}/auth/login", json=payload, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        body = self._json(response)
        token = (
            body.get("accessToken")
            or body.get("data", {}).get("accessToken")
            or body.get("result", {}).get("accessToken")
            or body.get("result", {}).get("token")
        )
        if not token:
            raise RuntimeError("Login succeeded but no access token returned")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        print("[INFO] Login success")

    def _fetch_raw_rows(self) -> List[Tuple[int, Dict[str, Any]]]:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, url, raw_json FROM raw_products ORDER BY id ASC")
                rows = cur.fetchall()
        parsed: List[Tuple[int, Dict[str, Any]]] = []
        for row_id, source_url, raw_json in rows:
            if isinstance(raw_json, str):
                raw_json = json.loads(raw_json)
            if isinstance(raw_json, dict) and source_url:
                raw_json["__source_url"] = source_url
            parsed.append((row_id, raw_json))
        return parsed

    def _load_existing_categories(self) -> None:
        self.category_cache = {}
        self.category_by_name = {}
        self.category_by_path_slug = {}
        self.category_by_context_slug = {}
        self.category_by_context_name = {}
        response = self.session.get(f"{ADMIN_URL}/categories/all", timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        body = self._json(response)
        categories = self._extract_list(body)
        for cat in categories:
            cat_id = cat.get("id")
            if not cat_id:
                continue
            slug = self._parse_category_slug(cat.get("slug"))
            path_slug = self._parse_category_path_slug(cat.get("slug"))
            name = self._to_text(cat.get("name"))
            level = self._to_int(cat.get("level"), default=1)
            parent_name = self._normalize_lookup_key(cat.get("parentName"))
            if slug:
                self.category_cache[slug] = cat_id
                self.category_by_context_slug[(slug, level, parent_name)] = cat_id
            if path_slug:
                self.category_by_path_slug[path_slug] = cat_id
            if name:
                name_key = self._normalize_lookup_key(name)
                self.category_by_name[name_key] = cat_id
                self.category_by_context_name[(name_key, level, parent_name)] = cat_id
        print(f"[INFO] Loaded category cache: {len(self.category_cache)}")

    def _load_existing_product_slugs(self) -> None:
        page = 1
        total_pages = 1
        while page <= total_pages:
            response = self.session.get(
                f"{ADMIN_URL}/products/list",
                params={"page": page, "size": 200},
                timeout=REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            body = self._json(response)
            payload = body.get("data") if isinstance(body.get("data"), dict) else body
            products = payload.get("products") or payload.get("data", {}).get("products") or []
            pagination = payload.get("pagination") or payload.get("data", {}).get("pagination") or {}
            total_pages = int(pagination.get("totalPages") or 1)
            for product in products:
                slug = (product.get("slug") or "").strip().lower()
                if slug:
                    self.existing_product_slugs.add(slug)
            page += 1
        print(f"[INFO] Loaded existing product slugs: {len(self.existing_product_slugs)}")

    def _normalize_category_nodes(self, raw: Dict[str, Any]) -> List[Dict[str, Any]]:
        nodes = raw.get("category") or raw.get("categories") or []
        normalized = []
        for node in nodes:
            if not isinstance(node, dict):
                continue
            slug = self._parse_category_slug(node.get("slug") or node.get("url") or node.get("link"))
            path_slug = self._parse_category_path_slug(node.get("slug") or node.get("url") or node.get("link"))
            name = self._to_text(node.get("name"))
            level = self._to_int(node.get("level"), default=1)
            parent_name = self._normalize_lookup_key(node.get("parentName"))
            if slug and name:
                normalized.append(
                    {
                        "slug": slug,
                        "path_slug": path_slug,
                        "name": name,
                        "level": level,
                        "parent_name": parent_name,
                    }
                )
        normalized.sort(key=lambda x: x.get("level", 1))
        return normalized

    def _ensure_category_chain(self, raw: Dict[str, Any]) -> Optional[str]:
        nodes = self._normalize_category_nodes(raw)
        if not nodes:
            return None
        parent_id = None
        parent_name_key = ""
        for node in nodes:
            slug = node["slug"]
            path_slug = node.get("path_slug")
            node_level = self._to_int(node.get("level"), default=1)
            node_parent_name = node.get("parent_name") or parent_name_key
            matched_id = self._match_existing_category_id(
                slug=slug,
                path_slug=path_slug,
                name=node["name"],
                level=node_level,
                parent_name=node_parent_name,
            )
            if matched_id:
                parent_id = matched_id
                parent_name_key = self._normalize_lookup_key(node["name"])
                if self.log_category_steps:
                    print(f"[CAT] REUSE slug={slug} name={node['name']}")
                self.counters.category_reused += 1
                continue
            payload = {
                "name": node["name"],
                "slug": path_slug or slug,
                "parentId": parent_id,
                "level": node_level,
                "isActive": True,
            }
            if self.log_category_steps:
                print(f"[CAT] CREATE TRY slug={slug} name={node['name']} parentId={parent_id}")
            if self.dry_run:
                fake_id = f"dry-{slug}"
                parent_id = fake_id
                self._cache_category(
                    slug=slug,
                    path_slug=path_slug,
                    name=node["name"],
                    level=node_level,
                    parent_name=node_parent_name,
                    category_id=fake_id,
                )
                self.counters.category_created += 1
                continue
            created, is_duplicate = self._create_category_with_retry(payload)
            if not created:
                if is_duplicate:
                    if self.log_category_steps:
                        print(f"[CAT] SKIP DUPLICATE slug={slug} name={node['name']}")
                    continue
                if parent_id:
                    if self.log_category_steps:
                        print(f"[CAT] SKIP NODE slug={slug} name={node['name']} (create failed, likely duplicate)")
                    continue
                return None
            category_id = created.get("id")
            if not category_id:
                return None
            parent_id = category_id
            parent_name_key = self._normalize_lookup_key(node["name"])
            self._cache_category(
                slug=slug,
                path_slug=path_slug,
                name=node["name"],
                level=node_level,
                parent_name=node_parent_name,
                category_id=category_id,
            )
            if self.log_category_steps:
                print(f"[CAT] CREATED slug={slug} name={node['name']} id={category_id}")
            self.counters.category_created += 1
        return parent_id

    def _cache_category(
        self,
        slug: str,
        path_slug: Optional[str],
        name: str,
        level: int,
        parent_name: str,
        category_id: str,
    ) -> None:
        self.category_cache[slug] = category_id
        name_key = self._normalize_lookup_key(name)
        if name_key:
            self.category_by_name[name_key] = category_id
        if path_slug:
            self.category_by_path_slug[path_slug] = category_id
        self.category_by_context_slug[(slug, level, parent_name)] = category_id
        if name_key:
            self.category_by_context_name[(name_key, level, parent_name)] = category_id

    def _match_existing_category_id(
        self,
        slug: str,
        path_slug: Optional[str],
        name: str,
        level: int,
        parent_name: str,
    ) -> Optional[str]:
        # Requested simple strategy: name-only key first.
        name_key = self._normalize_lookup_key(name)
        if name_key in self.category_by_name:
            return self.category_by_name[name_key]

        # Primary keying rule: name + level + parent_name.
        if (name_key, level, parent_name) in self.category_by_context_name:
            return self.category_by_context_name[(name_key, level, parent_name)]
        # Root-level fallback by name without parent.
        if level == 1 and (name_key, level, "") in self.category_by_context_name:
            return self.category_by_context_name[(name_key, level, "")]

        # Slug-based matching stays as fallback only.
        if (slug, level, parent_name) in self.category_by_context_slug:
            return self.category_by_context_slug[(slug, level, parent_name)]
        if path_slug and path_slug in self.category_by_path_slug:
            return self.category_by_path_slug[path_slug]

        candidates: List[str] = []

        def add_candidate(value: Optional[str]) -> None:
            text = str(value or "").strip().lower().strip("/")
            if text and text not in candidates:
                candidates.append(text)

        add_candidate(slug)
        add_candidate(slug.replace("-and-", "-"))

        name_slug = self._slugify_lookup(name)
        add_candidate(name_slug)

        for candidate in candidates:
            if (candidate, level, parent_name) in self.category_by_context_slug:
                return self.category_by_context_slug[(candidate, level, parent_name)]
            if candidate in self.category_cache and level == 1:
                return self.category_cache[candidate]
        return None

    def _create_category_with_retry(
        self, payload: Dict[str, Any], retries: int = 3
    ) -> Tuple[Optional[Dict[str, Any]], bool]:
        for attempt in range(1, retries + 1):
            try:
                response = self.session.post(
                    f"{ADMIN_URL}/categories/create-with-slug",
                    json=payload,
                    timeout=REQUEST_TIMEOUT,
                )
                if response.status_code in (200, 201):
                    return self._extract_obj(self._json(response)), False
                # Duplicate/conflict type errors should not be retried blindly.
                if response.status_code in (400, 409):
                    return None, True
            except requests.RequestException:
                pass
            time.sleep(0.5 * attempt)
        return None, False

    def _map_variants(self, raw: Dict[str, Any]) -> List[Dict[str, Any]]:
        prices = raw.get("prices") or []
        variants = []
        for price_row in prices:
            if not isinstance(price_row, dict):
                continue
            sale_price = self._to_float(price_row.get("price"))
            if sale_price <= 0:
                continue
            unit_type = self._to_text(price_row.get("measureUnitName") or price_row.get("measureUnitCode"))
            if not unit_type:
                continue
            level = self._to_int(price_row.get("level"), default=999)
            specification = self._to_text(price_row.get("productSpecs")) or self._to_text(raw.get("specification"))
            variants.append(
                {
                    "unitType": unit_type,
                    "specification": specification,
                    "salePrice": sale_price,
                    "discountPercent": 0,
                    "isDefault": False,
                    "isActive": True,
                    "_level": level,
                }
            )

        deduped: List[Dict[str, Any]] = []
        seen = set()
        for variant in variants:
            key = (variant["unitType"], variant.get("specification") or "", variant["salePrice"])
            if key in seen:
                continue
            seen.add(key)
            deduped.append(variant)

        if not deduped:
            return []

        default_index = next((i for i, v in enumerate(deduped) if v.get("_level") == 1), 0)
        for i, variant in enumerate(deduped):
            variant["isDefault"] = i == default_index
            variant.pop("_level", None)
        return deduped

    def _map_ingredients(self, raw: Dict[str, Any]) -> List[Dict[str, Any]]:
        ingredients = raw.get("ingredient") or []
        mapped = []
        for ingredient in ingredients:
            if not isinstance(ingredient, dict):
                continue
            name = self._to_text(ingredient.get("name"))
            short_desc = self._to_text(ingredient.get("shortDescription") or ingredient.get("description"))
            if not name:
                continue
            row = {"name": name, "shortDescription": short_desc}
            ingredient_id = self._to_int(ingredient.get("ingredientId"), default=0)
            if ingredient_id > 0:
                row["ingredientId"] = ingredient_id
            mapped.append(row)
        return mapped

    def _map_product_payload(self, row_id: int, raw: Dict[str, Any], leaf_category_id: str) -> Optional[Dict[str, Any]]:
        slug = self._parse_product_slug(
            raw.get("slug") or raw.get("url") or raw.get("link") or raw.get("__source_url")
        )
        if not slug:
            self.counters.invalid_slug += 1
            self.counters.product_failed += 1
            self._record_error(row_id, "slug", "invalid slug after parsing")
            return None

        variants = self._map_variants(raw)
        if not variants:
            self.counters.no_variant += 1
            self.counters.product_failed += 1
            self._record_error(row_id, slug, "no valid variants from prices")
            return None

        primary_image = self._to_text(raw.get("primaryImage") or raw.get("image"))
        secondary_images = self._to_text_list(raw.get("secondaryImages") or raw.get("images"))
        if not primary_image and secondary_images:
            primary_image = secondary_images[0]
            secondary_images = secondary_images[1:]

        name = self._to_text(raw.get("name") or raw.get("officialProductName"))
        if not name:
            self.counters.product_failed += 1
            self._record_error(row_id, slug, "missing product name")
            return None

        description = self._to_rich_text(raw.get("description"))
        if not description:
            description = self._to_rich_text(raw.get("short_description") or raw.get("shortDescription"))

        payload = {
            "name": name,
            "webName": self._to_text(raw.get("webName") or raw.get("officialProductName") or name),
            "slug": slug,
            "primaryImage": primary_image,
            "secondaryImages": secondary_images,
            "brand": self._to_text(raw.get("brand")),
            "brandOrigin": self._to_text(raw.get("brandOrigin")),
            "producer": self._to_text(raw.get("producer") or raw.get("manufactor")),
            "description": description,
            "careful": self._to_rich_text(raw.get("careful") or raw.get("warning")),
            "adverseEffect": self._to_rich_text(raw.get("adverseEffect")),
            "preservation": self._to_rich_text(raw.get("preservation")),
            "usage": self._to_rich_text(raw.get("usage") or raw.get("guideline")),
            "dosage": self._to_rich_text(raw.get("dosage")),
            "ingredient": self._map_ingredients(raw),
            "variants": variants,
            "categoryIds": [leaf_category_id],
        }

        return payload

    def _submit_batch(self, batch: List[Tuple[int, Dict[str, Any]]]) -> None:
        payload = [item[1] for item in batch]
        slugs = [item[1]["slug"] for item in batch]

        if self.dry_run:
            print(f"[DRY-RUN] Batch size={len(payload)} sampleSlug={slugs[0] if slugs else 'n/a'}")
            self.counters.product_created += len(payload)
            self.existing_product_slugs.update(slugs)
            return

        try:
            response = self.session.post(
                f"{ADMIN_URL}/products/create-batch",
                json=payload,
                timeout=REQUEST_TIMEOUT,
            )
            if response.status_code in (200, 201):
                self.counters.product_created += len(payload)
                self.existing_product_slugs.update(slugs)
                print(f"[INFO] Created batch: {len(payload)}")
                return
            self.counters.product_failed += len(payload)
            self._record_error(batch[0][0], "batch", f"status={response.status_code} body={response.text[:250]}")
        except requests.RequestException as exc:
            self.counters.product_failed += len(payload)
            self._record_error(batch[0][0], "batch", f"request error: {exc}")

    @staticmethod
    def _json(response: requests.Response) -> Dict[str, Any]:
        return response.json() if response.text else {}

    @staticmethod
    def _extract_obj(body: Dict[str, Any]) -> Dict[str, Any]:
        if isinstance(body.get("data"), dict):
            return body["data"]
        if isinstance(body.get("result"), dict):
            return body["result"]
        return body

    @staticmethod
    def _extract_list(body: Dict[str, Any]) -> List[Dict[str, Any]]:
        if isinstance(body, list):
            return body
        if isinstance(body.get("data"), list):
            return body["data"]
        if isinstance(body.get("result"), list):
            return body["result"]
        if isinstance(body.get("data"), dict) and isinstance(body["data"].get("categories"), list):
            return body["data"]["categories"]
        if isinstance(body.get("categories"), list):
            return body["categories"]
        return []

    @staticmethod
    def _parse_slug(value: Any) -> Optional[str]:
        text = str(value or "").strip()
        if not text:
            return None
        text = text.split("?", 1)[0].split("#", 1)[0]
        text = text.rsplit("/", 1)[-1].strip()
        if text.lower().endswith(".html"):
            text = text[:-5]
        text = text.strip().lower()
        text = re.sub(r"[^a-z0-9-]", "-", text)
        text = re.sub(r"-+", "-", text).strip("-")
        return text or None

    @staticmethod
    def _parse_category_slug(value: Any) -> Optional[str]:
        text = str(value or "").strip()
        if not text:
            return None
        text = text.split("?", 1)[0].split("#", 1)[0]
        text = text.replace("\\", "/").strip("/")
        if not text:
            return None
        parts = [part.strip().lower() for part in text.split("/") if part.strip()]
        if not parts:
            return None
        return "/".join(parts)

    @staticmethod
    def _parse_category_path_slug(value: Any) -> Optional[str]:
        text = str(value or "").strip()
        if not text:
            return None
        text = text.split("?", 1)[0].split("#", 1)[0]
        text = text.replace("\\", "/").strip("/")
        if not text:
            return None
        parts = [part.strip().lower() for part in text.split("/") if part.strip()]
        if not parts:
            return None
        return "/".join(parts)

    @staticmethod
    def _slugify_lookup(value: Any) -> str:
        text = str(value or "").strip().lower()
        if not text:
            return ""
        text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
        text = text.replace("&", " ")
        text = re.sub(r"[^a-z0-9]+", "-", text)
        text = re.sub(r"-+", "-", text).strip("-")
        return text

    @staticmethod
    def _normalize_lookup_key(value: Any) -> str:
        text = str(value or "").strip().lower()
        if not text:
            return ""
        text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
        text = re.sub(r"\s+", " ", text).strip()
        return text

    @staticmethod
    def _parse_product_slug(value: Any) -> Optional[str]:
        text = str(value or "").strip()
        if not text:
            return None
        text = text.split("?", 1)[0].split("#", 1)[0].strip()
        parts = [part.strip() for part in text.replace("\\", "/").split("/") if part.strip()]
        if not parts:
            return None
        text = parts[-1]
        if text.lower().endswith(".html"):
            text = text[:-5]
        return text.strip() or None

    @staticmethod
    def _to_text(value: Any) -> str:
        if value is None:
            return ""
        if isinstance(value, (list, tuple, set)):
            return " ".join(str(item).strip() for item in value if str(item).strip())
        return str(value).strip()

    @staticmethod
    def _to_text_list(value: Any) -> List[str]:
        if not isinstance(value, list):
            return []
        result: List[str] = []
        for item in value:
            if isinstance(item, dict):
                url = str(item.get("url") or "").strip()
                if url:
                    result.append(url)
            else:
                text = str(item).strip()
                if text:
                    result.append(text)
        return result

    @staticmethod
    def _to_rich_text(value: Any) -> str:
        if value is None:
            return ""
        if isinstance(value, str):
            return value.strip()
        if isinstance(value, list):
            lines = [str(item).strip() for item in value if str(item).strip()]
            return "<br/>".join(lines)
        return str(value).strip()

    @staticmethod
    def _to_int(value: Any, default: int = 0) -> int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _to_float(value: Any) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return 0.0

    def _record_error(self, row_id: int, key: str, reason: str) -> None:
        self.counters.errors.append(f"row={row_id} key={key} reason={reason}")

    def _print_summary(self, start: datetime) -> None:
        end = datetime.now()
        print("\n" + "=" * 40)
        print("Import completed")
        print(f"Start: {start}")
        print(f"End:   {end}")
        print(f"Duration: {end - start}")
        print(f"Rows scanned: {self.counters.scanned}")
        print(f"Categories created/reused: {self.counters.category_created}/{self.counters.category_reused}")
        print(f"Products created/skipped/failed: {self.counters.product_created}/{self.counters.product_skipped}/{self.counters.product_failed}")
        print(f"Invalid slug: {self.counters.invalid_slug}")
        print(f"No category: {self.counters.no_category}")
        print(f"No variant: {self.counters.no_variant}")
        if self.counters.errors:
            print("Sample errors:")
            for line in self.counters.errors[:10]:
                print(f"- {line}")
        print("=" * 40)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import raw_products into admin APIs")
    parser.add_argument("--dry-run", action="store_true", help="Map and validate without posting products/categories")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of raw rows for trial runs")
    parser.add_argument(
        "--sync-categories-only",
        action="store_true",
        help="Only sync/reconcile categories from raw_products, skip product creation",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    importer = Importer(dry_run=args.dry_run, limit=args.limit)
    if args.sync_categories_only:
        importer.run_sync_categories_only()
    else:
        importer.run()


if __name__ == "__main__":
    main()
