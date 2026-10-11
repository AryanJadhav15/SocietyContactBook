export const formatContactCode = (value) => `CNT-${String(value).padStart(6, '0')}`;
