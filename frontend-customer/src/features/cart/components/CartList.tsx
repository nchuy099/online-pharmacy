import React from "react";
import type { CartItem as CartItemType } from "../types/domain";
import { CartItem } from "./CartItem";

interface Props {
    items: CartItemType[];
}

export const CartList: React.FC<Props> = ({ items }) => {
    return (
        <div className="space-y-4">
            {items.map((item) => (
                <CartItem
                    key={item.id}
                    item={item}
                />
            ))}
        </div>
    );
};