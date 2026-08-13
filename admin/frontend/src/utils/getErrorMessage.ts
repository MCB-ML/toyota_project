import { AxiosError } from "axios";

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as any;
    // Backend format: { code, message, detail }
    // Prioritize 'detail' as it's more specific
    if (Array.isArray(data.detail)) {
      return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
    }
    if (typeof data.detail === "object" && data.detail !== null) {
      return JSON.stringify(data.detail);
    }
    return data.detail || data.message || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
};
