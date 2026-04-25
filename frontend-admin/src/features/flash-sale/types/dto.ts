export type FlashSaleCampaignType = "NORMAL" | "BIG_EVENT";
export type FlashSaleSlotCode = "MORNING_09_11" | "NOON_11_13" | "AFTERNOON_14_16" | "EVENING_19_21";

export interface FlashSaleCampaignItemDTO {
    id: string;
    campaignId: string;
    campaignCode: string;
    campaignName: string;
    variantId: string;
    variantSku: string;
    variantUnitType: string;
    variantSpecification?: string | null;
    productId: string;
    productName: string;
    productSlug: string;
    productImage?: string | null;
    flashPrice: number;
    originalPrice: number;
    saleStock: number;
    remainingStock: number;
    perUserLimit: number;
    startAt: string;
    endAt: string;
    status: string;
}

export interface FlashSaleCampaignDTO {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    type: FlashSaleCampaignType;
    coverImage?: string | null;
    campaignDate: string;
    slotCode: FlashSaleSlotCode;
    slotLabel?: string | null;
    startAt: string;
    endAt: string;
    status: string;
    items: FlashSaleCampaignItemDTO[];
}

export interface FlashSaleCampaignPageDTO {
    content?: FlashSaleCampaignDTO[];
    totalPages?: number;
    totalElements?: number;
    number?: number;
    size?: number;
}

export interface CreateFlashSaleCampaignItemDTO {
    variantId: string;
    flashPrice: number;
    saleStock: number;
    perUserLimit: number;
}

export interface CreateFlashSaleCampaignDTO {
    name: string;
    description?: string;
    type: FlashSaleCampaignType;
    coverImage?: string;
    campaignDate: string;
    slotCode: FlashSaleSlotCode;
    items: CreateFlashSaleCampaignItemDTO[];
}

export interface UpdateFlashSaleCampaignDTO {
    name?: string;
    description?: string;
    type?: FlashSaleCampaignType;
    coverImage?: string;
    campaignDate?: string;
    slotCode?: FlashSaleSlotCode;
}

export interface GenerateRandomFlashSaleCampaignDTO {
    name?: string;
    description?: string;
    type?: FlashSaleCampaignType;
    coverImage?: string;
    itemCount?: number;
    saleStockPerItem?: number;
    perUserLimit?: number;
    discountPercent?: number;
}
