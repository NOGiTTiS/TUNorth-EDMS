"use client"

import { useAuthStore } from "@/store/authStore"
import { useSettingStore } from "@/store/settingStore" // นำเข้า Setting Store
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  FileInput,
  Files,
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle,
  Users,
  Network,
  BookOpen,
  BarChartBig,
  BookMarked,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuthStore()
  const { settings } = useSettingStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // ปิดเมนูเมื่อเปลี่ยนหน้าบนมือถือ
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  if (!user) return null

  const menuItems = [
    { name: "ภาพรวม (Dashboard)", icon: LayoutDashboard, href: "/dashboard" },
    { name: "ทะเบียนหนังสือ", icon: BookOpen, href: "/dashboard/documents" },
    { name: "โปรไฟล์ส่วนตัว", icon: UserCircle, href: "/dashboard/profile" },

    // เฉพาะ Admin
    ...(user.role === "admin_central"
      ? [
          { name: "ลงรับหนังสือ", icon: FileInput, href: "/dashboard/receive" },
          { name: "จัดการฝ่าย", icon: Network, href: "/dashboard/departments" },
          { name: "จัดการผู้ใช้", icon: Users, href: "/dashboard/users" },
          { name: "ตั้งค่าระบบ", icon: Settings, href: "/dashboard/settings" },
          { name: "รายงานสรุป", icon: BarChartBig, href: "/dashboard/reports" },
          {
            name: "รายงานหนังสือรับ",
            icon: BookMarked,
            href: "/dashboard/reports/logbook",
          },
        ]
      : []),
  ]

  // ฟังก์ชันช่วยจัดการ URL และแก้ปัญหา Path เก่าที่พังจาก Windows (\loads)
  const getImageUrl = (path: string) => {
    if (!path) return ""
    let cleanPath = path.replace(/\\/g, "/") // เปลี่ยน \ เป็น /
    if (cleanPath.startsWith("/loads")) {
      cleanPath = cleanPath.replace("/loads", "/uploads") // แก้ loads เป็น uploads
    }
    return `${process.env.NEXT_PUBLIC_API_URL}${cleanPath}`
  }

  const SidebarContent = () => (
    <>
      {/* ส่วนหัว Sidebar (Logo & ชื่อ & คำอธิบาย) */}
      <div className="p-6 border-b flex flex-col items-center gap-3 text-center">
        {settings.logo_url ? (
          <img
            src={getImageUrl(settings.logo_url)}
            alt="Logo"
            className="h-16 object-contain drop-shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 bg-theme-main rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
            {settings.system_name?.charAt(0) || "T"}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="font-bold text-md text-theme-main line-clamp-2 leading-tight">
            {settings.system_name || "TUNorth EDMS"}
          </span>
          <span className="text-xs text-slate-500 line-clamp-2">
            {settings.system_description || "ระบบสารบรรณอิเล็กทรอนิกส์"}
          </span>
        </div>
      </div>

      {/* เมนู */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-theme-main-light text-theme-main border-r-4 border-theme-main shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700",
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ส่วนท้าย (User & Logout & Copyright) */}
      <div className="p-4 border-t bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border border-slate-300">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate text-slate-800">
              {user.full_name}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user.role === "admin_central"
                ? "ธุรการกลาง"
                : user.role === "director"
                  ? "ผู้อำนวยการ"
                  : user.role === "deputy"
                    ? "รอง ผอ."
                    : user.role === "admin_dept"
                      ? "ธุรการฝ่าย"
                      : user.role === "head"
                        ? "หัวหน้างาน"
                        : user.role}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
          onClick={() => {
            logout()
            router.push("/")
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          ออกจากระบบ
        </Button>

        <div className="mt-4 text-center text-[10px] text-slate-400">
          {settings.copyright || "© 2026 TUNorth"}
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen print:h-auto bg-slate-50 dark:bg-slate-900 relative overflow-hidden print:overflow-visible">
      {/* Mobile Sidebar Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 w-72 bg-white z-50 transition-transform duration-300 md:hidden flex flex-col shadow-2xl print:hidden",
          isMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="absolute right-4 top-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(false)}
          >
            <X className="w-6 h-6 text-slate-400" />
          </Button>
        </div>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r shadow-sm hidden md:flex flex-col print:hidden">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto print:overflow-visible bg-theme-grad print:bg-white">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-6 md:hidden sticky top-0 z-30 print:hidden">
          <span className="font-bold text-theme-main truncate mr-4">
            {settings.system_name || "TUNorth EDMS"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </Button>
        </header>
        <div className="p-4 md:p-6 print:p-0">{children}</div>
      </main>
    </div>
  )
}
