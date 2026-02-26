"use client"

import { useAuthStore } from "@/store/authStore"
import { useSettingStore } from "@/store/settingStore"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  FileInput,
  Search,
  Settings,
  LogOut,
  Menu,
  UserCircle,
  Users,
  Network,
  BookOpen,
  BookMarked,
  BarChartBig,
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
  const [isChecking, setIsChecking] = useState(true)

  // ตรวจสอบสิทธิ์การเข้าถึง หากไม่มี user ให้เด้งกลับไปหน้า Login
  useEffect(() => {
    if (!user) {
      router.push("/")
    } else {
      setIsChecking(false)
    }
  }, [user, router])

  // ซ่อนหน้าเปล่าๆ ระหว่างรอเช็ค
  if (!user || isChecking) return null

  // จัดการรายการเมนูตามสิทธิ์ (Role)
  const menuItems = [
    // 1. เมนูพื้นฐาน (เห็นทุกคน)
    { name: "ภาพรวม (Dashboard)", icon: LayoutDashboard, href: "/dashboard" },
    { name: "ทะเบียนหนังสือ", icon: BookOpen, href: "/dashboard/documents" },

    // 2. เมนูเฉพาะ ธุรการกลาง (ลงรับหนังสือ)
    ...(user.role === "admin_central"
      ? [{ name: "ลงรับหนังสือ", icon: FileInput, href: "/dashboard/receive" }]
      : []),

    // 3. ค้นหา (เห็นทุกคน)
    { name: "ค้นหาหนังสือ", icon: Search, href: "/dashboard/search" },

    // 4. รายงาน (แยกตาม Role)
    // - รายงานสรุป (ผู้บริหารระดับสูง + ธุรการกลาง)
    ...(["admin_central", "director"].includes(user.role)
      ? [
          { name: "รายงานสรุป", icon: BarChartBig, href: "/dashboard/reports" },
          ...(user.role === "admin_central"
            ? [
                {
                  name: "รายงานสมุดทะเบียนรับ",
                  icon: BookMarked,
                  href: "/dashboard/reports/logbook",
                },
              ]
            : []),
        ]
      : []),

    // - รายงานฝ่าย (ธุรการฝ่าย + รองฯ)
    ...(["admin_dept", "deputy"].includes(user.role)
      ? [
          {
            name: "รายงานฝ่าย",
            icon: BarChartBig,
            href: "/dashboard/reports/department",
          },
        ]
      : []),

    // 5. โปรไฟล์ (เห็นทุกคน)
    { name: "โปรไฟล์ส่วนตัว", icon: UserCircle, href: "/dashboard/profile" },

    // 6. ตั้งค่าระบบ (เฉพาะ Admin)
    ...(user.role === "admin_central"
      ? [
          { name: "จัดการฝ่าย", icon: Network, href: "/dashboard/departments" },
          { name: "จัดการผู้ใช้", icon: Users, href: "/dashboard/users" },
          { name: "ตั้งค่าระบบ", icon: Settings, href: "/dashboard/settings" },
        ]
      : []),
  ]

  // ฟังก์ชันจัดการ URL รูปภาพ (แก้ Path Windows)
  const getImageUrl = (path: string) => {
    if (!path) return ""
    let cleanPath = path.replace(/\\/g, "/")
    if (cleanPath.startsWith("/loads")) {
      cleanPath = cleanPath.replace("/loads", "/uploads")
    }
    return `${process.env.NEXT_PUBLIC_API_URL}${cleanPath}`
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r shadow-sm hidden md:flex flex-col print:hidden">
        {/* ส่วนหัว Sidebar */}
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

        {/* รายการเมนู */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-all duration-200",
                    !isActive &&
                      "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700",
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: `${settings.theme_main_color || "#db2777"}1A`, // Opacity 10%
                          color: settings.theme_main_color || "#db2777",
                          borderRight: `3px solid ${settings.theme_main_color || "#db2777"}`,
                        }
                      : {}
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* ส่วนท้าย (User Info) */}
        <div className="p-4 border-t bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border border-slate-300 overflow-hidden">
              {/* ถ้ามีรูปโปรไฟล์ user ใส่ตรงนี้ได้ แต่ตอนนี้ใช้ตัวอักษรย่อ */}
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-slate-800">
                {user.full_name}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
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
      </aside>

      {/* Main Content Area */}
      {/* เพิ่ม print:overflow-visible และ print:block เพื่อแก้ปัญหาพิมพ์หน้า Logbook */}
      <main className="flex-1 overflow-y-auto print:overflow-visible print:block bg-slate-50">
        {/* Mobile Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b flex items-center justify-between px-6 md:hidden print:hidden">
          <span className="font-bold text-theme-main">
            {settings.system_name}
          </span>
          <Menu className="w-6 h-6 text-slate-600" />
        </header>

        <div className="p-6 print:p-0">{children}</div>
      </main>
    </div>
  )
}
