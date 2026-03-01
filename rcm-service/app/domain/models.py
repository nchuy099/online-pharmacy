from typing import List, Optional

from pydantic import BaseModel, Field


class RecProductVariant(BaseModel):
    id: str
    sale_price: float
    is_default: bool
    is_active: bool
    available_quantity: Optional[int] = None


class RecProduct(BaseModel):
    id: str
    slug: str
    name: str
    web_name: Optional[str] = None
    primary_image: Optional[str] = None
    average_rating: float = 0.0
    total_reviews: int = 0
    variants: List[RecProductVariant] = Field(default_factory=list)


class RecResponse(BaseModel):
    product_id: str
    score: float
    source: str
    product: Optional[RecProduct] = None
