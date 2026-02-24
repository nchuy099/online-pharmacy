from __future__ import annotations

from app.chatbot.application.postprocess import build_context
from app.chatbot.domain.references import build_product_references
from app.chatbot.domain.state import ChatState


def test_build_product_references_deduplicates_and_builds_urls():
    docs = [
        {"slug": "paracetamol-500", "name": "Paracetamol 500"},
        {"slug": "paracetamol-500", "name": "Paracetamol duplicate"},
        {"code": "ABC123", "name": "Theo mã"},
        {"name": "Missing url"},
    ]

    refs = build_product_references(docs, web_base_url="https://shop.example.com")

    assert len(refs) == 2
    assert refs[0]["url"] == "https://shop.example.com/paracetamol-500"
    assert refs[0]["source"] == "paracetamol-500"
    assert refs[1]["url"] == "https://shop.example.com/products?code=ABC123"


def test_build_context_uses_customer_frontend_base_url(monkeypatch):
    monkeypatch.setenv("FE_CUSTOMER_URL", "https://customer.example.com")

    state = ChatState(
        conversation_id="conv-1",
        message="Xin chao",
        context_docs=[
            {"slug": "paracetamol-500", "name": "Paracetamol 500"},
            {"code": "ABC123", "name": "Theo mã"},
        ],
    )

    build_context(state)

    assert "REFERENCE_CANDIDATES:" in state.knowledge_context
    assert "https://customer.example.com/paracetamol-500" in state.knowledge_context
    assert "https://customer.example.com/products?code=ABC123" in state.knowledge_context
