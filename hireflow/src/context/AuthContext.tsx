import { createContext, useContext, useState, type ReactNode } from "react";
import { login as loginApi, register as registerApi, logout as logoutApi } from "../lib/authApi";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password: string): Promise<boolean> {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginApi({ email, password });
      setUser(response.user);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function register(email: string, password: string, name: string): Promise<boolean> {
    setIsLoading(true);
    setError(null);

    try {
      const response = await registerApi({ email, password, name });
      setUser(response.user);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    setError(null);

    try {
      await logoutApi();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}