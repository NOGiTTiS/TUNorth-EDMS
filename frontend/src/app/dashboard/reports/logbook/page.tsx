"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Printer, BookMarked, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Label } from "@/components/ui/label"

export default function LogbookReportPage() {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [year, setYear] = useState(currentYear.toString())
  const [month, setMonth] = useState(currentMonth.toString())
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i)

  const fetchLogbook = async () => {
    setIsLoading(true)
    try {
      const res = await api.get("/api/v1/reports/logbook", {
        params: { month, year },
      })
      setDocuments(res.data.data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogbook()
  }, [month, year])

  const handlePrint = () => {
    window.print()
  }

  // ตัวช่วยสร้างข้อความช่อง "การปฏิบัติ"
  const getActionText = (doc: any) => {
    if (doc.status === "draft") return "ร่าง"
    if (doc.status === "pending_director") return "เสนอ ผอ."
    if (doc.status === "director_signed") return "ผอ. สั่งการแล้ว"
    if (
      doc.status === "distributed" ||
      doc.status === "sent_to_head" ||
      doc.status === "completed"
    ) {
      // หาว่าส่งไปฝ่ายไหนบ้างจาก Routings
      const depts = doc.Routings?.filter(
        (r: any) => r.action_type === "assigned" && r.receiver_dept,
      ).map((r: any) => r.receiver_dept.name)
      if (depts && depts.length > 0) {
        return `ส่ง: ${[...new Set(depts)].join(", ")}` // ลบชื่อฝ่ายที่ซ้ำกัน
      }
      return "ส่งต่อแล้ว"
    }
    return ""
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ==================================================== */}
      {/* ส่วนควบคุม (Toolbar) - ซ่อนเมื่อสั่ง Print */}
      {/* ==================================================== */}
      <div className="print:hidden">
        <PageHeader
          title="สมุดทะเบียนหนังสือรับ"
          description="รายงานรูปแบบตารางสำหรับพิมพ์ลงกระดาษ"
          icon={BookMarked}
        >
          <div className="flex flex-wrap items-end gap-3 w-full md:w-auto">
            <div className="flex-1 min-w-[120px] flex flex-col gap-1">
              <Label className="text-[10px] text-slate-500 font-medium px-1">
                เดือน
              </Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-full md:w-[140px] h-9 text-xs">
                  <SelectValue placeholder="เลือกเดือน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">- ทั้งปี -</SelectItem>
                  <SelectItem value="1">มกราคม</SelectItem>
                  <SelectItem value="2">กุมภาพันธ์</SelectItem>
                  <SelectItem value="3">มีนาคม</SelectItem>
                  <SelectItem value="4">เมษายน</SelectItem>
                  <SelectItem value="5">พฤษภาคม</SelectItem>
                  <SelectItem value="6">มิถุนายน</SelectItem>
                  <SelectItem value="7">กรกฎาคม</SelectItem>
                  <SelectItem value="8">สิงหาคม</SelectItem>
                  <SelectItem value="9">กันยายน</SelectItem>
                  <SelectItem value="10">ตุลาคม</SelectItem>
                  <SelectItem value="11">พฤศจิกายน</SelectItem>
                  <SelectItem value="12">ธันวาคม</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[100px] flex flex-col gap-1">
              <Label className="text-[10px] text-slate-500 font-medium px-1">
                ปี พ.ศ.
              </Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full md:w-[110px] h-9 text-xs">
                  <SelectValue placeholder="เลือกปี" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y + 543}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto pt-1">
              <Button
                onClick={handlePrint}
                className="w-full sm:w-auto h-9 bg-theme-main hover:bg-theme-main/90"
              >
                <Printer className="w-4 h-4 mr-2" /> พิมพ์
              </Button>
            </div>
          </div>
        </PageHeader>
      </div>

      {/* ==================================================== */}
      {/* ส่วนแสดงผลรายงาน (Report Paper) - แสดงเมื่อ Print */}
      {/* ==================================================== */}
      <div className="bg-white p-8 rounded-lg shadow-md print:shadow-none print:p-0 print:m-0 w-full overflow-x-auto print:overflow-visible">
        {/* CSS สำหรับหน้า Print */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @media print {
            @page { size: A4 landscape; margin: 10mm; }
            body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print\\:hidden { display: none !important; }
            .dashboard-main { padding: 0 !important; margin: 0 !important; }
            .report-container { box-shadow: none !important; border: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; page-break-inside: auto; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th, td { border: 0.5pt solid #000 !important; padding: 6px 4px !important; color: #000 !important; word-wrap: break-word; overflow: visible !important; }
            th { background-color: #f1f5f9 !important; }
          }
        `,
          }}
        />

        {/* หัวกระดาษรายงาน */}
        <div className="text-center mb-6 font-bold text-lg text-(--theme-main)">
          ทะเบียนหนังสือรับ <br />
          <span className="text-sm font-normal">
            ประจำเดือน{" "}
            {month !== "0"
              ? `${["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"][parseInt(month) - 1]} `
              : ""}
            พ.ศ. {parseInt(year) + 543}
          </span>
        </div>

        <div className="report-container">
          <table className="w-full border-collapse border border-slate-400 text-[13px] text-slate-800 min-w-[1000px] print:min-w-0">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-400 p-2 w-[80px]">
                  วันที่ลงรับ
                </th>
                <th className="border border-slate-400 p-2 w-[70px]">
                  เลขทะเบียนรับ
                </th>
                <th className="border border-slate-400 p-2 w-[110px]">ที่</th>
                <th className="border border-slate-400 p-2 w-[80px]">
                  ลงวันที่
                </th>
                <th className="border border-slate-400 p-2 w-[130px]">จาก</th>
                <th className="border border-slate-400 p-2 w-[130px]">ถึง</th>
                <th className="border border-slate-400 p-2">เรื่อง</th>
                <th className="border border-slate-400 p-2 w-[130px]">
                  การปฏิบัติ
                </th>
                <th className="border border-slate-400 p-2 w-[80px]">
                  หมายเหตุ
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center p-8 text-slate-500 border border-slate-400"
                  >
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />{" "}
                    กำลังดึงข้อมูล...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center p-8 text-slate-500 border border-slate-400"
                  >
                    ไม่มีข้อมูลหนังสือรับในเดือนนี้
                  </td>
                </tr>
              ) : (
                documents.map((doc, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50 print:hover:bg-transparent"
                  >
                    <td className="border border-slate-400 p-2 text-center">
                      {doc.receive_date
                        ? format(new Date(doc.receive_date), "dd/MM/yy")
                        : "-"}
                    </td>
                    <td className="border border-slate-400 p-2 text-center font-semibold">
                      {doc.receive_no}
                    </td>
                    <td className="border border-slate-400 p-2">
                      {doc.doc_no}
                    </td>
                    <td className="border border-slate-400 p-2 text-center">
                      {doc.doc_date
                        ? format(new Date(doc.doc_date), "dd/MM/yy")
                        : "-"}
                    </td>
                    <td className="border border-slate-400 p-2">{doc.from}</td>
                    <td className="border border-slate-400 p-2">{doc.to}</td>
                    <td className="border border-slate-400 p-2">
                      {doc.subject}
                    </td>
                    <td className="border border-slate-400 p-2 text-xs">
                      {getActionText(doc)}
                    </td>
                    <td className="border border-slate-400 p-2"></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
