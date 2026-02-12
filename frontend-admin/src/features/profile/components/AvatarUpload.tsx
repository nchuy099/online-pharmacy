import { useEffect, useRef, useState } from 'react';
import { FaCamera, FaUserCircle } from 'react-icons/fa';

interface AvatarUploadProps {
    currentImageUrl?: string;
    onImageSelect: (file: File) => void;
    isEditing: boolean;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ currentImageUrl, onImageSelect, isEditing }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPreviewUrl(currentImageUrl || null);
    }, [currentImageUrl]);

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
                className={`relative w-28 h-28 lg:w-32 lg:h-32 rounded-[2.5rem] overflow-hidden border-4 ${isEditing ? 'border-emerald-100 cursor-pointer group shadow-xl shadow-emerald-500/10' : 'border-white cursor-default shadow-2xl shadow-gray-200'}`}
                onClick={triggerFileInput}
            >
                {previewUrl ? (
                    <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-200">
                        <FaUserCircle className="w-20 h-20 lg:w-24 lg:h-24" />
                    </div>
                )}

                {isEditing && (
                    <div className="absolute inset-0 bg-emerald-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                            <FaCamera className="text-white text-xl" />
                        </div>
                    </div>
                )}
            </div>

            {isEditing && (
                <div className="text-center animate-in fade-in slide-in-from-top-2 duration-500">
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
                        className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100"
                    >
                        Thay đổi ảnh
                    </button>
                </div>
            )}
        </div>
    );
}

export default AvatarUpload;
