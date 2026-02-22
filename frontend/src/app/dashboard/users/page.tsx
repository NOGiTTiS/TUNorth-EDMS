"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, PlusCircle, Users, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"

// ประกาศ Type ให้ตรงกับที่รับมาจาก Backend
interface Department {
  ID: number
  name: string
}

interface User {
  ID: number
  username: string
  full_name: string
  role: string
  position: string
  department_id: number | null
  department?: Department // GORM preload มาให้
}

// ตัวช่วยแปลงชื่อ Role ภาษาอังกฤษเป็นภาษาไทย
const roleMap: Record<string, string> = {
  admin_central: "ธุรการกลาง (Admin)",
  director: "ผู้อำนวยการ",
  deputy: "รองผู้อำนวยการ",
  admin_dept: "ธุรการฝ่าย",
  head: "หัวหน้างาน",
}

export default function UserPage() {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  // State สำหรับฟอร์ม
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "admin_dept", // ค่าเริ่มต้น
    position: "",
    department_id: "0", // เก็บเป็น string เพื่อใช้กับ Select ('0' = ไม่ระบุสังกัด)
  })

  // โหลดข้อมูลเมื่อเปิดหน้า
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [userRes, deptRes] = await Promise.all([
        api.get("/api/v1/users"),
        api.get("/api/v1/departments"),
      ])
      setUsers(userRes.data.data)
      setDepartments(deptRes.data.data)
    } catch (error) {
      toast.error("ไม่สามารถดึงข้อมูลได้")
    } finally {
      setIsLoading(false)
    }
  }

  // เปิด Modal พร้อม Set ข้อมูล
  const handleOpen = (user?: User) => {
    if (user) {
      setEditId(user.ID)
      setFormData({
        username: user.username,
        password: "", // ปล่อยว่างเสมอเวลา Edit เพื่อไม่ให้เผลอเปลี่ยน
        full_name: user.full_name,
        role: user.role,
        position: user.position || "",
        department_id: user.department_id ? user.department_id.toString() : "0",
      })
    } else {
      setEditId(null)
      setFormData({
        username: "",
        password: "",
        full_name: "",
        role: "admin_dept",
        position: "",
        department_id: "0",
      })
    }
    setIsOpen(true)
  }

  // บันทึกข้อมูล
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editId && !formData.password) {
      return toast.error("กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่")
    }

    setIsSaving(true)

    // แปลง department_id ให้ถูกต้องก่อนส่ง (ถ้าเป็น '0' ให้ส่งเป็น null)
    const payload = {
      ...formData,
      department_id:
        formData.department_id === "0"
          ? null
          : parseInt(formData.department_id),
    }

    try {
      if (editId) {
        await api.put(`/api/v1/users/${editId}`, payload)
        toast.success("อัปเดตข้อมูลผู้ใช้งานสำเร็จ")
      } else {
        await api.post("/api/v1/users", payload)
        toast.success("เพิ่มผู้ใช้งานใหม่สำเร็จ")
      }
      setIsOpen(false)
      fetchData() // โหลดตารางใหม่
    } catch (err: any) {
      // ดักจับ Error กรณี Username ซ้ำ
      if (
        err.response?.status === 409 ||
        err.response?.data?.error?.includes("duplicate")
      ) {
        toast.error("ชื่อผู้ใช้งาน (Username) นี้มีในระบบแล้ว")
      } else {
        toast.error("เกิดข้อผิดพลาดในการบันทึก")
      }
    } finally {
      setIsSaving(false)
    }
  }

  // ลบข้อมูล
  const handleDelete = async (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานนี้?")) {
      try {
        await api.delete(`/api/v1/users/${id}`)
        toast.success("ลบผู้ใช้งานสำเร็จ")
        fetchData()
      } catch (error) {
        toast.error("ไม่สามารถลบผู้ใช้งานได้")
      }
    }
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <PageHeader
        title="จัดการข้อมูลผู้ใช้งาน"
        description="เพิ่ม/ลบ/แก้ไข บัญชีผู้ใช้ในระบบทั้งหมด"
        icon={Users}
      >
        <Button
          onClick={() => handleOpen()}
          className="bg-theme-main hover:bg-theme-main shadow-md h-12 px-6"
        >
          <PlusCircle className="mr-2 w-5 h-5" /> เพิ่มผู้ใช้ใหม่
        </Button>
      </PageHeader>

      {/* Table */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>ชื่อ - นามสกุล</TableHead>
                  <TableHead>ชื่อบัญชี (Username)</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead>สังกัดฝ่าย</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-slate-500"
                    >
                      <Loader2 className="animate-spin w-6 h-6 mx-auto mb-2 text-theme-main" />{" "}
                      กำลังโหลดข้อมูล...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-slate-500"
                    >
                      ไม่พบข้อมูลผู้ใช้งาน
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.ID} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="font-semibold text-slate-800">
                          {u.full_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {u.position || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {u.username}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 border-blue-200 font-normal"
                        >
                          {roleMap[u.role] || u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {u.department?.name || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpen(u)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(u.ID)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal เพิ่ม/แก้ไข */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-theme-main">
              {editId ? "แก้ไขข้อมูลผู้ใช้งาน" : "เพิ่มบัญชีผู้ใช้ใหม่"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ชื่อผู้ใช้ (Username) *</Label>
                <Input
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  disabled={!!editId}
                  className={editId ? "bg-slate-100" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  รหัสผ่าน {editId ? "(ปล่อยว่างถ้าไม่เปลี่ยน)" : "*"}
                </Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={editId ? "••••••••" : ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>ชื่อ - นามสกุล *</Label>
              <Input
                required
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>ตำแหน่ง (ตัวอย่าง: เจ้าหน้าที่ธุรการ)</Label>
              <Input
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>บทบาท (Role) *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_central">ธุรการกลาง</SelectItem>
                    <SelectItem value="director">ผู้อำนวยการ</SelectItem>
                    <SelectItem value="deputy">รองผู้อำนวยการ</SelectItem>
                    <SelectItem value="admin_dept">ธุรการฝ่าย</SelectItem>
                    <SelectItem value="head">หัวหน้างาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>สังกัดฝ่าย (ถ้ามี)</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(v) =>
                    setFormData({ ...formData, department_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกฝ่าย" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">- ไม่ระบุสังกัด -</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.ID} value={d.ID.toString()}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-theme-main hover:brightness-90 h-12 mt-4"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : null}
              {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
