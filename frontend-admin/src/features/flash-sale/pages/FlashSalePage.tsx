import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowsRotate, FaBan, FaBolt, FaCalendarDays, FaPlay, FaPlus } from "react-icons/fa6";
import { ConfirmDialog, PageHeader } from "../../../shared/components";
import flashSaleApi from "../api";
import type { FlashSaleCampaignDTO, GenerateRandomFlashSaleCampaignDTO } from "../types/dto";
import { resolveApiErrorMessage } from "../../../shared/services/apiError";
import toast from "react-hot-toast";

const FlashSalePage: React.FC = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = React.useState<FlashSaleCampaignDTO[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [confirmAction, setConfirmAction] = React.useState<null | { type: "publish" | "cancel"; campaignId: string }>(null);

    const loadCampaigns = React.useCallback(async () => {
        setLoading(true);
        try {
            const campaignRes = await flashSaleApi.list(1, 50);
            setCampaigns(campaignRes.data?.content || []);
        } catch (error) {
            toast.error(resolveApiErrorMessage(error, "Không thể tải danh sách flash sale"));
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void loadCampaigns();
    }, [loadCampaigns]);

    const handleRandomDraft = async () => {
        try {
            const payload: GenerateRandomFlashSaleCampaignDTO = {
                itemCount: 10,
            };
            const res = await flashSaleApi.randomDraft(payload);
            toast.success("Đã tạo campaign ngẫu nhiên");
            if (res.data?.id) {
                navigate(`/flash-sales/${res.data.id}`);
            } else {
                await loadCampaigns();
            }
        } catch (error) {
            toast.error(resolveApiErrorMessage(error, "Không thể tạo campaign ngẫu nhiên"));
        }
    };

    const handleAction = async () => {
        if (!confirmAction) return;
        try {
            if (confirmAction.type === "publish") {
                await flashSaleApi.publish(confirmAction.campaignId);
                toast.success("Đã publish campaign");
            } else {
                await flashSaleApi.cancel(confirmAction.campaignId);
                toast.success("Đã hủy campaign");
            }
            await loadCampaigns();
        } catch (error) {
            toast.error(resolveApiErrorMessage(error, "Không thể thực hiện thao tác flash sale"));
        } finally {
            setConfirmAction(null);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Flash sale"
                description="Danh sách campaign flash sale, xem chi tiết và tạo campaign mới"
                actionLabel={<span className="inline-flex items-center gap-2"><FaPlus className="text-sm" /> Tạo campaign</span>}
                onAction={() => navigate("/flash-sales/new")}
                actionClassName="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                secondaryActionLabel={<span className="inline-flex items-center gap-2"><FaArrowsRotate className="text-sm" /> Random campaign</span>}
                onSecondaryAction={() => { void handleRandomDraft(); }}
                secondaryActionClassName="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
            />

            {loading ? (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-500 shadow-sm">Đang tải campaign...</div>
            ) : campaigns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                    Chưa có campaign flash sale nào.
                </div>
            ) : (
                <section className="space-y-4">
                    {campaigns.map((campaign) => {
                        const isDraft = campaign.status === "DRAFT";
                        return (
                            <article key={campaign.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-black text-slate-900">{campaign.name}</h2>
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                                                {campaign.type === "BIG_EVENT" ? "Big Event" : "Normal"}
                                            </span>
                                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                                {campaign.status}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-500">{campaign.description || "Không có mô tả"}</p>
                                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
                                            <span className="inline-flex items-center gap-2"><FaCalendarDays className="text-emerald-500" /> {campaign.campaignDate}</span>
                                            <span>{campaign.slotLabel || campaign.slotCode}</span>
                                            <span>{campaign.items.length} item</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => navigate(`/flash-sales/${campaign.id}`)}
                                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                                        >
                                            Xem chi tiết
                                        </button>
                                        {isDraft && (
                                            <button
                                                onClick={() => setConfirmAction({ type: "publish", campaignId: campaign.id })}
                                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700"
                                            >
                                                <FaPlay className="h-3.5 w-3.5" /> Publish
                                            </button>
                                        )}
                                        {campaign.status !== "CANCELLED" && (
                                            <button
                                                onClick={() => setConfirmAction({ type: "cancel", campaignId: campaign.id })}
                                                className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700"
                                            >
                                                <FaBan className="h-3.5 w-3.5" /> Hủy
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {campaign.type === "BIG_EVENT" && campaign.coverImage && (
                                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                                        <img src={campaign.coverImage} alt={campaign.name} className="h-40 w-full object-cover" />
                                    </div>
                                )}

                                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {campaign.items.slice(0, 3).map((item) => (
                                        <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 overflow-hidden rounded-xl bg-white">
                                                    {item.productImage ? (
                                                        <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-[10px] font-black uppercase text-slate-400">
                                                            <FaBolt />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-black text-slate-900">{item.productName}</p>
                                                    <p className="text-xs text-slate-500">{[item.variantUnitType, item.variantSpecification].filter(Boolean).join(" · ")}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}

            <ConfirmDialog
                isOpen={Boolean(confirmAction)}
                title={confirmAction?.type === "publish" ? "Xác nhận publish" : "Xác nhận hủy"}
                message={confirmAction?.type === "publish" ? "Campaign sẽ được publish và khóa chỉnh sửa." : "Campaign sẽ bị hủy và hoàn kho flash sale."}
                confirmLabel={confirmAction?.type === "publish" ? "Publish" : "Hủy campaign"}
                cancelLabel="Đóng"
                isDangerous={confirmAction?.type === "cancel"}
                onCancel={() => setConfirmAction(null)}
                onConfirm={() => void handleAction()}
            />
        </div>
    );
};

export default FlashSalePage;
