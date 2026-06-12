import { create } from 'zustand';
import { persist } from 'zustand/middleware';
interface AuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  accessToken: string | null;
  role: string | null;
  setAuth: (accessToken: string, user: IUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      role: null,
      setAuth: (accessToken: string, user: IUser) => {
        // Check role from user object directly
        const role = user?.role || 'ROLE_USER';
        set({ isAuthenticated: true, accessToken, user, role });
      },
      logout: () => set({ isAuthenticated: false, user: null, accessToken: null, role: null }),
    }),
    {
      name: 'cinema-auth-storage', // unique name for localStorage
    }
  )
);
