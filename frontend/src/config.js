export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://tokicard.suijackbet.fun/api';

export const IS_PRODUCTION = import.meta.env.MODE === 'production';

