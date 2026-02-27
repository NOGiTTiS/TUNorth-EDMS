import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  user_id: number
  username: string
  role: string
  full_name: string
  dept_id: number
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  login: (token: string, user: User) => void
  logout: () => void
}

// สร้าง Store พร้อมระบบ Persist (บันทึกลงเครื่อง)
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => {
        localStorage.removeItem("auth-storage") // ลบข้อมูลออกจากเครื่อง
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    {
      name: "auth-storage", // ชื่อ key ใน LocalStorage
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true)
      },
    },
  ),
)
