"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSettingStore } from "@/store/settingStore"

export default function NotFound() {
  const router = useRouter()
  const settings = useSettingStore((state) => state.settings)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 p-6 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${settings.theme_bg_gradient_start || "#fdf2f8"} 0%, ${settings.theme_bg_gradient_end || "#ffffff"} 100%)`,
      }}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 p-32 opacity-10 blur-3xl rounded-full"
        style={{ backgroundColor: settings.theme_main_color || "#db2777" }}
      ></div>
      <div
        className="absolute bottom-0 left-0 p-32 opacity-10 blur-3xl rounded-full"
        style={{ backgroundColor: settings.theme_main_color || "#db2777" }}
      ></div>

      <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-xl p-8 md:p-12 max-w-lg w-full text-center">
        <div
          className="mx-auto w-24 h-24 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center mb-6"
          style={{ backgroundColor: `${settings.theme_main_color}15` }}
        >
          <FileQuestion
            className="w-12 h-12"
            style={{ color: settings.theme_main_color || "#db2777" }}
          />
        </div>

        <h1
          className="text-6xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter"
          style={{ color: settings.theme_main_color || "#db2777" }}
        >
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          ไม่พบหน้าที่คุณต้องการ
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          หน้าเว็บที่คุณกำลังพยายามเข้าถึงอาจถูกลบ ย้าย หรือไม่มีอยู่ในระบบ
          กรุณาตรวจสอบ URL อีกครั้ง
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ย้อนกลับ
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              className="w-full"
              style={{
                backgroundColor: settings.theme_main_color || "#db2777",
              }}
            >
              <Home className="w-4 h-4 mr-2" />
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
