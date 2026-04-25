import type { FlashSaleCampaignDTO, FlashSaleItemDTO } from "./types";

export const getCampaignDisplayLabel = (campaign: FlashSaleCampaignDTO) => {
    if (campaign.type === "BIG_EVENT") {
        return campaign.name;
    }
    return [campaign.campaignDate, campaign.slotLabel || campaign.slotCode].filter(Boolean).join(" • ");
};

export const getCampaignMetaLabel = (campaign: FlashSaleCampaignDTO) =>
    [campaign.campaignDate, campaign.slotLabel || campaign.slotCode].filter(Boolean).join(" • ");

const getCampaignActivityPriority = (campaign: FlashSaleCampaignDTO) => {
    if (campaign.status === "ACTIVE") {
        return 0;
    }

    if (campaign.status === "SCHEDULED") {
        return 1;
    }

    const now = Date.now();
    const startAt = new Date(campaign.startAt).getTime();
    const endAt = new Date(campaign.endAt).getTime();

    if (Number.isFinite(startAt) && Number.isFinite(endAt) && now >= startAt && now <= endAt) {
        return 0;
    }

    if (Number.isFinite(startAt) && now < startAt) {
        return 1;
    }

    return 2;
};

export const sortCampaignsForCustomer = (campaigns: FlashSaleCampaignDTO[]) =>
    [...campaigns].sort((left, right) => {
        const leftActivity = getCampaignActivityPriority(left);
        const rightActivity = getCampaignActivityPriority(right);
        const activityOrder = leftActivity - rightActivity;
        if (activityOrder !== 0) {
            return activityOrder;
        }

        if (leftActivity !== 0 && left.type !== right.type) {
            return left.type === "BIG_EVENT" ? -1 : 1;
        }

        return new Date(left.startAt).getTime() - new Date(right.startAt).getTime();
    });

export const getCampaignStatusLabel = (campaign: FlashSaleCampaignDTO) => {
    const now = Date.now();
    const startAt = new Date(campaign.startAt).getTime();
    const endAt = new Date(campaign.endAt).getTime();

    if (Number.isFinite(startAt) && now < startAt) {
        return {
            label: "Sắp mở",
            tone: "text-amber-700 bg-amber-50 border-amber-100",
        };
    }

    if (Number.isFinite(endAt) && now > endAt) {
        return {
            label: "Đã kết thúc",
            tone: "text-slate-500 bg-slate-50 border-slate-200",
        };
    }

    return {
        label: "Đang bán",
        tone: "text-rose-700 bg-rose-50 border-rose-100",
    };
};

export const getFlashSaleProgress = (item: FlashSaleItemDTO) => {
    const sold = Math.max(0, item.saleStock - item.remainingStock);
    const progress = item.saleStock > 0 ? Math.min(100, Math.round((sold / item.saleStock) * 100)) : 0;
    return { sold, progress };
};

export const getVariantLabel = (item: FlashSaleItemDTO) =>
    [item.variantUnitType, item.variantSpecification].filter(Boolean).join(" • ");
