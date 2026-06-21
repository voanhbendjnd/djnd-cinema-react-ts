interface BackendErrorShape {
  response?: {
    status?: number;
    data?: {
      error?: string;
      message?: string | Record<string, string>;
    };
  };
}

export const getApiErrorStatus = (error: unknown): number | undefined => {
  return (error as BackendErrorShape).response?.status;
};

export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  const message = (error as BackendErrorShape).response?.data?.message;

  if (typeof message === 'string') {
    return message;
  }

  if (message && typeof message === 'object') {
    return Object.values(message).join('\n');
  }

  return (error as BackendErrorShape).response?.data?.error || fallback;
};
