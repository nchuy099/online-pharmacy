import { FaStar } from "react-icons/fa";

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg" | "xl";
}

export const StarRating = ({
    rating,
    maxRating = 5,
    onRatingChange,
    readonly = false,
    size = "md",
}: StarRatingProps) => {
    const sizeClasses = {
        sm: "text-sm gap-0.5",
        md: "text-lg gap-1",
        lg: "text-2xl gap-1.5",
        xl: "text-4xl gap-2",
    };

    return (
        <div className={`flex items-center ${sizeClasses[size]}`}>
            {[...Array(maxRating)].map((_, index) => {
                const starValue = index + 1;
                const isFilled = starValue <= rating;

                return (
                    <button
                        key={index}
                        type="button"
                        disabled={readonly}
                        onClick={() => onRatingChange?.(starValue)}
                        className={`transition-colors focus:outline-none ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
                    >
                        <FaStar
                            className={`${readonly ? "" : "transition-transform"} ${isFilled ? "text-amber-400" : "text-gray-200"}`}
                        />
                    </button>
                );
            })}
        </div>
    );
};
