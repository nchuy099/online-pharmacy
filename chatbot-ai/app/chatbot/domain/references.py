from __future__ import annotations

from typing import Any


def _normalize_base_url(web_base_url: str) -> str:
    return web_base_url.rstrip("/") if web_base_url else ""


def _build_product_url(doc: dict[str, Any], web_base_url: str) -> str | None:
    base = _normalize_base_url(web_base_url)
    slug = doc.get("slug")
    code = doc.get("code")

    if slug:
        slug_str = str(slug).lstrip("/")
        if base:
            return f"{base}/{slug_str}"
        return f"/{slug_str}"

    if code:
        code_str = str(code)
        if base:
            return f"{base}/products?code={code_str}"
        return f"/products?code={code_str}"

    return None


def build_product_references(
    context_docs: list[dict[str, Any]],
    web_base_url: str = "",
) -> list[dict[str, str]]:
    refs: list[dict[str, str]] = []
    seen: set[str] = set()

    for doc in context_docs:
        if not isinstance(doc, dict):
            continue

        url = _build_product_url(doc, web_base_url=web_base_url)
        if not url or url in seen:
            continue

        name = str(doc.get("name") or doc.get("title") or doc.get("slug") or doc.get("code") or "Sản phẩm")
        source = str(doc.get("slug") or doc.get("code") or url)

        refs.append(
            {
                "name": name,
                "url": url,
                "source": source,
            }
        )
        seen.add(url)

    return refs


def resolve_intent_with_session(
    predicted_intent: str,
    message: str,
) -> str:
    return predicted_intent
