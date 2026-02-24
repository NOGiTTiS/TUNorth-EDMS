"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { toast } from "sonner"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import SignatureCanvas from "react-signature-canvas"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  PenTool,
  Share2,
  CheckCircle2,
  RotateCcw,
  UserCheck,
  Send,
  FileText,
} from "lucide-react"

interface DocumentDetail {
  ID: number
  receive_no: string
  receive_date: string
  subject: string
  from: string
  file_path: string
  status: string
  CreatedAt: string
}

interface Department {
  ID: number
  name: string
}

interface User {
  ID: number
  full_name: string
}

// --- ฟังก์ชันเสริม: แปลงสถานะเป็นภาษาไทยและใส่สี ---
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
          ถึงธุรการฝ่าย (ลงรับ)
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
          ส่งหัวหน้างานแล้ว
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

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [docId, setDocId] = useState<string | null>(null)
  useEffect(() => {
    params.then((p) => setDocId(p.id))
  }, [params])

  const router = useRouter()
  const { user } = useAuthStore()

  // Data States
  const [document, setDocument] = useState<DocumentDetail | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [headUnits, setHeadUnits] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // --- States สำหรับการใช้งานร่วมกัน (ฟอร์มและลายเซ็น) ---
  const [selectedActions, setSelectedActions] = useState<string[]>([""])
  const [comment, setComment] = useState("")
  const sigPad = useRef<SignatureCanvas>(null)

  // --- Admin States ---
  const [selectedDepts, setSelectedDepts] = useState<number[]>([])
  const [selectedHeads, setSelectedHeads] = useState<number[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!docId) return

    const fetchData = async () => {
      try {
        const docRes = await api.get(`/api/v1/documents/${docId}`)
        setDocument(docRes.data.data)

        if (user?.role === "admin_central") {
          const deptRes = await api.get("/api/v1/departments")
          setDepartments(deptRes.data.data)
        } else if (user?.role === "admin_dept" && user.dept_id) {
          // ดึงหัวหน้างานในฝ่ายตัวเอง
          const headRes = await api.get(`/api/v1/users`, {
            params: { role: "head", department_id: user.dept_id },
          })
          setHeadUnits(headRes.data.data)
        }
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูลได้")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [docId, user])

  // Logic: ผอ. เลือกคำสั่งการ
  const toggleAction = (value: string) => {
    setSelectedActions((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value)
      } else {
        if (value === "มอบหมาย/สั่งการ" && !prev.includes("ทราบ")) {
          return [...prev, value, "ทราบ"]
        }
        return [...prev, value]
      }
    })
  }

  // ==========================================
  // API Calls
  // ==========================================

  // 1. ผอ. บันทึกเกษียร
  const handleKasien = async () => {
    if (!document) return
    if (!sigPad.current || sigPad.current.isEmpty())
      return toast.error("กรุณาลงนามเกษียรหนังสือ")

    setIsSubmitting(true)
    const signatureData = sigPad.current
      .getTrimmedCanvas()
      .toDataURL("image/png")
    const actionString = selectedActions.join(", ")

    try {
      await api.post(`/api/v1/documents/${document.ID}/route`, {
        action: actionString,
        command_note: comment,
        signature_data: signatureData,
      })
      toast.success("ลงนามและบันทึกการสั่งการเรียบร้อยแล้ว")
      router.push("/dashboard/documents")
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 2. ธุรการกลาง แจกจ่าย
  const handleDistribute = async () => {
    if (selectedDepts.length === 0)
      return toast.error("กรุณาเลือกฝ่ายอย่างน้อย 1 ฝ่าย")
    setIsSubmitting(true)
    try {
      await api.post(`/api/v1/documents/${document?.ID}/distribute`, {
        dept_ids: selectedDepts,
      })
      toast.success("แจกจ่ายหนังสือเรียบร้อยแล้ว")
      router.push("/dashboard/documents")
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการแจกจ่าย")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. ธุรการฝ่าย -> เสนอ รองฯ
  const handleForwardToDeputy = async () => {
    setIsSubmitting(true)
    try {
      // ส่ง Note เป็นค่าว่างไปเลยเพราะตัดกล่องข้อความทิ้งแล้ว
      await api.post(`/api/v1/documents/${document?.ID}/forward-deputy`, {
        note: "",
      })
      toast.success("ประทับตราและส่งเสนอรองผู้อำนวยการเรียบร้อย")
      router.push("/dashboard/documents")
    } catch (e) {
      toast.error("ส่งเสนอไม่สำเร็จ")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 4. รองฯ -> เกษียร
  const handleDeputySign = async () => {
    if (!document) return
    if (!sigPad.current || sigPad.current.isEmpty())
      return toast.error("กรุณาลงนาม")

    setIsSubmitting(true)
    const signatureData = sigPad.current
      .getTrimmedCanvas()
      .toDataURL("image/png")

    try {
      await api.post(`/api/v1/documents/${document.ID}/deputy-sign`, {
        action: "", // ไม่ต้องส่ง Action (Checkbox) แล้ว
        command_note: comment,
        signature_data: signatureData,
      })
      toast.success("ลงนามและสั่งการระดับฝ่ายเรียบร้อยแล้ว")
      router.push("/dashboard/documents")
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 5. ธุรการฝ่าย -> ส่งหัวหน้างาน
  const handleForwardToHead = async () => {
    if (selectedHeads.length === 0) return toast.error("กรุณาเลือกหัวหน้างาน")
    setIsSubmitting(true)
    try {
      await api.post(`/api/v1/documents/${document?.ID}/forward-head`, {
        head_ids: selectedHeads,
      })
      toast.success("ส่งต่อให้หัวหน้างานสำเร็จ")
      router.push("/dashboard/documents")
    } catch (e) {
      toast.error("ส่งต่อไม่สำเร็จ")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 6. หัวหน้างาน -> รับทราบ
  const handleHeadComplete = async () => {
    setIsSubmitting(true)
    try {
      await api.post(`/api/v1/documents/${document?.ID}/complete`)
      toast.success("รับทราบและสิ้นสุดกระบวนการ")
      router.push("/dashboard/documents")
    } catch (e) {
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !docId)
    return (
      <div className="p-10 text-center flex items-center justify-center h-screen">
        <RotateCcw className="animate-spin mr-2" /> กำลังโหลด...
      </div>
    )
  if (!document) return <div className="p-10 text-center">ไม่พบข้อมูล</div>

  const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL}/${document.file_path.replace("./", "")}`

  return (
    <div className="h-[calc(100vh-40px)] flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center gap-4 mb-4 bg-white p-4 rounded-lg shadow-sm border">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-theme-main" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold truncate text-theme-main">
            {document.subject}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>เลขรับ: {document.receive_no}</span>
            <span>|</span>
            <span>
              ลงวันที่:{" "}
              {document.CreatedAt
                ? format(new Date(document.CreatedAt), "d MMM yy", {
                    locale: th,
                  })
                : "-"}
            </span>
          </div>
        </div>
        {getStatusBadge(document.status)}
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Left: PDF Viewer */}
        <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden border shadow-inner">
          <iframe src={pdfUrl} className="w-full h-full" title="PDF Viewer" />
        </div>

        {/* Right: Action Panel */}
        <div className="w-full md:w-[420px] flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
          {/* FLOW 1: ผู้อำนวยการ (เกษียร) */}
          {user?.role === "director" &&
            document.status === "pending_director" && (
              <Card className="border-theme-main-light shadow-md">
                <CardHeader className="bg-theme-main-light pb-3 border-b border-theme-main-light">
                  <CardTitle className="text-lg text-theme-main flex items-center gap-2">
                    <PenTool className="h-5 w-5" /> เกษียรสั่งการ (ผอ.)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-6">
                  <div className="flex flex-col gap-3">
                    {[
                      "ทราบ",
                      "อนุมัติ/อนุญาต",
                      "เห็นชอบตามเสนอ",
                      "มอบหมาย/สั่งการ",
                    ].map((act) => (
                      <div key={act} className="flex items-center space-x-2">
                        <Checkbox
                          id={act}
                          checked={selectedActions.includes(act)}
                          onCheckedChange={() => toggleAction(act)}
                        />
                        <Label
                          htmlFor={act}
                          className="cursor-pointer font-normal text-sm"
                        >
                          {act}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-pink-700">
                      ข้อความสั่งการเพิ่มเติม
                    </Label>
                    <Textarea
                      placeholder="พิมพ์บันทึกข้อความ..."
                      className="min-h-[80px] text-sm bg-slate-50 border-theme-main-light focus-visible:ring-theme-main"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-theme-dark font-bold flex justify-between">
                      ลงนามเกษียรหนังสือ
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => sigPad.current?.clear()}
                        className="h-6 text-[10px] text-slate-400 hover:text-red-500"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> ล้าง
                      </Button>
                    </Label>
                    <div className="rounded-lg border-2 border-dashed border-theme-main-light bg-white w-full h-[150px]">
                      <SignatureCanvas
                        ref={sigPad}
                        penColor="blue"
                        canvasProps={{ className: "w-full h-full" }}
                      />
                    </div>
                    <div className="text-center py-2 border rounded bg-slate-50">
                      <div className="font-bold text-slate-800 text-sm">
                        {user?.full_name}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase">
                        ผู้อำนวยการโรงเรียน
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-theme-main hover:bg-theme-main h-12 text-md shadow-lg shadow-theme-main/20"
                    onClick={handleKasien}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "กำลังบันทึก..." : "ลงนามและบันทึกสั่งการ"}
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* FLOW 2: ธุรการกลาง (แจกจ่าย) */}
          {user?.role === "admin_central" &&
            document.status === "director_signed" && (
              <Card className="border-theme-main-light shadow-md">
                <CardHeader className="bg-theme-main-light pb-3 border-b border-theme-main-light">
                  <CardTitle className="text-lg text-theme-main flex items-center gap-2">
                    <Share2 className="h-5 w-5" /> ส่งต่อหนังสือ
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-xs text-yellow-800">
                    ผอ. ลงนามแล้ว กรุณาเลือกฝ่ายเพื่อส่งต่อแจ้งเตือน
                  </div>
                  <div className="grid grid-cols-1 gap-1 border p-3 rounded bg-slate-50 max-h-[250px] overflow-y-auto">
                    {departments.map((dept) => (
                      <div
                        key={dept.ID}
                        className="flex items-center space-x-3 p-2 hover:bg-white rounded transition-colors border border-transparent"
                      >
                        <Checkbox
                          id={`dept-${dept.ID}`}
                          checked={selectedDepts.includes(dept.ID)}
                          onCheckedChange={() =>
                            setSelectedDepts((prev) =>
                              prev.includes(dept.ID)
                                ? prev.filter((id) => id !== dept.ID)
                                : [...prev, dept.ID],
                            )
                          }
                        />
                        <Label
                          htmlFor={`dept-${dept.ID}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {dept.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-theme-main hover:bg-theme-main/90 h-12"
                    onClick={handleDistribute}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "กำลังส่ง..." : "ยืนยันการส่งต่อ"}
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* FLOW 3: ธุรการฝ่าย (เสนอ รองฯ) */}
          {user?.role === "admin_dept" && document.status === "distributed" && (
            <Card className="border-theme-main-light shadow-md">
              <CardHeader className="bg-theme-main-light pb-3 border-b border-theme-main-light">
                <CardTitle className="text-lg text-theme-main flex items-center gap-2">
                  <UserCheck className="h-5 w-5" /> ลงรับและเสนอฝ่าย
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="bg-blue-50 p-3 rounded border border-blue-100 text-xs text-blue-800">
                  <strong>ระเบียบงานสารบรรณ:</strong> ระบบจะประทับตรา
                  "ลงรับฝ่าย" ที่มุมซ้ายบนของเอกสาร
                </div>
                {/* ลบกล่องข้อความ (Textarea) ออกแล้ว */}
                <Button
                  className="w-full bg-theme-main hover:bg-theme-main/90 h-12 text-md shadow-lg shadow-theme-main/20"
                  onClick={handleForwardToDeputy}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <RotateCcw className="animate-spin mr-2 w-4 h-4" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  ประทับตราและส่งเสนอรองฯ
                </Button>
              </CardContent>
            </Card>
          )}

          {/* FLOW 4: รองผู้อำนวยการ (เกษียร) */}
          {user?.role === "deputy" && document.status === "pending_deputy" && (
            <Card className="border-theme-main-light shadow-md">
              <CardHeader className="bg-theme-main-light pb-3 border-b border-theme-main-light">
                <CardTitle className="text-lg text-theme-main flex items-center gap-2">
                  <PenTool className="h-5 w-5" /> เกษียรสั่งการ (รองฯ)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                {/* ลบกลุ่ม Checkbox ออกแล้ว เหลือแค่ข้อความสั่งการ */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    ข้อความสั่งการ
                  </Label>
                  <Textarea
                    placeholder="พิมพ์บันทึกข้อความ (เช่น ทราบ/มอบหมายงาน)..."
                    className="min-h-[80px] text-sm bg-slate-50"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-theme-main font-bold flex justify-between">
                    ลงนามเกษียรหนังสือ
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sigPad.current?.clear()}
                      className="h-6 text-[10px]"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" /> ล้าง
                    </Button>
                  </Label>
                  <div className="rounded-lg border-2 border-theme-main bg-white w-full h-[150px]">
                    <SignatureCanvas
                      ref={sigPad}
                      penColor="blue"
                      canvasProps={{ className: "w-full h-full" }}
                    />
                  </div>
                  <div className="text-center py-2 border rounded bg-slate-50">
                    <div className="font-bold text-slate-800 text-sm">
                      {user?.full_name}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">
                      รองผู้อำนวยการโรงเรียน
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-theme-main hover:bg-theme-main/80 h-12 text-md"
                  onClick={handleDeputySign}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "กำลังบันทึก..." : "ลงนามและบันทึกสั่งการ"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* FLOW 5: ธุรการฝ่าย (ส่งหัวหน้างาน) */}
          {user?.role === "admin_dept" &&
            document.status === "deputy_signed" && (
              <Card className="border-theme-main-light shadow-md">
                <CardHeader className="bg-theme-main-light pb-3 border-b border-theme-main-light">
                  <CardTitle className="text-lg text-theme-main flex items-center gap-2">
                    <Share2 className="h-5 w-5" /> ส่งต่อหัวหน้างาน
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">
                      เลือกหัวหน้างาน (ในฝ่ายของท่าน)
                    </Label>
                    <div className="grid grid-cols-1 gap-1 border p-3 rounded bg-slate-50 max-h-[250px] overflow-y-auto">
                      {headUnits.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">
                          ไม่พบรายชื่อหัวหน้างานในฝ่ายนี้
                        </p>
                      ) : (
                        headUnits.map((h) => (
                          <div
                            key={h.ID}
                            className="flex items-center space-x-3 p-2 hover:bg-white rounded border border-transparent"
                          >
                            <Checkbox
                              id={`head-${h.ID}`}
                              checked={selectedHeads.includes(h.ID)}
                              onCheckedChange={() =>
                                setSelectedHeads((prev) =>
                                  prev.includes(h.ID)
                                    ? prev.filter((id) => id !== h.ID)
                                    : [...prev, h.ID],
                                )
                              }
                            />
                            <Label
                              htmlFor={`head-${h.ID}`}
                              className="cursor-pointer flex-1"
                            >
                              {h.full_name}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <Button
                    className="w-full bg-theme-main hover:bg-theme-main/80 h-12"
                    onClick={handleForwardToHead}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "กำลังส่ง..." : "ยืนยันการส่งต่อ"}
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* FLOW 6: หัวหน้างาน (รับทราบ/จบงาน) */}
          {user?.role === "head" && document.status === "sent_to_head" && (
            <Card className="border-theme-main-light shadow-md">
              <CardHeader className="bg-theme-main-light pb-3 border-b border-theme-main-light">
                <CardTitle className="text-lg text-theme-main flex items-center gap-2">
                  <UserCheck className="h-5 w-5" /> ส่วนของหัวหน้างาน
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-slate-600 mb-4">
                  โปรดอ่านเอกสารและกดรับทราบเพื่อสิ้นสุดกระบวนการในระบบ
                </p>
                <Button
                  onClick={handleHeadComplete}
                  disabled={isSubmitting}
                  className="w-full bg-theme-main hover:bg-theme-main/80 h-12 text-md shadow-lg shadow-green-100"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "รับทราบ / ดำเนินการแล้ว"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* สถานะ Completed (จบกระบวนการ) */}
          {document.status === "completed" && (
            <Card className="border-theme-main-light shadow-md">
              <CardHeader className="bg-theme-main-light pb-3 border-b border-theme-main-light">
                <CardTitle className="text-lg text-theme-main flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> ดำเนินการเสร็จสิ้นสมบูรณ์
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-xs text-theme-dark">
                  หนังสือถึงมือผู้ปฏิบัติงานและรับทราบเรียบร้อยแล้ว
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
