import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaArrowUpRightFromSquare,
    FaCircleCheck,
    FaCircleXmark,
    FaCloudArrowUp,
    FaMagnifyingGlass,
    FaPlus,
    FaTrash,
    FaTriangleExclamation,
    FaXmark,
} from "react-icons/fa6";
import { PageHeader } from "../../../shared/components";
import productApi from "../../product/api";
import productService from "../../product/services";
import flashSaleApi from "../api";
import { useDebounce } from "../../../shared/hooks";
import { resolveApiErrorMessage } from "../../../shared/services/apiError";
import type {
    CreateFlashSaleCampaignDTO,
    CreateFlashSaleCampaignItemDTO,
    FlashSaleCampaignDTO,
    FlashSaleCampaignItemDTO,
    FlashSaleCampaignType,
    FlashSaleSlotCode,
    UpdateFlashSaleCampaignDTO,
} from "../types/dto";
import type { ProductListResponseDto } from "../../product/types/dto";
import toast from "react-hot-toast";

type ProductOption = {
    id: string;
    name: string;
    slug: string;
    primaryImage: string | null;
    variants: Array<{
        id: string;
        unitType: string;
        specification?: string | null;
        salePrice: number;
        quantityAvailable: number;
        isActive?: boolean;
    }>;
};

type ItemEditorState = CreateFlashSaleCampaignItemDTO;

const SLOT_OPTIONS: Array<{ value: FlashSaleSlotCode; label: string }> = [
    { value: "MORNING_09_11", label: "09:00 - 11:00" },
    { value: "NOON_11_13", label: "11:00 - 13:00" },
    { value: "AFTERNOON_14_16", label: "14:00 - 16:00" },
    { value: "EVENING_19_21", label: "19:00 - 21:00" },
];

const buildEmptyCampaignForm = (): CreateFlashSaleCampaignDTO => ({
    name: "",
    description: "",
    type: "NORMAL",
    coverImage: "",
    campaignDate: "",
    slotCode: "MORNING_09_11",
    items: [],
});

const buildItemEditor = (): ItemEditorState => ({
    variantId: "",
    flashPrice: 0,
    saleStock: 1,
    perUserLimit: 1,
});

const mapProductOption = (product: ProductListResponseDto): ProductOption => ({
    id: product.id,
    name: product.webName || product.name,
    slug: product.slug,
    primaryImage: product.primaryImage || null,
    variants: (product.variants || []).map((variant) => ({
        id: variant.id,
        unitType: variant.unitType || "Sản phẩm",
        specification: variant.specification || null,
        salePrice: Number(variant.salePrice || 0),
        quantityAvailable: Number(variant.quantityAvailable || 0),
        isActive: variant.isActive,
    })),
});

const formatVariantLabel = (unitType?: string, specification?: string | null) =>
    [unitType, specification].filter((value) => Boolean(value && value.trim())).join(" · ") || "Sản phẩm";

const FlashSaleEditorPage: React.FC = () => {
    const navigate = useNavigate();
    const { campaignId } = useParams();
    const isCreateMode = !campaignId;

    const [loading, setLoading] = React.useState(!isCreateMode);
    const [campaign, setCampaign] = React.useState<FlashSaleCampaignDTO | null>(null);
    const [form, setForm] = React.useState<CreateFlashSaleCampaignDTO>(buildEmptyCampaignForm());
    const [draftItems, setDraftItems] = React.useState<CreateFlashSaleCampaignItemDTO[]>([]);
    const [itemEditor, setItemEditor] = React.useState<ItemEditorState>(buildItemEditor());
    const [productSearch, setProductSearch] = React.useState("");
    const debouncedProductSearch = useDebounce(productSearch, 250);
    const [searchResults, setSearchResults] = React.useState<ProductOption[]>([]);
    const [selectedProduct, setSelectedProduct] = React.useState<ProductOption | null>(null);
    const [productLoading, setProductLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [uploadingCover, setUploadingCover] = React.useState(false);

    const readOnly = !isCreateMode && campaign?.status !== "DRAFT";
    const selectedVariant = selectedProduct?.variants.find((variant) => variant.id === itemEditor.variantId) || null;
    const redirectToList = React.useCallback(() => {
        window.location.assign("/flash-sales");
    }, []);

    const loadCampaign = React.useCallback(async () => {
        if (!campaignId) return;
        setLoading(true);
        try {
            const res = await flashSaleApi.get(campaignId);
            const next = res.data;
            if (!next) {
                throw new Error("Không tìm thấy campaign");
            }
            setCampaign(next);
            setForm({
                name: next.name,
                description: next.description || "",
                type: next.type,
                coverImage: next.coverImage || "",
                campaignDate: next.campaignDate,
                slotCode: next.slotCode,
                items: [],
            });
        } catch (error) {
            toast.error(resolveApiErrorMessage(error, "Không thể tải chi tiết flash sale"));
            navigate("/flash-sales");
        } finally {
            setLoading(false);
        }
    }, [campaignId, navigate]);

    React.useEffect(() => {
        if (!isCreateMode) {
            void loadCampaign();
        }
    }, [isCreateMode, loadCampaign]);

    React.useEffect(() => {
        const query = debouncedProductSearch.trim();
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        const load = async () => {
            setProductLoading(true);
            try {
                const res = await productApi.getList(1, 6, query);
                const products = res.data?.products || [];
                setSearchResults(products.map(mapProductOption));
            } catch (error) {
                setSearchResults([]);
                setErrorMessage(resolveApiErrorMessage(error, "Không thể tìm sản phẩm"));
            } finally {
                setProductLoading(false);
            }
        };
        void load();
    }, [debouncedProductSearch]);

    const validateCampaignForm = () => {
        if (!form.name.trim()) {
            throw new Error("Vui lòng nhập tên campaign");
        }
        if (!form.campaignDate) {
            throw new Error("Vui lòng chọn ngày chạy");
        }
        if (!form.slotCode) {
            throw new Error("Vui lòng chọn khung giờ");
        }
        if (form.type === "BIG_EVENT" && !form.coverImage?.trim()) {
            throw new Error("Big event phải có ảnh bìa");
        }
    };

    const validateItemEditor = () => {
        if (!selectedProduct || !selectedVariant) {
            throw new Error("Vui lòng chọn sản phẩm và variant hợp lệ");
        }
        if (selectedVariant.isActive === false || selectedVariant.quantityAvailable <= 0) {
            throw new Error("Variant đang hết hàng hoặc bị tắt bán");
        }
        if (itemEditor.flashPrice <= 0) {
            throw new Error("Giá flash sale phải lớn hơn 0");
        }
        if (itemEditor.flashPrice >= selectedVariant.salePrice) {
            throw new Error("Giá flash sale phải thấp hơn giá hiện tại");
        }
        if (itemEditor.saleStock <= 0 || itemEditor.saleStock > selectedVariant.quantityAvailable) {
            throw new Error("Số lượng sale không hợp lệ");
        }
        if (itemEditor.perUserLimit <= 0 || itemEditor.perUserLimit > itemEditor.saleStock) {
            throw new Error("Giới hạn mỗi user không hợp lệ");
        }
    };

    const handleCoverUpload = async (file?: File | null) => {
        if (!file) return;
        setUploadingCover(true);
        try {
            const url = await productService.uploadProductImage(file);
            setForm((prev) => ({ ...prev, coverImage: url }));
            toast.success("Đã upload ảnh bìa");
        } catch (error) {
            toast.error(resolveApiErrorMessage(error, "Không thể upload ảnh bìa"));
        } finally {
            setUploadingCover(false);
        }
    };

    const handleSubmitCampaign = async () => {
        setErrorMessage(null);
        try {
            validateCampaignForm();
            if (isCreateMode) {
                if (draftItems.length === 0) {
                    throw new Error("Campaign phải có ít nhất 1 sản phẩm");
                }
                const res = await flashSaleApi.create({ ...form, items: draftItems });
                const nextCampaign = res.data;
                if (!nextCampaign?.id) {
                    throw new Error("API không trả về campaign id");
                }
                toast.success("Đã tạo campaign");
                redirectToList();
                return;
            }
            const payload: UpdateFlashSaleCampaignDTO = {
                name: form.name,
                description: form.description,
                type: form.type,
                coverImage: form.coverImage,
                campaignDate: form.campaignDate,
                slotCode: form.slotCode,
            };
            const res = await flashSaleApi.update(campaignId!, payload);
            const nextCampaign = res.data;
            toast.success("Đã cập nhật campaign");
            if (nextCampaign?.id) {
                redirectToList();
                return;
            }
            await loadCampaign();
        } catch (error) {
            const message = error instanceof Error ? error.message : resolveApiErrorMessage(error, "Không thể lưu campaign");
            setErrorMessage(message);
            toast.error(message);
        }
    };

    const handleSelectProduct = (product: ProductOption) => {
        setSelectedProduct(product);
        const nextVariant = product.variants.find((variant) => variant.isActive !== false && variant.quantityAvailable > 0) || product.variants[0] || null;
        if (nextVariant) {
            setItemEditor({
                variantId: nextVariant.id,
                flashPrice: Math.max(1, Math.floor(nextVariant.salePrice * 0.7)),
                saleStock: Math.max(1, Math.min(10, nextVariant.quantityAvailable || 1)),
                perUserLimit: 1,
            });
        }
    };

    const resetItemSelector = () => {
        setSelectedProduct(null);
        setItemEditor(buildItemEditor());
        setProductSearch("");
        setSearchResults([]);
    };

    const handleAddItem = async () => {
        try {
            validateItemEditor();
            const payload: CreateFlashSaleCampaignItemDTO = { ...itemEditor };
            if (isCreateMode) {
                const duplicate = draftItems.some((item) => item.variantId === payload.variantId);
                if (duplicate) throw new Error("Variant này đã có trong campaign");
                setDraftItems((prev) => [...prev, payload]);
                resetItemSelector();
                return;
            }
            await flashSaleApi.addItem(campaignId!, payload);
            toast.success("Đã thêm sản phẩm vào campaign");
            resetItemSelector();
            await loadCampaign();
        } catch (error) {
            const message = error instanceof Error ? error.message : resolveApiErrorMessage(error, "Không thể thêm sản phẩm");
            setErrorMessage(message);
            toast.error(message);
        }
    };

    const handleDeleteExistingItem = async (itemId: string) => {
        if (!campaignId) return;
        try {
            await flashSaleApi.deleteItem(campaignId, itemId);
            toast.success("Đã xóa sản phẩm");
            await loadCampaign();
        } catch (error) {
            toast.error(resolveApiErrorMessage(error, "Không thể xóa sản phẩm"));
        }
    };

    const handleSaveExistingItem = async (item: FlashSaleCampaignItemDTO) => {
        if (!campaignId) return;
        try {
            await flashSaleApi.updateItem(campaignId, item.id, {
                variantId: item.variantId,
                flashPrice: Number(item.flashPrice),
                saleStock: Number(item.saleStock),
                perUserLimit: Number(item.perUserLimit),
            });
            toast.success("Đã cập nhật sản phẩm");
            await loadCampaign();
        } catch (error) {
            toast.error(resolveApiErrorMessage(error, "Không thể cập nhật sản phẩm"));
        }
    };

    const updateCampaignItemLocal = (itemId: string, patch: Partial<FlashSaleCampaignItemDTO>) => {
        setCampaign((prev) => prev ? {
            ...prev,
            items: prev.items.map((item) => item.id === itemId ? { ...item, ...patch } : item),
        } : prev);
    };

    const renderItems = () => {
        if (isCreateMode) {
            return draftItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Chưa có sản phẩm nào trong campaign.
                </div>
            ) : (
                <div className="space-y-3">
                    {draftItems.map((item, index) => (
                        <div key={item.variantId} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-black text-slate-900">Variant {index + 1}</p>
                                    <p className="text-xs text-slate-500">{item.variantId}</p>
                                </div>
                                <button onClick={() => setDraftItems((prev) => prev.filter((candidate) => candidate.variantId !== item.variantId))} className="rounded-xl bg-rose-50 p-2 text-rose-600">
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return !campaign || campaign.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Campaign chưa có sản phẩm.
            </div>
        ) : (
            <div className="space-y-3">
                {campaign.items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                                    {item.productImage ? (
                                        <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No image</div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-black text-slate-900">{item.productName}</p>
                                    <p className="text-xs text-slate-500">{formatVariantLabel(item.variantUnitType, item.variantSpecification)}</p>
                                </div>
                            </div>
                            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                                <input
                                    type="number"
                                    value={item.flashPrice}
                                    disabled={readOnly}
                                    onChange={(e) => updateCampaignItemLocal(item.id, { flashPrice: Number(e.target.value) as never })}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
                                />
                                <input
                                    type="number"
                                    value={item.saleStock}
                                    disabled={readOnly}
                                    onChange={(e) => updateCampaignItemLocal(item.id, { saleStock: Number(e.target.value) as never })}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
                                />
                                <input
                                    type="number"
                                    value={item.perUserLimit}
                                    disabled={readOnly}
                                    onChange={(e) => updateCampaignItemLocal(item.id, { perUserLimit: Number(e.target.value) as never })}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
                                />
                            </div>
                            {!readOnly && (
                                <div className="flex gap-2">
                                    <button onClick={() => void handleSaveExistingItem(item)} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white">Lưu</button>
                                    <button onClick={() => void handleDeleteExistingItem(item.id)} className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600"><FaTrash /></button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return <div className="rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-500 shadow-sm">Đang tải campaign...</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={isCreateMode ? "Tạo campaign flash sale" : campaign?.name || "Chi tiết flash sale"}
                description={readOnly ? "Campaign đã publish hoặc hủy, chỉ có thể xem chi tiết." : "Chỉnh thông tin campaign, chọn khung giờ và quản lý sản phẩm flash sale."}
                onBack={() => navigate("/flash-sales")}
                actionLabel={isCreateMode ? "Tạo campaign" : "Lưu campaign"}
                onAction={() => { void handleSubmitCampaign(); }}
                actionClassName="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            />

            {errorMessage && (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                    <FaTriangleExclamation className="mt-0.5 shrink-0" />
                    <p className="text-sm font-medium leading-6">{errorMessage}</p>
                </div>
            )}

            <section className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Thông tin campaign</h2>
                        <p className="mt-1 text-sm text-slate-500">Campaign chạy theo ngày và khung giờ preset.</p>
                    </div>
                    {!isCreateMode && campaign && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">{campaign.status}</span>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Tên campaign</label>
                        <input
                            value={form.name}
                            disabled={readOnly}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-50"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Loại campaign</label>
                        <select
                            value={form.type}
                            disabled={readOnly}
                            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as FlashSaleCampaignType }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-50"
                        >
                            <option value="NORMAL">Normal</option>
                            <option value="BIG_EVENT">Big Event</option>
                        </select>
                    </div>
                    <div className="lg:col-span-2">
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Mô tả</label>
                        <input
                            value={form.description || ""}
                            disabled={readOnly}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-50"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Ngày chạy</label>
                        <input
                            type="date"
                            value={form.campaignDate}
                            disabled={readOnly}
                            onChange={(e) => setForm((prev) => ({ ...prev, campaignDate: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-50"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Khung giờ</label>
                        <select
                            value={form.slotCode}
                            disabled={readOnly}
                            onChange={(e) => setForm((prev) => ({ ...prev, slotCode: e.target.value as FlashSaleSlotCode }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-50"
                        >
                            {SLOT_OPTIONS.map((slot) => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
                        </select>
                    </div>
                </div>

                {form.type === "BIG_EVENT" && (
                    <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-black text-slate-900">Ảnh bìa Big Event</p>
                                <p className="text-xs text-slate-500">Ảnh này sẽ được dùng cho hero homepage và trang riêng của campaign.</p>
                            </div>
                            {!readOnly && (
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm">
                                    <FaCloudArrowUp />
                                    {uploadingCover ? "Đang upload..." : "Upload ảnh"}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { void handleCoverUpload(e.target.files?.[0]); }} />
                                </label>
                            )}
                        </div>
                        {form.coverImage ? (
                            <img src={form.coverImage} alt="Flash sale cover" className="h-48 w-full rounded-2xl object-cover" />
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">Chưa có ảnh bìa.</div>
                        )}
                    </div>
                )}
            </section>

            <section className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Sản phẩm flash sale</h2>
                    <p className="mt-1 text-sm text-slate-500">Tìm sản phẩm, chọn variant, sau đó thêm vào campaign.</p>
                </div>

                {renderItems()}

                {!readOnly && (
                    <>
                        <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                            <div className="relative">
                                <FaMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                                <input
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-sm"
                                    placeholder="Tìm sản phẩm theo tên..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                />
                                {productSearch && (
                                    <button onClick={() => setProductSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600">
                                        <FaXmark className="text-[10px]" />
                                    </button>
                                )}
                            </div>
                            {productLoading ? (
                                <div className="text-sm text-slate-500">Đang tìm sản phẩm...</div>
                            ) : (
                                <div className="grid gap-3">
                                    {searchResults.map((product) => (
                                        <button key={product.id} type="button" onClick={() => handleSelectProduct(product)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left ${selectedProduct?.id === product.id ? "border-emerald-200 bg-emerald-50/60" : "border-slate-100 bg-white"}`}>
                                            <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-100">
                                                {product.primaryImage ? <img src={product.primaryImage} alt={product.name} className="h-full w-full object-cover" /> : null}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-black text-slate-900">{product.name}</p>
                                                <p className="text-xs text-slate-500">{product.slug}</p>
                                            </div>
                                            {selectedProduct?.id === product.id && <FaCircleCheck className="text-emerald-600" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedProduct && (
                            <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                <div className="flex items-start gap-4">
                                    <div className="h-24 w-24 overflow-hidden rounded-2xl bg-white">
                                        {selectedProduct.primaryImage ? <img src={selectedProduct.primaryImage} alt={selectedProduct.name} className="h-full w-full object-cover" /> : null}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-base font-black text-slate-900">{selectedProduct.name}</p>
                                        <p className="mt-1 text-xs text-slate-500">{selectedProduct.slug}</p>
                                        <div className="mt-3 grid gap-2">
                                            {selectedProduct.variants.map((variant) => {
                                                const disabled = variant.isActive === false || variant.quantityAvailable <= 0;
                                                const selected = itemEditor.variantId === variant.id;
                                                return (
                                                    <button
                                                        key={variant.id}
                                                        type="button"
                                                        disabled={disabled}
                                                        onClick={() => setItemEditor((prev) => ({
                                                            ...prev,
                                                            variantId: variant.id,
                                                            flashPrice: Math.max(1, Math.floor(variant.salePrice * 0.7)),
                                                            saleStock: Math.max(1, Math.min(10, variant.quantityAvailable || 1)),
                                                            perUserLimit: 1,
                                                        }))}
                                                        className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left ${selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
                                                    >
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{formatVariantLabel(variant.unitType, variant.specification)}</p>
                                                            <p className="text-xs text-slate-500">Giá {variant.salePrice.toLocaleString("vi-VN")} đ · Còn {variant.quantityAvailable}</p>
                                                        </div>
                                                        {disabled ? <FaCircleXmark className="text-rose-500" /> : selected ? <FaCircleCheck className="text-emerald-600" /> : null}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {selectedVariant && (
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                        <input type="number" value={itemEditor.flashPrice} onChange={(e) => setItemEditor((prev) => ({ ...prev, flashPrice: Number(e.target.value) }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="Giá flash" />
                                        <input type="number" value={itemEditor.saleStock} onChange={(e) => setItemEditor((prev) => ({ ...prev, saleStock: Number(e.target.value) }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="Số lượng sale" />
                                        <input type="number" value={itemEditor.perUserLimit} onChange={(e) => setItemEditor((prev) => ({ ...prev, perUserLimit: Number(e.target.value) }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="Limit / user" />
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <button onClick={() => void handleAddItem()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                                        <FaPlus className="text-sm" /> Thêm vào campaign
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>

            {!isCreateMode && campaign?.type === "BIG_EVENT" && campaign.code && (
                <div className="flex justify-end">
                    <button
                        onClick={() => window.open(`/flash-sales/events/${campaign.code}`, "_blank")}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                        <FaArrowUpRightFromSquare className="text-sm" /> Xem landing page customer
                    </button>
                </div>
            )}
        </div>
    );
};

export default FlashSaleEditorPage;
