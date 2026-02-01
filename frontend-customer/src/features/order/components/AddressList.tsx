import type { Address } from "../types/domain";
import { AddressCard } from "./AddressCard";

type Props = {
    addresses: Address[];
    onEdit?: (address: Address) => void;
}

export const AddressList = ({ addresses, onEdit }: Props) => {
    return (
        <div className="flex flex-col gap-5 w-full">
            {addresses.map((a) => (
                <AddressCard
                    key={a.id}
                    address={a}
                    onEdit={onEdit}
                />
            ))}
        </div>
    );
};