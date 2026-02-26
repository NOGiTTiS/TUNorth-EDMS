"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home } from "lucide-react"
import { useSettingStore } from "@/store/settingStore"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
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

      <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          เกิดข้อผิดพลาด
        </h1>
        <h2 className="text-lg font-medium text-red-500 mb-4">
          Error 500 : Internal Server Error
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 border border-gray-100 dark:border-zinc-800 p-3 rounded-lg bg-gray-50 dark:bg-zinc-900 text-sm overflow-x-auto text-left break-all">
          {error.message ||
            "ระบบเกิดข้อผิดพลาดบางอย่างที่เซิร์ฟเวอร์ โปรดลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ"}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto"
            style={{ backgroundColor: settings.theme_main_color || "#db2777" }}
          >
            ลองใหม่อีกครั้ง
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
