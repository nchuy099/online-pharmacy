import { useState, useRef } from 'react';
import { FaCamera, FaUserCircle } from 'react-icons/fa';

interface AvatarUploadProps {
    currentImageUrl?: string;
    onImageSelect: (file: File) => void;
    isEditing: boolean;
}

export default function AvatarUpload({ currentImageUrl, onImageSelect, isEditing }: AvatarUploadProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageSelect(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                className={`relative w-32 h-32 rounded-full overflow-hidden border-4 ${isEditing ? 'border-emerald-100 dark:border-emerald-900/50 cursor-pointer group' : 'border-gray-100 dark:border-gray-700 cursor-default'}`}
                onClick={triggerFileInput}
            >
                {previewUrl ? (
                    <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-600">
                        <FaUserCircle className="w-24 h-24" />
                    </div>
                )}

                {isEditing && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <FaCamera className="text-white text-2xl" />
                    </div>
                )}
            </div>

            {isEditing && (
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Recommended: Square image, max 2MB</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={triggerFileInput}
                        className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
                    >
                        Change Photo
                    </button>
                </div>
            )}
        </div>
    );
}
