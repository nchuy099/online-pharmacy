from typing import List, Optional

from fastapi import APIRouter, Depends, Query

from app.domain.models import RecResponse
from app.use_cases.get_recommendations import get_recommendations
from app.use_cases.get_trending import get_trending
from app.security.internal_auth import require_internal_request

router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendation"],
    dependencies=[Depends(require_internal_request)],
)


@router.get("", response_model=List[RecResponse])
@router.get("/", response_model=List[RecResponse], include_in_schema=False)
async def recommendations_endpoint(
    user_id: Optional[str] = None,
    current_item_id: Optional[str] = None,
    top_k: int = Query(10, ge=1, le=50),
):
    return get_recommendations(user_id=user_id, current_item_id=current_item_id, top_k=top_k)


@router.get("/trending", response_model=List[RecResponse])
async def trending_endpoint(top_k: int = Query(10, ge=1, le=50)):
    return get_trending(top_k=top_k)
