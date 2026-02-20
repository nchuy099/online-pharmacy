from __future__ import annotations

import os
from typing import Any

from google import genai
from google.genai.types import GenerateContentConfig, HttpOptions


DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite"


def _env(name: str, fallback: str = "") -> str:
    return (os.getenv(name) or fallback).strip()


def render_prompt(template: str, values: dict[str, Any]) -> str:
    rendered = template
    for key, value in values.items():
        rendered = rendered.replace("{" + key + "}", str(value))
    return rendered


def _build_client() -> genai.Client:
    api_key = _env("GOOGLE_CLOUD_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_CLOUD_API_KEY is required for Google Cloud Gemini client")
    return genai.Client(
        api_key=api_key,
        vertexai=True,
        http_options=HttpOptions(api_version="v1"),
    )


def _extract_text(response: Any) -> str:
    text = getattr(response, "text", None)
    if text is not None:
        return str(text).strip()

    candidates = getattr(response, "candidates", None) or []
    parts: list[str] = []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", None) or []:
            part_text = getattr(part, "text", None)
            if part_text:
                parts.append(str(part_text))
    return "\n".join(parts).strip()


async def generate_gemini_text(
    model: str,
    system_instruction: str,
    prompt: str,
    temperature: float = 0.0,
) -> str:
    client = _build_client()
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
        ),
    )
    return _extract_text(response)
