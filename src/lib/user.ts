const DEFAULT_EMAIL = 'ojan@dompet.app';

/**
 * Hook untuk mendapatkan user context (Client Side)
 */
export function useUser() {
  return {
    user: {
      id: 'default-user-id',
      email: DEFAULT_EMAIL,
      name: 'Ojan',
    },
    isLoading: false,
  };
}