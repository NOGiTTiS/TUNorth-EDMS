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
import { Edit, Trash2, PlusCircle, Building2 } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    telegram_chat_id: "",
  })

  useEffect(() => {
    fetchDepts()
  }, [])
  const fetchDepts = async () => {
    const res = await api.get("/api/v1/departments")
    setDepartments(res.data.data)
  }

  const handleOpen = (dept?: any) => {
    if (dept) {
      setEditId(dept.ID)
      setFormData({
        name: dept.name,
        code: dept.code,
        telegram_chat_id: dept.telegram_chat_id,
      })
    } else {
      setEditId(null)
      setFormData({ name: "", code: "", telegram_chat_id: "" })
    }
    setIsOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editId) {
        await api.put(`/api/v1/departments/${editId}`, formData)
        toast.success("อัปเดตฝ่ายสำเร็จ")
      } else {
        await api.post("/api/v1/departments", formData)
        toast.success("เพิ่มฝ่ายสำเร็จ")
      }
      setIsOpen(false)
      fetchDepts()
    } catch (err) {
      toast.error("เกิดข้อผิดพลาด")
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("ยืนยันการลบฝ่าย?")) {
      await api.delete(`/api/v1/departments/${id}`)
      fetchDepts()
    }
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <PageHeader
        title="จัดการข้อมูลฝ่าย"
        description="ตั้งค่าข้อมูลฝ่ายและกลุ่มงานภายในโรงเรียน"
        icon={Building2}
      >
        <Button
          onClick={() => handleOpen()}
          className="bg-theme-main hover:bg-theme-main shadow-md h-12 px-6"
        >
          <PlusCircle className="mr-2 w-5 h-5" /> เพิ่มฝ่ายใหม่
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อฝ่าย</TableHead>
                <TableHead>Telegram Chat ID</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.ID}>
                  <TableCell>{d.code}</TableCell>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>{d.telegram_chat_id || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpen(d)}
                    >
                      <Edit className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(d.ID)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? "แก้ไขข้อมูลฝ่าย" : "เพิ่มฝ่ายใหม่"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>ชื่อฝ่าย</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>รหัสฝ่าย (ถ้ามี)</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Telegram Chat ID (สำหรับแจ้งเตือน)</Label>
              <Input
                value={formData.telegram_chat_id}
                onChange={(e) =>
                  setFormData({ ...formData, telegram_chat_id: e.target.value })
                }
              />
            </div>
            <Button type="submit" className="w-full bg-theme-main">
              บันทึกข้อมูล
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
