import { useState, FormEvent, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { notificationBus } from "../../notification";
import { PageHeader } from "../../../shared/components";
import RichTextEditor from "../../../shared/components/ui/RichTextEditor";
import ProductCategoryEditDialog from "../components/ProductCategoryEditDialog";
import { useProductActions, useProductDetails } from "../hooks/useProduct";
import { useCategoryAll } from "../../category/hooks/useCategory";
import productService from "../services";
import productApi from "../api";
import {
    CreateProductRequestDto,
    ProductIngredientDto,
    UpdateProductRequestDto,
    CatalogOptionDto,
    ProductCatalogOptionsDto
} from "../types/dto";

type ContentTabKey = "description" | "careful" | "adverseEffect" | "preservation" | "usage" | "dosage";

const ProductFormPage = () => {
    const navigate = useNavigate();
    const { productId } = useParams<{ productId: string }>();
    const isEdit = !!productId;
    const { createProduct, updateProduct, isLoading } = useProductActions();
    const { product, isLoading: isDetailsLoading } = useProductDetails(productId);
    const { categories: allCategories } = useCategoryAll();

    const [formData, setFormData] = useState<Partial<CreateProductRequestDto>>({
        name: "",
        webName: "",
        primaryImage: "",
        secondaryImages: [],
        brand: "",
        brandOrigin: "",
        producer: "",
        description: "",
        careful: "",
        adverseEffect: "",
        preservation: "",
        usage: "",
        dosage: "",
        variants: [
            {
                unitType: "",
                specification: "",
                salePrice: 0,
                discountPercent: 0,
                isDefault: true,
                isActive: true,
            },
        ],
        ingredient: [],
        categoryIds: [],
    });

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isPrimaryUploading, setIsPrimaryUploading] = useState(false);
    const [isSecondaryUploading, setIsSecondaryUploading] = useState(false);
    const [activeContentTab, setActiveContentTab] = useState<ContentTabKey>("description");
    const [contentDraft, setContentDraft] = useState({
        description: "",
        careful: "",
        adverseEffect: "",
        preservation: "",
        usage: "",
        dosage: "",
    });
    const [imageOrder, setImageOrder] = useState<string[]>([]);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [catalogOptions, setCatalogOptions] = useState<ProductCatalogOptionsDto>({
        brands: [],
        brandOrigins: [],
        ingredients: [],
        unitTypes: [],
    });
    const [isCatalogLoading, setIsCatalogLoading] = useState(false);

    useEffect(() => {
        if (!isEdit || !product) return;
        setFormData({
            name: product.name,
            webName: product.webName,
            primaryImage: product.primaryImage,
            secondaryImages: product.secondaryImages?.map((img: any) => img.url || img) || [],
            brand: product.brand,
            brandOrigin: product.brandOrigin,
            producer: product.producer,
            ingredient: product.ingredient?.map((i: any) => ({ ...i })) || [],
            categoryIds: product.categories?.map((c: any) => c.id) || [],
        });
        setContentDraft({
            description: product.description || "",
            careful: product.careful || "",
            adverseEffect: product.adverseEffect || "",
            preservation: product.preservation || "",
            usage: product.usage || "",
            dosage: product.dosage || "",
        });
    }, [isEdit, product]);

    useEffect(() => {
        if (!isEdit || !product) return;
        const order = [
            product.primaryImage,
            ...((product.secondaryImages || []).map((img: any) => img.url || img)),
        ];
        const deduped = Array.from(new Set(order.filter(Boolean)));
        setImageOrder(deduped);
    }, [isEdit, product]);

    useEffect(() => {
        let mounted = true;
        const loadCatalogOptions = async () => {
            setIsCatalogLoading(true);
            try {
                const res = await productApi.getCatalogOptions();
                const data = (res as any)?.data ?? (res as any);
                if (mounted) {
                    setCatalogOptions({
                        brands: data?.brands || [],
                        brandOrigins: data?.brandOrigins || [],
                        ingredients: data?.ingredients || [],
                        unitTypes: data?.unitTypes || [],
                    });
                }
            } catch (error: any) {
                if (mounted) {
                    notificationBus.error(error?.message || "Không thể tải danh mục chọn");
                }
            } finally {
                if (mounted) setIsCatalogLoading(false);
            }
        };

        void loadCatalogOptions();

        return () => {
            mounted = false;
        };
    }, []);

    const labelWithParent = (option: CatalogOptionDto) => (
        option.parentName ? option.parentName + " / " + option.name : option.name
    );

    const handleChange = (field: keyof CreateProductRequestDto, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const selectedCategories = allCategories.filter((category) => category.id && (formData.categoryIds || []).includes(category.id));

    const syncImages = (primaryImage: string, nextOrder: string[]) => {
        const deduped = Array.from(new Set(nextOrder.filter(Boolean)));
        setImageOrder(deduped);
        setFormData((prev) => ({
            ...prev,
            primaryImage,
            secondaryImages: deduped.filter((url) => url !== primaryImage),
        }));
    };

    const addIngredient = () => {
        const ingredients = [...(formData.ingredient || [])];
        ingredients.push({ id: "", ingredientId: "", name: "", shortDescription: "" });
        handleChange("ingredient", ingredients);
    };

    const removeIngredient = (index: number) => {
        const ingredients = [...(formData.ingredient || [])];
        ingredients.splice(index, 1);
        handleChange("ingredient", ingredients);
    };

    const updateIngredient = (index: number, patch: Partial<ProductIngredientDto>) => {
        setFormData((prev) => {
            const ingredients = [...(prev.ingredient || [])];
            ingredients[index] = { ...ingredients[index], ...patch };
            return { ...prev, ingredient: ingredients };
        });
    };

    const setPrimaryImageFromList = (imageUrl: string) => {
        if (!imageUrl) return;
        const order = imageOrder.includes(imageUrl) ? imageOrder : [...imageOrder, imageUrl];
        syncImages(imageUrl, order);
    };

    const removeImageByUrl = (imageUrl: string) => {
        const nextOrder = imageOrder.filter((url) => url !== imageUrl);
        if (nextOrder.length === 0) {
            syncImages("", []);
            return;
        }
        const nextPrimary = formData.primaryImage === imageUrl ? nextOrder[0] : (formData.primaryImage || nextOrder[0]);
        syncImages(nextPrimary, nextOrder);
    };

    const addVariant = () => {
        const variants = [...(formData.variants || [])];
        variants.push({
            unitType: "",
            specification: "",
            salePrice: 0,
            discountPercent: 0,
            isDefault: variants.length === 0,
            isActive: true,
        });
        handleChange("variants", variants);
    };

    const removeVariant = (index: number) => {
        const variants = [...(formData.variants || [])];
        variants.splice(index, 1);
        if (variants.length > 0 && !variants.some((v) => v.isDefault)) {
            variants[0] = { ...variants[0], isDefault: true };
        }
        handleChange("variants", variants);
    };

    const updateVariant = (index: number, patch: Record<string, any>) => {
        setFormData((prev) => {
            const variants = [...(prev.variants || [])];
            variants[index] = { ...variants[index], ...patch };
            if (patch.isDefault === true) {
                for (let i = 0; i < variants.length; i += 1) {
                    if (i !== index) variants[i] = { ...variants[i], isDefault: false };
                }
            }
            return { ...prev, variants };
        });
    };

    const handlePrimaryImageUpload = async (file: File | null) => {
        if (!file) return;
        setErrorMessage(null);
        setIsPrimaryUploading(true);
        try {
            const imageUrl = await productService.uploadProductImage(file);
            const nextOrder = imageOrder.includes(imageUrl) ? imageOrder : [...imageOrder, imageUrl];
            syncImages(imageUrl, nextOrder);
            notificationBus.success("Tải ảnh chính thành công");
        } catch (error: any) {
            setErrorMessage(error.message || "Tải ảnh chính thất bại");
        } finally {
            setIsPrimaryUploading(false);
        }
    };

    const handleSecondaryImagesUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setErrorMessage(null);
        setIsSecondaryUploading(true);
        try {
            const uploadedUrls: string[] = [];
            for (const file of Array.from(files)) {
                const imageUrl = await productService.uploadProductImage(file);
                uploadedUrls.push(imageUrl);
            }
            const merged = Array.from(new Set([...imageOrder, ...uploadedUrls]));
            const nextPrimary = formData.primaryImage || merged[0] || "";
            syncImages(nextPrimary, merged);
            notificationBus.success("Tải ảnh phụ thành công");
        } catch (error: any) {
            setErrorMessage(error.message || "Tải ảnh phụ thất bại");
        } finally {
            setIsSecondaryUploading(false);
        }
    };

    const parsePriceInput = (value: string) => value.replace(/\D/g, '');
    const formatPriceInput = (value: string | number) => {
        const raw = typeof value === "number" ? String(value) : value;
        if (!raw) return "";
        const numeric = Number(raw);
        if (!Number.isFinite(numeric)) return "";
        return numeric.toLocaleString("vi-VN");
    };


    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setErrorMessage(null);

        if (isPrimaryUploading || isSecondaryUploading) {
            setErrorMessage("Vui lòng chờ tải ảnh lên hoàn tất trước khi lưu.");
            return;
        }

        const name = formData.name?.trim() || "";
        const webName = formData.webName?.trim() || "";
        const primaryImage = formData.primaryImage?.trim() || "";
        const brand = formData.brand?.trim() || "";
        const brandOrigin = formData.brandOrigin?.trim() || "";
        const producer = formData.producer?.trim() || "";
        const description = String(contentDraft.description || "").trim();
        const careful = String(contentDraft.careful || "").trim();
        const adverseEffect = String(contentDraft.adverseEffect || "").trim();
        const preservation = String(contentDraft.preservation || "").trim();
        const usage = String(contentDraft.usage || "").trim();
        const dosage = String(contentDraft.dosage || "").trim();
        const categoryIds = formData.categoryIds || [];
        const variants = formData.variants || [];

        if (!name) {
            setErrorMessage("Vui lòng nhập Tên sản phẩm.");
            return;
        }

        const normalizedIngredients = (formData.ingredient || []).map((ing) => {
            const numericIngredientId = Number(String(ing.ingredientId || "").trim());
            return {
                ingredientId: Number.isFinite(numericIngredientId) && numericIngredientId > 0 ? String(numericIngredientId) : undefined,
                name: String(ing.name || "").trim(),
                shortDescription: String(ing.shortDescription || "").trim(),
            };
        }).filter((ing) => ing.name || ing.shortDescription);

        const normalizedVariants = variants
            .map((variant) => ({
                unitType: String(variant.unitType || "").trim(),
                specification: String(variant.specification || "").trim(),
                salePrice: Number(variant.salePrice || 0),
                discountPercent: Number(variant.discountPercent || 0),
                isDefault: Boolean(variant.isDefault),
                isActive: variant.isActive ?? true,
            }))
            .filter((variant) => variant.unitType || variant.salePrice > 0 || variant.specification);
        const catalogUnitTypeNames = catalogOptions.unitTypes.map((opt) => opt.name);

        if (!isEdit) {
            if (!webName) {
                setErrorMessage("Vui lòng nhập Tên hiển thị website.");
                return;
            }
            if (!primaryImage) {
                setErrorMessage("Vui lòng tải Ảnh chính.");
                return;
            }
            if (!brand) {
                setErrorMessage("Vui lòng chọn Thương hiệu.");
                return;
            }
            if (!brandOrigin) {
                setErrorMessage("Vui lòng chọn Xuất xứ thương hiệu.");
                return;
            }
            if (!producer) {
                setErrorMessage("Vui lòng nhập Nhà sản xuất.");
                return;
            }
            if (!description) {
                setErrorMessage("Vui lòng nhập Mô tả sản phẩm.");
                return;
            }
            if (!usage) {
                setErrorMessage("Vui lòng nhập Công dụng.");
                return;
            }
            if (!dosage) {
                setErrorMessage("Vui lòng nhập Liều dùng.");
                return;
            }
            if (!careful) {
                setErrorMessage("Vui lòng nhập Lưu ý.");
                return;
            }
            if (!adverseEffect) {
                setErrorMessage("Vui lòng nhập Tác dụng phụ.");
                return;
            }
            if (!preservation) {
                setErrorMessage("Vui lòng nhập Bảo quản.");
                return;
            }
            if (normalizedVariants.length === 0) {
                setErrorMessage("Vui lòng thêm ít nhất một phân loại sản phẩm.");
                return;
            }
            if (normalizedVariants.some((variant) => !variant.unitType)) {
                setErrorMessage("Mỗi phân loại cần có Đơn vị.");
                return;
            }
            if (normalizedVariants.some((variant) => !catalogUnitTypeNames.includes(variant.unitType))) {
                setErrorMessage("Đơn vị của phân loại phải chọn từ danh mục có sẵn.");
                return;
            }
            if (normalizedVariants.some((variant) => variant.salePrice <= 0)) {
                setErrorMessage("Giá bán của phân loại phải lớn hơn 0.");
                return;
            }
            if (categoryIds.length === 0) {
                setErrorMessage("Vui lòng chọn ít nhất một danh mục.");
                return;
            }
            if (normalizedIngredients.length === 0) {
                setErrorMessage("Vui lòng thêm ít nhất một thành phần.");
                return;
            }
            if (normalizedIngredients.some((ing) => !ing.name || !ing.shortDescription)) {
                setErrorMessage("Mỗi thành phần cần có tên và hàm lượng.");
                return;
            }
        }

        const basePayload: CreateProductRequestDto = {
            name: formData.name!.trim(),
            webName,
            primaryImage,
            secondaryImages: (formData.secondaryImages || []).filter(img => img.trim()),
            brand,
            brandOrigin,
            producer,
            description,
            careful,
            adverseEffect,
            preservation,
            usage,
            dosage,
            variants: normalizedVariants.length > 0 ? normalizedVariants : undefined,
            ingredient: normalizedIngredients.filter((ing) => ing.name),
            categoryIds,
        };

        try {
            if (isEdit && productId) {
                await updateProduct(productId, { ...basePayload, categoryIds: undefined, variants: undefined } as UpdateProductRequestDto);
                notificationBus.success("Cập nhật sản phẩm thành công");
                navigate(`/products/${productId}/details`);
            } else {
                await createProduct(basePayload);
                notificationBus.success("Tạo sản phẩm thành công");
                navigate("/products");
            }
        } catch (error: any) {
            setErrorMessage(error.message || "Thao tác thất bại. Vui lòng thử lại.");
        }
    };

    const handleCancel = () => {
        if (isEdit && productId) {
            navigate(`/products/${productId}/details`);
            return;
        }
        navigate("/products");
    };

    if (isEdit && isDetailsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-sm text-gray-500 font-medium italic animate-pulse">Đang tải dữ liệu sản phẩm...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={isEdit ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                description={isEdit ? "Cập nhật thông tin chi tiết về sản phẩm thuốc" : "Điền các thông tin cơ bản để tạo sản phẩm thuốc mới trong hệ thống"}
                onBack={handleCancel}
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                        <h3 className="text-sm font-bold text-gray-900">Thông tin cơ bản</h3>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-xs font-semibold text-gray-700">Tên sản phẩm (Hệ thống) <span className="text-red-500">*</span></label>
                            <input type="text" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Tên nội bộ..." />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-xs font-semibold text-gray-700">Tên hiển thị Website (Web Name)</label>
                            <input type="text" value={formData.webName} onChange={(e) => handleChange("webName", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Tên hiển thị cho khách hàng..." />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-700">Thương hiệu</label>
                            <input
                                type="text"
                                value={formData.brand || ""}
                                onChange={(e) => handleChange("brand", e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                placeholder="Nhập thương hiệu..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-700">Xuất xứ thương hiệu</label>
                            <input
                                type="text"
                                value={formData.brandOrigin || ""}
                                onChange={(e) => handleChange("brandOrigin", e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                placeholder="Nhập xuất xứ thương hiệu..."
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-xs font-semibold text-gray-700">Nhà sản xuất</label>
                            <input type="text" value={formData.producer} onChange={(e) => handleChange("producer", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                        </div>
                    </div>
                </section>

                {!isEdit && (
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                             <div>
                                 <h3 className="text-sm font-bold text-gray-900">Danh mục <span className="text-red-500">*</span></h3>
                                 <p className="text-xs text-gray-500 mt-0.5">Bắt buộc khi tạo sản phẩm</p>
                                 {(formData.categoryIds || []).length > 0 && (
                                     <p className="text-xs text-gray-400 mt-0.5">Đã chọn {(formData.categoryIds || []).length} danh mục</p>
                                 )}
                             </div>
                             <button
                                 type="button"
                                 onClick={() => setIsCategoryDialogOpen(true)}
                                 className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700"
                             >
                                 Chọn danh mục
                             </button>
                        </div>
                        <div className="p-5">
                            {(formData.categoryIds || []).length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-500">
                                        Đã chọn {(formData.categoryIds || []).length} danh mục.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCategories.map((category) => (
                                            <span
                                                key={category.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200"
                                            >
                                                {category.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Chưa chọn danh mục. Nhấn "Chọn danh mục" để thêm.
                                </p>
                            )}
                        </div>
                    </section>
                )}

                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                        <h3 className="text-sm font-bold text-gray-900">Hình ảnh</h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <label className="text-xs text-emerald-700 cursor-pointer font-semibold">
                                {(isPrimaryUploading || isSecondaryUploading) ? "Đang tải ảnh..." : "Tải ảnh"}
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    disabled={isPrimaryUploading || isSecondaryUploading}
                                    onChange={(e) => {
                                        if ((e.target.files?.length || 0) > 1) {
                                            void handleSecondaryImagesUpload(e.target.files);
                                        } else {
                                            const file = e.target.files?.[0] || null;
                                            void handlePrimaryImageUpload(file);
                                        }
                                        e.currentTarget.value = "";
                                    }}
                                />
                            </label>
                        </div>
                        {(() => {
                            const imageList = imageOrder.map((url) => ({ url, isPrimary: url === formData.primaryImage }));
                            if (imageList.length === 0) {
                                return <div className="text-sm text-gray-400">Không có ảnh</div>;
                            }
                            return (
                                <div className="flex flex-wrap gap-3">
                                    {imageList.map((image, idx) => (
                                        <div
                                            key={`${image.url}-${idx}`}
                                            role="button"
                                            tabIndex={0}
                                            className={`w-20 h-20 rounded-lg border overflow-hidden bg-gray-50 relative text-left ${
                                                image.isPrimary ? "border-emerald-400 ring-1 ring-emerald-300" : "border-gray-100"
                                            }`}
                                            onClick={() => {
                                                if (!image.isPrimary) {
                                                    setPrimaryImageFromList(image.url);
                                                }
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault();
                                                    if (!image.isPrimary) {
                                                        setPrimaryImageFromList(image.url);
                                                    }
                                                }
                                            }}
                                        >
                                            <img src={image.url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                                            {image.isPrimary && (
                                                <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white">Chính</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    removeImageByUrl(image.url);
                                                }}
                                                className="absolute top-1 right-1 bg-white text-red-600 text-[10px] px-1.5 py-0.5 rounded"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </section>

                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex flex-wrap gap-2">
                        {[
                            { key: "description", label: "Mô tả sản phẩm" },
                            { key: "careful", label: "Lưu ý" },
                            { key: "adverseEffect", label: "Tác dụng phụ" },
                            { key: "preservation", label: "Bảo quản" },
                            { key: "usage", label: "Công dụng" },
                            { key: "dosage", label: "Liều dùng & Cách dùng" },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveContentTab(tab.key as ContentTabKey)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    activeContentTab === tab.key
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="p-5">
                        <RichTextEditor
                            key={activeContentTab}
                            value={contentDraft[activeContentTab] || ""}
                            onChange={(val: string) => {
                                setContentDraft((prev) => ({ ...prev, [activeContentTab]: val }));
                                handleChange(activeContentTab, val);
                            }}
                            placeholder="Nhập nội dung..."
                        />
                    </div>
                </section>

                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">Thành phần</h3>
                        <button type="button" onClick={addIngredient} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors">+ Thêm thành phần</button>
                    </div>
                    <div className="p-5 space-y-3">
                        {formData.ingredient?.map((ing, idx) => (
                            <div key={idx} className="flex gap-3 items-start p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={ing.name || ""}
                                        onChange={(e) => updateIngredient(idx, {
                                            name: e.target.value,
                                            ingredientId: undefined,
                                        })}
                                        className="w-full border-gray-200 rounded-lg px-3 py-2 text-sm"
                                        placeholder="Nhập tên thành phần..."
                                    />
                                    <input type="text" value={ing.shortDescription} onChange={(e) => updateIngredient(idx, { shortDescription: e.target.value })} className="w-full border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Hàm lượng..." />
                                </div>
                                <button type="button" onClick={() => removeIngredient(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl">
                                    Xóa
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {!isEdit && (
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Quản lý biến thể <span className="text-red-500">*</span></h3>
                            <p className="text-xs text-gray-500 mt-0.5">Bắt buộc ít nhất 1 biến thể khi tạo sản phẩm</p>
                        </div>
                        <button type="button" onClick={addVariant} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors">
                            + Thêm biến thể
                        </button>
                    </div>
                    <div className="p-5 space-y-3">
                        {(formData.variants || []).map((variant, idx) => (
                            <div key={idx} className="flex gap-3 items-start p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-gray-600">Đơn vị</label>
                                        <select
                                            value={variant.unitType || ""}
                                            onChange={(e) => updateVariant(idx, { unitType: e.target.value })}
                                            className="w-full border-gray-200 rounded-lg px-3 py-2 text-sm"
                                            disabled={isCatalogLoading}
                                        >
                                            <option value="">Chọn đơn vị từ danh mục</option>
                                            {catalogOptions.unitTypes.map((opt) => (
                                                <option key={opt.id} value={opt.name}>{labelWithParent(opt)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-gray-600">Quy cách</label>
                                        <input
                                            type="text"
                                            value={variant.specification || ""}
                                            onChange={(e) => updateVariant(idx, { specification: e.target.value })}
                                            className="w-full border-gray-200 rounded-lg px-3 py-2 text-sm"
                                            placeholder="Ví dụ: Hộp 10 vỉ x 10 viên"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-gray-600">Giá bán (đ)</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatPriceInput(variant.salePrice ?? 0)}
                                            onChange={(e) => updateVariant(idx, { salePrice: Number(parsePriceInput(e.target.value) || 0) })}
                                            className="w-full border-gray-200 rounded-lg px-3 py-2 text-sm"
                                            placeholder="Ví dụ: 120.000"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="defaultVariant"
                                            checked={Boolean(variant.isDefault)}
                                            onChange={() => updateVariant(idx, { isDefault: true })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-700">Mặc định</span>
                                    </div>
                                </div>
                                <button type="button" onClick={() => removeVariant(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl">
                                    Xóa
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
                )}

                {errorMessage && (
                    <div className="rounded-xl bg-red-50 p-3 border border-red-100 text-red-700 text-sm font-medium">{errorMessage}</div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={handleCancel} className="px-6 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all">Hủy bỏ</button>
                    <button type="submit" disabled={isLoading} className="px-6 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50">
                        {isLoading ? "Đang xử lý..." : isEdit ? "Cập nhật sản phẩm" : "Lưu sản phẩm"}
                    </button>
                </div>
            </form>

            {!isEdit && (
                <ProductCategoryEditDialog
                    isOpen={isCategoryDialogOpen}
                    onClose={() => setIsCategoryDialogOpen(false)}
                    initialCategoryIds={formData.categoryIds || []}
                    onSaveLocal={(categoryIds) => {
                        handleChange("categoryIds", categoryIds);
                    }}
                    title="Chọn danh mục sản phẩm"
                    saveLabel="Lưu danh mục"
                />
            )}
        </div>
    );
};

export default ProductFormPage;
