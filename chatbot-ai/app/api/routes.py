import logging

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.chatbot.application.chat_flow import handle_chat
from app.chatbot.application.metadata import generate_chat_metadata
from app.chatbot.domain.state import ChatState
from app.api.schemas import ChatMetadataRequest, ChatMetadataResponse, ChatRequest, ChatResponse
from app.security.internal_auth import (
    InternalAuthError,
    decode_and_verify_internal_jwt,
    extract_bearer_token,
)

router = APIRouter()
logger = logging.getLogger(__name__)

async def require_internal_auth(authorization: str | None = Header(default=None)) -> dict:
    try:
        token = extract_bearer_token(authorization)
        return decode_and_verify_internal_jwt(token)
    except InternalAuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, _: dict = Depends(require_internal_auth)):
    logger.info(
        "[chatbot-ai][api] /chat request conversation_id=%s message_len=%d",
        request.conversation_id,
        len(request.message or ""),
    )
    try:
        state = await handle_chat(
            conversation_id=request.conversation_id,
            message=request.message,
            user_context=request.user_context,
            conversation_context=request.conversation_context,
        )
    except ValueError as exc:
        logger.warning(
            "[chatbot-ai][api] /chat validation_error conversation_id=%s error=%s",
            request.conversation_id,
            str(exc),
        )
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    logger.info(
        "[chatbot-ai][api] /chat response conversation_id=%s intent=%s sources=%d",
        request.conversation_id,
        state.resolved_intent,
        len(state.sources),
    )
    return ChatResponse(
        reply=state.reply,
        intent=state.resolved_intent,
        sources=state.sources,
    )


@router.post("/chat/metadata", response_model=ChatMetadataResponse)
async def chat_metadata_endpoint(
    request: ChatMetadataRequest,
    _: dict = Depends(require_internal_auth),
):
    logger.info(
        "[chatbot-ai][api] /chat/metadata request conversation_id=%s",
        request.conversation_id,
    )
    state = ChatState(
        conversation_id=request.conversation_id,
        message=request.user_message or "",
        user_context=request.user_context,
        conversation_context=request.conversation_context,
    )
    metadata = await generate_chat_metadata(state, request.assistant_reply or "")
    return ChatMetadataResponse(title=metadata.title, summary=metadata.summary)
