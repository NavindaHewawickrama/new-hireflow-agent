// Base API configuration and fetch wrapper
// Centralizes API endpoint configuration and common fetch options

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7102/api";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  response?: unknown;

  constructor(
    message: string,
    statusCode: number,
    response?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Base fetch wrapper with error handling and common configuration
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get token from localStorage
  const token = localStorage.getItem("token");

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      let errorResponse: unknown;

      try {
        errorResponse = await response.json();
        if (errorResponse && typeof errorResponse === "object" && "message" in errorResponse) {
          errorMessage = (errorResponse as { message: string }).message;
        }
      } catch {
        // If response is not JSON, use default error message
      }

      throw new ApiError(errorMessage, response.status, errorResponse);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error or other fetch errors
    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed",
      0
    );
  }
}

export { apiFetch, API_BASE_URL };