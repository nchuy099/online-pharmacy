import type { FlashSaleCampaignDTO } from "../types";
import { getCampaignDisplayLabel, getCampaignMetaLabel } from "../utils";

interface FlashSaleCampaignNavProps {
    campaigns: FlashSaleCampaignDTO[];
    activeCampaignId: string | null;
    onSelect: (campaignId: string) => void;
}

export const FlashSaleCampaignNav = ({ campaigns, activeCampaignId, onSelect }: FlashSaleCampaignNavProps) => {
    if (campaigns.length === 0) {
        return null;
    }

    return (
        <div className="flex gap-3 overflow-x-auto pb-2">
            {campaigns.map((campaign) => {
                const active = campaign.id === activeCampaignId;

                return (
                    <button
                        key={campaign.id}
                        type="button"
                        onClick={() => onSelect(campaign.id)}
                        className={`min-w-[220px] rounded-2xl border px-4 py-3 text-left transition-all ${
                            active
                                ? "border-rose-200 bg-rose-50 shadow-sm shadow-rose-500/10"
                                : "border-slate-200 bg-white hover:border-rose-100 hover:bg-rose-50/40"
                        }`}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <p className={`line-clamp-2 text-sm font-black ${active ? "text-rose-700" : "text-slate-900"}`}>
                                {getCampaignDisplayLabel(campaign)}
                            </p>
                            <span
                                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                                    campaign.type === "BIG_EVENT"
                                        ? "bg-[#001737] text-amber-200"
                                        : "bg-slate-100 text-slate-500"
                                }`}
                            >
                                {campaign.type === "BIG_EVENT" ? "Big event" : "Normal"}
                            </span>
                        </div>
                        {campaign.type === "BIG_EVENT" && (
                            <p className="mt-2 text-xs font-bold text-slate-500">{getCampaignMetaLabel(campaign)}</p>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
