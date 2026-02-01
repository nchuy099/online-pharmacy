import { useEffect, useState } from "react"
import type { Address } from "../types/domain"
import { ORDER_MODE, type OrderMode, type PaymentMethod } from "../types/order.constant"
import type { OrderItem } from "../types/domain"
import { orderService } from "../services/order.service"

type Props = {
    mode: OrderMode | null
    variantId: string | null
    qty: number
}

export const useCheckout = ({ mode, variantId, qty }: Props) => {
    const [checkoutItems, setCheckoutItems] = useState<OrderItem[]>([])

    const [finalAmount, setFinalAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)

    useEffect(() => {
        const load = async () => {
            if (mode === ORDER_MODE.BUY_NOW && variantId) {
                const res = await orderService.checkout({
                    mode,
                    buyNowItem: {
                        variantId: variantId,
                        quantity: qty
                    }
                });

                setCheckoutItems(res.items)
                setFinalAmount(res.finalAmount)
            }

            if (mode === ORDER_MODE.CART) {
                const res = await orderService.checkout({ mode });

                setCheckoutItems(res.items)
                setFinalAmount(res.finalAmount)
            }
        }

        load()
    }, [mode, variantId, qty])

    return {
        checkoutItems,
        finalAmount,
        paymentMethod,
        setPaymentMethod,
        selectedAddress,
        setSelectedAddress
    }
}