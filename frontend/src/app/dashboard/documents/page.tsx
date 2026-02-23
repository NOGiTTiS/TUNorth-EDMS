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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Loader2,
  PlusCircle,
  Edit,
  Trash2,
  LayoutDashboard,
  Search,
  FilterX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"

interface Document {
  ID: number
  receive_no: string
  receive_date: string
  subject: string
  from: string
  status: string
  file_path: string
  CreatedAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // --- States ---
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [year, setYear] = useState("0")
  const [month, setMonth] = useState("0")
  
  // Pagination States
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15) // เพิ่ม State สำหรับ Limit (Default 15)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // State สำหรับ Input กระโดดไปหน้า (เพื่อให้พิมพ์เลขได้ก่อนกด Enter)
  const [jumpPage, setJumpPage] = useState("1")

  const currentYear = new Date().getFullYear()
  
  // กำหนดปี ค.ศ. ที่เริ่มใช้ระบบ (เช่นปีนี้ 2026)
  const startSystemYear = 2026
  
  // คำนวณระยะห่างปีปัจจุบัน กับ ปีเริ่มต้น (+1 เพื่อให้นับปีปัจจุบันด้วย)
  const yearsRange = currentYear - startSystemYear + 1
  
  // สร้าง Array ตั้งแต่ปีปัจจุบัน ย้อนไปหาปีเริ่มต้น
  const yearOptions = Array.from({ length: yearsRange }, (_, i) => currentYear - i)

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
      setJumpPage("1")
    }, 500)
    return () => clearTimeout(handler)
  }, [search])

  // Fetch Data เมื่อเงื่อนไขเปลี่ยน (รวมถึง limit)
  useEffect(() => {
    fetchDocuments()
  }, [debouncedSearch, year, month, page, limit])

  // Sync jumpPage input กับ page จริง
  useEffect(() => {
    setJumpPage(page.toString())
  }, [page])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const res = await api.get("/api/v1/documents", {
        params: {
          search: debouncedSearch,
          year: year,
          month: month,
          page: page,
          limit: limit, // ส่ง Limit ที่เลือกไป
        },
      })
      setDocuments(res.data.data)
      setTotalPages(res.data.total_pages)
      setTotalItems(res.data.total)
    } catch (error) {
      console.error("Failed to fetch documents:", error)
      toast.error("ไม่สามารถดึงข้อมูลหนังสือได้")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetFilter = () => {
    setSearch("")
    setDebouncedSearch("")
    setYear("0")
    setMonth("0")
    setPage(1)
    setJumpPage("1")
  }

  const handleDelete = async (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบหนังสือฉบับนี้?")) {
      try {
        await api.delete(`/api/v1/documents/${id}`)
        toast.success("ลบข้อมูลสำเร็จ")
        fetchDocuments()
      } catch (error) {
        toast.error("ไม่สามารถลบข้อมูลได้")
      }
    }
  }

  // ฟังก์ชันกระโดดไปหน้าที่ต้องการ
  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        let p = parseInt(jumpPage)
        if (isNaN(p)) p = 1
        // ป้องกันเลขเกินขอบเขต
        p = Math.max(1, Math.min(p, totalPages))
        setPage(p)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="outline" className="text-slate-500">ร่าง</Badge>
      case "pending_director": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">รอ ผอ. สั่งการ</Badge>
      case "director_signed": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">ผอ. สั่งการแล้ว</Badge>
      case "distributed": return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">ส่งต่อแล้ว</Badge>
      case "sent_to_head": return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">เสร็จสิ้น</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const openPdf = (docId: number) => {
    router.push(`/dashboard/documents/${docId}`)
  }

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto">
      <PageHeader
        title="ภาพรวม (Dashboard)"
        description={`รายการหนังสือเข้าล่าสุด (ทั้งหมด ${totalItems} รายการ)`}
        icon={LayoutDashboard}
      >
        {user?.role === "admin_central" && (
          <Button
            className="bg-theme-main hover:bg-theme-main shadow-md h-12 px-6"
            onClick={() => router.push("/dashboard/receive")}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            ลงรับหนังสือใหม่
          </Button>
        )}
      </PageHeader>

      {/* Filter Section */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหา เรื่อง, เลขรับ, จากหน่วยงาน..."
              className="pl-9 bg-slate-50 focus-visible:ring-theme-main"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={month} onValueChange={(v) => { setMonth(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] bg-slate-50"><SelectValue placeholder="เดือน" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">- ทุกเดือน -</SelectItem>
                <SelectItem value="1">มกราคม</SelectItem><SelectItem value="2">กุมภาพันธ์</SelectItem>
                <SelectItem value="3">มีนาคม</SelectItem><SelectItem value="4">เมษายน</SelectItem>
                <SelectItem value="5">พฤษภาคม</SelectItem><SelectItem value="6">มิถุนายน</SelectItem>
                <SelectItem value="7">กรกฎาคม</SelectItem><SelectItem value="8">สิงหาคม</SelectItem>
                <SelectItem value="9">กันยายน</SelectItem><SelectItem value="10">ตุลาคม</SelectItem>
                <SelectItem value="11">พฤศจิกายน</SelectItem><SelectItem value="12">ธันวาคม</SelectItem>
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={(v) => { setYear(v); setPage(1); }}>
              <SelectTrigger className="w-[120px] bg-slate-50"><SelectValue placeholder="ปี" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">- ทุกปี -</SelectItem>
                {yearOptions.map((y) => <SelectItem key={y} value={y.toString()}>{y + 543}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleResetFilter} title="ล้างตัวกรอง" className="px-3 text-slate-500 hover:text-theme-main">
              <FilterX className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0 bg-white">
          <div className="overflow-x-auto min-h-[400px]">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px] text-center">ทะเบียนรับ</TableHead>
                  <TableHead className="w-[120px]">วันที่ลงรับ</TableHead>
                  <TableHead>เรื่อง</TableHead>
                  <TableHead className="w-[180px]">จาก</TableHead>
                  <TableHead className="w-[160px] text-center">สถานะ</TableHead>
                  <TableHead className="w-[120px] text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-theme-main" /> กำลังดึงข้อมูล...</TableCell></TableRow>
                ) : documents.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">ไม่พบข้อมูลหนังสือ</TableCell></TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.ID} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-medium text-center text-slate-700">{doc.receive_no}</TableCell>
                      <TableCell className="text-slate-600">{doc.receive_date ? format(new Date(doc.receive_date), "d MMM yy", { locale: th }) : "-"}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-800 line-clamp-2">{doc.subject}</div>
                        <div className="text-[11px] text-slate-400 mt-1">ที่: {doc.receive_no}</div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm truncate max-w-[180px]">{doc.from}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="text-theme-main hover:bg-theme-main-light" onClick={() => openPdf(doc.ID)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          {user?.role === "admin_central" && (
                            <>
                              <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-100" onClick={() => router.push(`/dashboard/documents/${doc.ID}/edit`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-100" onClick={() => handleDelete(doc.ID)}>
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

        {/* --- Advanced Pagination Footer --- */}
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t bg-slate-50/50 rounded-b-lg gap-4">
          
          {/* ส่วนซ้าย: เลือกจำนวนต่อหน้า */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>แสดง</span>
            <Select 
                value={limit.toString()} 
                onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}
            >
                <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={limit} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                </SelectContent>
            </Select>
            <span>รายการ/หน้า</span>
          </div>

          {/* ส่วนขวา: ควบคุมหน้า */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 mr-2">
                หน้า {page} จาก {totalPages}
            </span>
            
            <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(1)} disabled={page <= 1 || isLoading}>
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || isLoading}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* ช่องกรอกเลขหน้าเพื่อกระโดด */}
                <div className="w-[50px] mx-1">
                    <Input 
                        className="h-8 text-center px-1" 
                        value={jumpPage} 
                        onChange={(e) => setJumpPage(e.target.value)}
                        onKeyDown={handlePageInput}
                        disabled={isLoading}
                    />
                </div>

                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isLoading}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(totalPages)} disabled={page >= totalPages || isLoading}>
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}