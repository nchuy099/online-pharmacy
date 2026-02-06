import { useEffect, useState } from 'react';
import { FormModal, FormField } from '../../../shared/components/ui';
import { CreateSpecialtyParams } from '../types/dto';
import { Specialty } from '../types/domain';

interface Props {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: Specialty;
    onClose: () => void;
    onSave: (data: CreateSpecialtyParams) => void;
}

const SpecialtyModal = ({ isOpen, mode, initialData, onClose, onSave }: Props) => {
    const [formData, setFormData] = useState<Partial<CreateSpecialtyParams>>({
        code: '',
        name: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    code: initialData.code,
                    name: initialData.name,
                });
            } else {
                setFormData({
                    code: '',
                    name: '',
                });
            }
        }
    }, [isOpen, mode, initialData]);

    const fields: FormField<CreateSpecialtyParams>[] = [
        { key: 'code', label: 'Mã chuyên khoa', type: 'text', placeholder: 'CAR', required: true },
        { key: 'name', label: 'Tên chuyên khoa', type: 'text', placeholder: 'Tim mạch', required: true },
    ];

    const handleDataChange = (field: keyof CreateSpecialtyParams, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.code || !formData.name) return;
        onSave(formData as CreateSpecialtyParams);
    };

    return (
        <FormModal<CreateSpecialtyParams>
            isOpen={isOpen}
            mode={mode}
            titleCreate="Thêm chuyên khoa mới"
            titleEdit="Cập nhật chuyên khoa"
            fields={fields}
            data={formData}
            onDataChange={handleDataChange}
            onClose={onClose}
            onSave={handleSave}
            accentColor="indigo"
            submitLabelCreate="Lưu"
            submitLabelEdit="Cập nhật"
            cancelLabel="Hủy"
        />
    );
};

export default SpecialtyModal;
