"use client"

import { useAuthStore } from "@/store/authStore"
import { useSettingStore } from "@/store/settingStore" // นำเข้า Setting Store
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  FileInput,
  Files,
  Search,
  Settings,
  LogOut,
  Menu,
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

  if (!user) return null

  const menuItems = [
    { name: "ภาพรวม (Dashboard)", icon: LayoutDashboard, href: "/dashboard" },
    { name: "ลงรับหนังสือ", icon: FileInput, href: "/dashboard/receive" },
    { name: "ค้นหาหนังสือ", icon: Search, href: "/dashboard/search" },
    // ซ่อนเมนูตั้งค่าถ้าไม่ใช่ Admin
    ...(user.role === "admin_central"
      ? [{ name: "ตั้งค่าระบบ", icon: Settings, href: "/dashboard/settings" }]
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

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r shadow-sm hidden md:flex flex-col">
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
            {/* 1. เพิ่มคำอธิบายระบบใต้ชื่อ */}
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

          {/* 2. เพิ่มลิขสิทธิ์ใต้ปุ่ม Logout */}
          <div className="mt-4 text-center text-[10px] text-slate-400">
            {settings.copyright || "© 2026 TUNorth"}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-theme-grad">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-6 md:hidden">
          <span className="font-bold text-theme-main">
            {settings.system_name}
          </span>
          <Menu className="w-6 h-6 text-slate-600" />
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
