import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chat.service';
import type { HealthProfile } from '../types/domain';

const INITIAL_PROFILE: HealthProfile = {
    fullName: "",
    yearOfBirth: null,
    gender: "",
    weight: null,
    height: null,
    underlyingDiseases: "",
    drugAllergies: "",
    currentMedications: "",
    smoking: "",
    alcohol: "",
};

export const useHealthProfile = () => {
    const [profile, setProfile] = useState<HealthProfile>(INITIAL_PROFILE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const data = await chatService.getHealthProfile();
                if (data) setProfile(data);
            } catch (err) {
                console.error("Failed to fetch health profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const updateField = useCallback((field: keyof HealthProfile, value: string | number | null) => {
        setProfile(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    }, []);

    const saveProfile = useCallback(async () => {
        setSaving(true);
        try {
            await chatService.saveHealthProfile(profile);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error("Save failed", err);
        } finally {
            setSaving(false);
        }
    }, [profile]);

    return {
        profile,
        loading,
        saving,
        saved,
        updateField,
        saveProfile,
    };
};
