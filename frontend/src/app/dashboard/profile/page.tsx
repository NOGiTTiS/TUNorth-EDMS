"use client"
import { useState } from "react"
import api from "@/lib/api"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { UserCircle, Save, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"

// ตัวช่วยแปลงชื่อ Role ภาษาอังกฤษเป็นภาษาไทย
const roleMap: Record<string, string> = {
  admin_central: "ธุรการกลาง (Admin)",
  director: "ผู้อำนวยการ",
  deputy: "รองผู้อำนวยการ",
  admin_dept: "ธุรการฝ่าย",
  head: "หัวหน้างาน",
}

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    password: "",
    confirm_password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirm_password) {
      return toast.error("รหัสผ่านยืนยันไม่ตรงกัน")
    }

    setIsLoading(true)
    try {
      await api.put(`/api/v1/profile/${user?.user_id}`, {
        full_name: formData.full_name,
        password: formData.password,
      })
      toast.success("อัปเดตโปรไฟล์สำเร็จ (กรุณาเข้าระบบใหม่)")
      if (formData.password) logout() // ถ้ารีเซ็ตรหัสผ่าน ให้บังคับล็อกอินใหม่
    } catch (err) {
      toast.error("อัปเดตโปรไฟล์ไม่สำเร็จ")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pt-10 pb-20">
      <PageHeader
        title="โปรไฟล์ส่วนตัว"
        description="จัดการข้อมูลส่วนตัวและรหัสผ่านของคุณ"
        icon={UserCircle}
      />
      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-theme-main">ข้อมูลผู้ใช้งาน</CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อเข้าใช้งาน (Username)</Label>
              <Input
                value={user?.username || ""}
                disabled
                className="bg-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label>บทบาท (Role)</Label>
              {/* เปลี่ยนให้ดึงภาษาไทยจาก roleMap มาแสดง */}
              <Input
                value={user?.role ? roleMap[user.role] || user.role : ""}
                disabled
                className="bg-slate-100 text-theme-main font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label>ชื่อ - นามสกุล</Label>
              <Input
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
              />
            </div>
            <hr className="my-4" />
            <div className="space-y-2">
              <Label>รหัสผ่านใหม่ (ปล่อยว่างถ้าไม่ต้องการเปลี่ยน)</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>ยืนยันรหัสผ่านใหม่</Label>
              <Input
                type="password"
                value={formData.confirm_password}
                onChange={(e) =>
                  setFormData({ ...formData, confirm_password: e.target.value })
                }
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-theme-main hover:brightness-90"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              บันทึกข้อมูล
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
