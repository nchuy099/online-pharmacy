import React from "react";
import { FaCapsules } from "react-icons/fa";

interface Props {
    primaryImage: string;
    secondaryImages: string[];
    productName: string;
    activeImage: string | null;
    onImageSelect: (img: string) => void;
}

export const ProductImageGallery: React.FC<Props> = ({
    primaryImage,
    secondaryImages,
    productName,
    activeImage,
    onImageSelect
}) => {
    const allImages = [primaryImage, ...secondaryImages].filter(Boolean);

    return (
        <div className="lg:col-span-6">
            <div className="aspect-square bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 group shadow-sm">
                {activeImage ? (
                    <img
                        src={activeImage}
                        alt={productName}
                        className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <FaCapsules className="text-emerald-400 text-7xl opacity-40" />
                )}
            </div>
            {allImages.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                    {allImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => onImageSelect(img)}
                            className={`w-16 h-16 flex-shrink-0 rounded-xl border-2 overflow-hidden transition-all ${activeImage === img ? 'border-emerald-500 shadow-md shadow-emerald-100' : 'border-gray-100 opacity-50 hover:opacity-80'}`}
                        >
                            <img src={img} className="w-full h-full object-cover" alt="" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
