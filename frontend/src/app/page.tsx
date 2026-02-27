"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/authStore"
import { useSettingStore } from "@/store/settingStore"
import api from "@/lib/api"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LockKeyhole, User, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, user, _hasHydrated } = useAuthStore()
  const { settings } = useSettingStore()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // ถ้าล็อกอินอยู่แล้ว ให้เด้งไปหน้า Dashboard
  useEffect(() => {
    if (_hasHydrated && user) {
      router.push("/dashboard")
    }
  }, [_hasHydrated, user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await api.post("/api/v1/login", { username, password })
      const token = res.data.token

      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
          })
          .join(""),
      )
      const userData = JSON.parse(jsonPayload)

      login(token, {
        user_id: userData.user_id,
        username: userData.username,
        role: userData.role,
        full_name: userData.full_name,
        dept_id: userData.dept_id,
      })

      toast.success("เข้าสู่ระบบสำเร็จ")
      router.push("/dashboard")
    } catch (error: any) {
      toast.error("เข้าสู่ระบบไม่สำเร็จ", {
        description: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // --- แก้ไขฟังก์ชันนี้: จัดการ Path ให้รองรับ Windows ---
  const getImageUrl = (path: string) => {
    if (!path) return ""
    let cleanPath = path.replace(/\\/g, "/") // เปลี่ยน Backslash เป็น Slash
    if (cleanPath.startsWith("/loads")) {
      cleanPath = cleanPath.replace("/loads", "/uploads") // แก้ loads เป็น uploads (ถ้ามี)
    }
    return `${process.env.NEXT_PUBLIC_API_URL}${cleanPath}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-grad p-4 sm:p-8">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-theme-main bg-white/95 backdrop-blur-sm overflow-hidden">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {settings.logo_url ? (
              <img
                src={getImageUrl(settings.logo_url)}
                alt="System Logo"
                className="h-16 sm:h-24 w-auto object-contain drop-shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-theme-main rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-lg">
                {settings.system_name?.charAt(0) || "T"}
              </div>
            )}
          </div>

          <CardTitle className="text-2xl font-bold text-theme-main">
            {settings.system_name || "TUNorth EDMS"}
          </CardTitle>

          <CardDescription className="text-slate-500 mt-2">
            {settings.system_description || "ระบบสารบรรณอิเล็กทรอนิกส์"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้งาน</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="username"
                  placeholder="admin"
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pb-8">
            <Button
              type="submit"
              className="w-full bg-theme-main text-white hover:brightness-90 transition-all shadow-md h-12 mt-6 text-md font-medium border-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "เข้าสู่ระบบ"
              )}
            </Button>

            <div className="text-sm text-slate-500 text-center mt-1">
              ยังไม่มีบัญชีใช่หรือไม่?{" "}
              <Link
                href="/register"
                className="text-theme-main hover:underline font-semibold"
              >
                สมัครสมาชิก
              </Link>
            </div>

            <p className="text-xs text-slate-400 text-center mt-2">
              {settings.copyright || "© 2026 TUNorth"}
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
