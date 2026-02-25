"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  doc_no: string
  doc_date: string
  subject: string
  from: string
  status: string
  file_path: string
  CreatedAt: string
}

export default function SearchPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Search States
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [year, setYear] = useState("0")
  const [month, setMonth] = useState("0")

  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [jumpPage, setJumpPage] = useState("1")

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i)

  // Debounce Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
      setJumpPage("1")
    }, 500)
    return () => clearTimeout(handler)
  }, [search])

  // Fetch Data
  useEffect(() => {
    fetchDocuments()
  }, [debouncedSearch, year, month, page, limit])

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
          limit: limit,
        },
      })
      setDocuments(res.data.data)
      setTotalPages(res.data.total_pages)
      setTotalItems(res.data.total)
    } catch (error) {
      console.error(error)
      toast.error("ไม่สามารถค้นหาข้อมูลได้")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSearch("")
    setYear("0")
    setMonth("0")
    setPage(1)
    setJumpPage("1")
  }

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      let p = parseInt(jumpPage)
      if (isNaN(p)) p = 1
      p = Math.max(1, Math.min(p, totalPages))
      setPage(p)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="text-slate-500 bg-slate-50">
            ร่าง / รอประทับตรา
          </Badge>
        )
      case "pending_director":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 border-yellow-200"
          >
            รอ ผอ. สั่งการ
          </Badge>
        )
      case "director_signed":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 border-blue-200"
          >
            ผอ. สั่งการแล้ว
          </Badge>
        )
      case "distributed":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-800 border-purple-200"
          >
            ถึงฝ่ายรับผิดชอบ
          </Badge>
        )
      case "pending_deputy":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-800 border-orange-200"
          >
            รอ รองฯ สั่งการ
          </Badge>
        )
      case "deputy_signed":
        return (
          <Badge
            variant="secondary"
            className="bg-cyan-100 text-cyan-800 border-cyan-200"
          >
            รองฯ สั่งการแล้ว
          </Badge>
        )
      case "sent_to_head":
        return (
          <Badge
            variant="secondary"
            className="bg-indigo-100 text-indigo-800 border-indigo-200"
          >
            ส่งหัวหน้างาน
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            ดำเนินการเสร็จสิ้น
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="ค้นหาหนังสือ"
        description={`สืบค้นเอกสารย้อนหลังและติดตามสถานะหนังสือ (พบ ${totalItems} รายการ)`}
        icon={Search}
      />

      {/* Filter Section */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="พิมพ์คำค้นหา... เรื่อง, เลขรับ, จากหน่วยงาน..."
              className="pl-9 bg-slate-50 focus-visible:ring-theme-main"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select
              value={month}
              onValueChange={(v) => {
                setMonth(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[140px] bg-slate-50">
                <SelectValue placeholder="เดือน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">- ทุกเดือน -</SelectItem>
                {[
                  "มกราคม",
                  "กุมภาพันธ์",
                  "มีนาคม",
                  "เมษายน",
                  "พฤษภาคม",
                  "มิถุนายน",
                  "กรกฎาคม",
                  "สิงหาคม",
                  "กันยายน",
                  "ตุลาคม",
                  "พฤศจิกายน",
                  "ธันวาคม",
                ].map((m, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={year}
              onValueChange={(v) => {
                setYear(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[120px] bg-slate-50">
                <SelectValue placeholder="ปี" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">- ทุกปี -</SelectItem>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y + 543}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleReset}
              title="ล้างตัวกรอง"
              className="px-3 text-slate-500 hover:text-theme-main"
            >
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
                  <TableHead className="w-[100px] text-center">
                    ทะเบียนรับ
                  </TableHead>
                  <TableHead className="w-[120px]">วันที่ลงรับ</TableHead>
                  <TableHead>เรื่อง</TableHead>
                  <TableHead className="w-[180px]">จาก</TableHead>
                  <TableHead className="w-[160px] text-center">สถานะ</TableHead>
                  <TableHead className="w-[100px] text-center">
                    จัดการ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-slate-500"
                    >
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-theme-main" />{" "}
                      กำลังค้นหา...
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-slate-500"
                    >
                      ไม่พบเอกสารที่ตรงกับคำค้นหา
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
                          ? format(new Date(doc.receive_date), "d MMM yy", {
                              locale: th,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {doc.subject}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          เลขที่หนังสือ: {doc.doc_no || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm truncate max-w-[180px]">
                        {doc.from}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(doc.status)}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-theme-main hover:bg-theme-main-light font-medium"
                          onClick={() =>
                            router.push(`/dashboard/documents/${doc.ID}`)
                          }
                        >
                          <FileText className="h-4 w-4 mr-1" /> เปิด
                        </Button>
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
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>แสดง</span>
            <Select
              value={limit.toString()}
              onValueChange={(v) => {
                setLimit(Number(v))
                setPage(1)
              }}
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

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 mr-2">
              หน้า {page} จาก {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(1)}
                disabled={page <= 1 || isLoading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="w-[50px] mx-1">
                <Input
                  className="h-8 text-center px-1"
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  onKeyDown={handlePageInput}
                  disabled={isLoading}
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || isLoading}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
