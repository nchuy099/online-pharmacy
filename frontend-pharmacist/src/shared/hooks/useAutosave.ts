import { useState, useEffect, useRef } from 'react';

/**
 * useAutosave hook
 * @param key LocalStorage key
 * @param initialValue Initial value if no data is found in LocalStorage
 * @param intervalMs Interval in milliseconds (default 30s)
 */
export function useAutosave<T>(key: string, initialValue: T, intervalMs: number = 30000) {
    // 1. Initialize state with value from localStorage if exists
    const [data, setData] = useState<T>(() => {
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse autosave data', e);
            }
        }
        return initialValue;
    });

    // Use ref to keep track of the latest data without re-triggering the effect frequently
    const dataRef = useRef(data);
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // 2. Set up the interval for autosaving
    useEffect(() => {
        const interval = setInterval(() => {
            localStorage.setItem(key, JSON.stringify(dataRef.current));
            console.log(`[Autosave] Data persisted to ${key} at ${new Date().toLocaleTimeString()}`);
        }, intervalMs);

        return () => {
            // Final save on unmount
            localStorage.setItem(key, JSON.stringify(dataRef.current));
            clearInterval(interval);
        };
    }, [key, intervalMs]);

    // 3. Manual clear function
    const clearAutosave = () => {
        localStorage.removeItem(key);
    };

    return [data, setData, clearAutosave] as const;
}
