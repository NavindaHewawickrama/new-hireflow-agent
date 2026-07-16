import { createContext, useContext, useState, type ReactNode } from "react";

interface User {
  email: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (email: string, password: string, name: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Dummy credentials for testing
const DUMMY_USERS = [
  { email: "admin@hireflow.com", password: "admin123", name: "Admin User" },
  { email: "recruiter@hireflow.com", password: "recruit123", name: "Recruiter" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  function login(email: string, password: string): boolean {
    const foundUser = DUMMY_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (foundUser) {
      setUser({ email: foundUser.email, name: foundUser.name });
      return true;
    }
    return false;
  }

  function register(email: string, password: string, name: string): boolean {
    // Check if user already exists
    const exists = DUMMY_USERS.some((u) => u.email === email);
    if (exists) {
      return false;
    }
    // Add new user (in a real app, this would be an API call)
    DUMMY_USERS.push({ email, password, name });
    setUser({ email, name });
    return true;
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}