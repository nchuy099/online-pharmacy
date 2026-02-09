import { useEffect, useState } from 'react';
import { FormModal, FormField } from '../../../shared/components/ui';
import { CreatePharmacistParams } from '../types/dto';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreatePharmacistParams) => void;
}

const PharmacistModal = ({ isOpen, onClose, onSave }: Props) => {
    const [formData, setFormData] = useState<Partial<CreatePharmacistParams>>({
        email: '',
        fullName: '',
        password: '',
        phoneNumber: '',
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                email: '',
                fullName: '',
                password: '',
                phoneNumber: '',
            });
        }
    }, [isOpen]);

    const fields: FormField<CreatePharmacistParams>[] = [
        { key: 'email', label: 'Email', type: 'text', placeholder: 'example@gmail.com', required: true },
        { key: 'fullName', label: 'Họ tên', type: 'text', placeholder: 'Nguyễn Văn A', required: true },
        { key: 'password', label: 'Mật khẩu', type: 'password', placeholder: '********', required: true },
        { key: 'phoneNumber', label: 'Số điện thoại', type: 'text', placeholder: '09xxxxxxxx', required: true },
    ];

    const handleDataChange = (field: keyof CreatePharmacistParams, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.email || !formData.fullName || !formData.password) return;
        onSave(formData as CreatePharmacistParams);
    };

    return (
        <FormModal<CreatePharmacistParams>
            isOpen={isOpen}
            mode="create"
            titleCreate="Thêm dược sĩ mới"
            fields={fields}
            data={formData}
            onDataChange={handleDataChange}
            onClose={onClose}
            onSave={handleSave}
            accentColor="indigo"
            submitLabelCreate="Lưu"
            cancelLabel="Hủy"
        />
    );
};

export default PharmacistModal;
