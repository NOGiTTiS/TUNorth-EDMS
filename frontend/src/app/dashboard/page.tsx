"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, PlusCircle, Edit, Trash2 } from "lucide-react"

// Type สำหรับข้อมูลหนังสือ (ให้ตรงกับ GORM Backend)
interface Document {
  ID: number
  receive_no: string
  receive_date: string
  subject: string
  from: string
  status: string
  file_path: string
  CreatedAt: string // GORM ส่งออกมาเป็น C ตัวใหญ่
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ดึงข้อมูลเมื่อเข้าหน้าเว็บ
  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/api/v1/documents")
      setDocuments(res.data.data)
    } catch (error) {
      console.error("Failed to fetch documents:", error)
      toast.error("ไม่สามารถดึงข้อมูลหนังสือได้")
    } finally {
      setIsLoading(false)
    }
  }

  // ฟังก์ชันลบหนังสือ (CRUD - Delete)
  const handleDelete = async (id: number) => {
    if (
      confirm(
        "คุณแน่ใจหรือไม่ว่าต้องการลบหนังสือฉบับนี้? (ข้อมูลจะถูกซ่อนจากระบบ)",
      )
    ) {
      try {
        await api.delete(`/api/v1/documents/${id}`)
        toast.success("ลบข้อมูลสำเร็จ")
        // อัปเดต State เพื่อเอาแถวนั้นออกจากตารางโดยไม่ต้องรีเฟรชหน้า
        setDocuments((docs) => docs.filter((d) => d.ID !== id))
      } catch (error) {
        toast.error("ไม่สามารถลบข้อมูลได้")
      }
    }
  }

  // ฟังก์ชันแปลงสถานะเป็น Badge สีต่างๆ
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="text-slate-500">
            ร่าง / รอประทับตรา
          </Badge>
        )
      case "pending_director":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200"
          >
            รอ ผอ. สั่งการ
          </Badge>
        )
      case "director_signed":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
          >
            ผอ. สั่งการแล้ว
          </Badge>
        )
      case "distributed":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200"
          >
            แจกจ่ายแล้ว
          </Badge>
        )
      case "sent_to_head":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
          >
            ดำเนินการเสร็จสิ้น
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // ฟังก์ชันเปิดไฟล์ PDF ใน Tab ใหม่ หรือไปหน้า Detail
  const openPdf = (docId: number) => {
    router.push(`/dashboard/documents/${docId}`)
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-theme-main" />
        <p className="text-slate-500 font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            ภาพรวม (Dashboard)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            รายการหนังสือเข้าล่าสุด และสถานะการดำเนินการ
          </p>
        </div>

        {/* ปุ่มลัดสำหรับ Admin (ธุรการกลาง) */}
        {user?.role === "admin_central" && (
          <Button
            className="bg-theme-main hover:bg-theme-main shadow-md shadow-theme-main"
            onClick={() => router.push("/dashboard/receive")}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            ลงรับหนังสือใหม่
          </Button>
        )}
      </div>

      {/* Table Section */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="px-6 py-5 border-b bg-white rounded-t-lg">
          <CardTitle className="text-lg text-slate-800">
            ทะเบียนหนังสือรับ
          </CardTitle>
          <CardDescription>
            แสดงรายการหนังสือเข้าสู่ระบบทั้งหมด เรียงตามล่าสุด
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px] text-center font-semibold text-slate-600">
                    ทะเบียนรับ
                  </TableHead>
                  <TableHead className="w-[120px] font-semibold text-slate-600">
                    วันที่ลงรับ
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600">
                    เรื่อง
                  </TableHead>
                  <TableHead className="w-[180px] font-semibold text-slate-600">
                    จาก
                  </TableHead>
                  <TableHead className="w-[160px] text-center font-semibold text-slate-600">
                    สถานะ
                  </TableHead>
                  <TableHead className="w-[140px] text-center font-semibold text-slate-600">
                    จัดการ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-slate-500 bg-slate-50/50"
                    >
                      ไม่พบข้อมูลหนังสือในระบบ
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow
                      key={doc.ID}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <TableCell className="font-medium text-center text-slate-700">
                        {doc.receive_no}
                      </TableCell>

                      <TableCell className="text-slate-600">
                        {doc.receive_date
                          ? format(new Date(doc.receive_date), "d MMM bb", {
                              locale: th,
                            })
                          : "-"}
                      </TableCell>

                      <TableCell>
                        <div
                          className="font-semibold text-slate-800 line-clamp-2"
                          title={doc.subject}
                        >
                          {doc.subject}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          นำเข้าเมื่อ:{" "}
                          {doc.CreatedAt
                            ? format(
                                new Date(doc.CreatedAt),
                                "d MMM yy HH:mm",
                                { locale: th },
                              )
                            : "-"}
                        </div>
                      </TableCell>

                      <TableCell
                        className="text-slate-600 text-sm truncate max-w-[180px]"
                        title={doc.from}
                      >
                        {doc.from}
                      </TableCell>

                      <TableCell className="text-center">
                        {getStatusBadge(doc.status)}
                      </TableCell>

                      {/* Action Buttons Column */}
                      <TableCell className="text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* 1. ปุ่มดูรายละเอียด (เห็นทุกคน) */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-theme-main hover:text-theme-dark hover:bg-theme-main-light h-8 w-8"
                            title="เปิด/ดำเนินการ"
                            onClick={() => openPdf(doc.ID)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>

                          {/* 2. ปุ่มแก้ไขและลบ (เฉพาะ Admin) */}
                          {user?.role === "admin_central" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-8 w-8"
                                title="แก้ไขข้อมูล"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/documents/${doc.ID}/edit`,
                                  )
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700 hover:bg-red-100 h-8 w-8"
                                title="ลบเอกสาร"
                                onClick={() => handleDelete(doc.ID)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
