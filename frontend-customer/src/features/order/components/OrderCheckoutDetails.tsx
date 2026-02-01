import { useCheckout } from "../hooks/useCheckout"
import type { OrderMode } from "../types/order.constant"

type Props = {
    mode: OrderMode,
    variantId: string,
    quantity: number
}

const formatCurrency = (value: number) =>
    value.toLocaleString("vi-VN", { style: "currency", currency: "VND" })

export const OrderCheckoutDetails = ({ mode, variantId, quantity }: Props) => {

    const { checkoutItems, finalAmount } = useCheckout({ mode, variantId, qty: quantity });
    if (checkoutItems.length === 0) {
        return <p>No items in this order.</p>
    }

    return (
        <div>
            {
                checkoutItems.map(i => (
                    <div key={i.productId}>
                        <p>{i.productName}</p>
                        <p>Qty: {i.quantity}</p>
                        <p>Price: {formatCurrency(i.unitPrice)}</p>
                    </div>
                ))
            }
            <p>Total amount: {formatCurrency(finalAmount)} </p>
        </div>
    )
}
