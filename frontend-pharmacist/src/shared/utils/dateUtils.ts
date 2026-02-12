export const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    // Expected dateStr format: YYYY-MM-DD (from input type="date")
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
};

export const parseDate = (displayDate: string): string => {
    if (!displayDate) return '';
    const parts = displayDate.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
};
