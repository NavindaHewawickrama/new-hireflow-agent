// Authentication API service
// Handles login, register, and logout API calls

import { apiFetch } from "./api";
import type { User } from "../types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

/**
 * Login user with email and password
 * @param credentials - Email and password
 * @returns User data on success
 * @throws ApiError on failure
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

/**
 * Register a new user
 * @param userData - Email, password, and name
 * @returns User data on success
 * @throws ApiError on failure
 */
export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

/**
 * Logout user (invalidate token if applicable)
 * @throws ApiError on failure
 */
export async function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", {
    method: "POST",
  });
}

/**
 * Get current user profile
 * @returns User data on success
 * @throws ApiError on failure
 */
export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>("/auth/me");
}