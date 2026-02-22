"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import SignatureCanvas from "react-signature-canvas"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Trash2, Send, FileCheck } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/dashboard/page-header"

interface Department {
  ID: number
  name: string
}

export default function ReceiveDocumentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // 1. Form States
  const [formData, setFormData] = useState({
    receive_no: "",
    receive_date: new Date().toISOString().split("T")[0],
    doc_no: "",
    doc_date: "",
    from: "",
    to: "ผู้อำนวยการโรงเรียนเตรียมอุดมศึกษา ภาคเหนือ",
    subject: "",
    note_to_director: "ทราบและพิจารณา", // ข้อความเสนอ ผอ.
  })
  const [file, setFile] = useState<File | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepts, setSelectedDepts] = useState<number[]>([])

  // 2. Ref สำหรับลายเซ็น
  const sigPad = useRef<SignatureCanvas>(null)

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get("/api/v1/departments")
        setDepartments(res.data.data)
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูลฝ่ายได้")
      }
    }
    fetchDepts()
  }, [])

  // เพิ่ม useEffect สำหรับดึงเลข Auto Run
  useEffect(() => {
    const fetchNextNo = async () => {
      try {
        const res = await api.get("/api/v1/documents/next-no")
        if (res.data.next_no) {
          setFormData((prev) => ({
            ...prev,
            receive_no: res.data.next_no,
          }))
        }
      } catch (error) {
        console.error("Auto-run number failed")
      }
    }
    fetchNextNo()
  }, []) // ทำงานครั้งเดียวตอนเปิดหน้า

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const toggleDept = (deptId: number) => {
    setSelectedDepts((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId],
    )
  }

  // --- Logic หลัก: รวม 2 ขั้นตอนในปุ่มเดียว ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!file) return toast.error("กรุณาอัปโหลดไฟล์ PDF")
    if (selectedDepts.length === 0)
      return toast.error("กรุณาเลือกฝ่ายที่รับผิดชอบ")
    if (!sigPad.current || sigPad.current.isEmpty())
      return toast.error("กรุณาลงลายเซ็นเจ้าหน้าที่")

    setIsLoading(true)
    const signatureData = sigPad.current
      .getTrimmedCanvas()
      .toDataURL("image/png")

    try {
      // Step 1: บันทึกข้อมูลและไฟล์ต้นฉบับ
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) =>
        data.append(key, value),
      )
      data.append("file", file)

      const res = await api.post("/api/v1/documents", data, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const newDocId = res.data.data.ID

      // Step 2: ประทับตราและลงนามทันที
      await api.post(`/api/v1/documents/${newDocId}/stamp`, {
        dept_ids: selectedDepts,
        signature_data: signatureData,
        note_to_director: formData.note_to_director,
      })

      toast.success("ลงรับหนังสือและประทับตราสำเร็จ")
      router.push("/dashboard")
    } catch (error: any) {
      // เช็คว่า Error มาจาก Response ของ Server หรือไม่
      if (error.response) {
        // กรณีที่ Server ตอบกลับมา (เช่น 409, 500)
        if (error.response.status === 409) {
          // กรณีเลขซ้ำ (409 Conflict) -> แสดง Toast เตือนอย่างเดียว ไม่ต้อง console.error
          toast.error("ข้อมูลซ้ำ", {
            description:
              error.response.data.error || "เลขทะเบียนรับนี้มีอยู่ในระบบแล้ว",
          })
        } else {
          // กรณี Error อื่นๆ -> ค่อย Log ลง Console
          console.error("Server Error:", error)
          toast.error("เกิดข้อผิดพลาดจากระบบ", {
            description: error.response.data.error || "กรุณาลองใหม่อีกครั้ง",
          })
        }
      } else if (error.request) {
        // กรณีส่ง Request ไปแล้วแต่ไม่ได้รับ Response (เน็ตหลุด/Server ดับ)
        console.error("Network Error:", error)
        toast.error("ไม่สามารถเชื่อมต่อ Server ได้")
      } else {
        // กรณีอื่นๆ
        console.error("Error:", error)
        toast.error("เกิดข้อผิดพลาดบางอย่าง")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <PageHeader
        title="ลงทะเบียนรับหนังสือ"
        description="บันทึกข้อมูลหนังสือรับและเสนอผู้บริหารสั่งการ"
        icon={FileCheck}
      />

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* ฝั่งซ้าย: ข้อมูลหนังสือ (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg text-theme-main">
                1. ข้อมูลหนังสือ
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>เลขทะเบียนรับ</Label>
                  <Input
                    name="receive_no"
                    value={formData.receive_no}
                    onChange={handleChange}
                    required
                    placeholder="เลขรับ..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>วันที่ลงรับ</Label>
                  <Input
                    name="receive_date"
                    type="date"
                    value={formData.receive_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ที่ (เลขในหนังสือ)</Label>
                  <Input
                    name="doc_no"
                    value={formData.doc_no}
                    onChange={handleChange}
                    required
                    placeholder="ศธ..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>ลงวันที่</Label>
                  <Input
                    name="doc_date"
                    type="date"
                    value={formData.doc_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>เรื่อง</Label>
                <Textarea
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>จาก</Label>
                  <Input
                    name="from"
                    value={formData.from}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>ถึง (เรียน)</Label>
                  <Input
                    name="to"
                    value={formData.to}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <Label className="text-theme-main font-bold">
                  ไฟล์ต้นฉบับ (PDF)
                </Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  required
                  className="mt-1 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg text-theme-main">
                2. การคัดกรองฝ่ายที่รับผิดชอบ
              </CardTitle>
            </CardHeader>
            <CardContent className="">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg border">
                {departments.map((dept) => (
                  <div
                    key={dept.ID}
                    className="flex items-center space-x-3 p-1"
                  >
                    <Checkbox
                      id={`dept-${dept.ID}`}
                      checked={selectedDepts.includes(dept.ID)}
                      onCheckedChange={() => toggleDept(dept.ID)}
                    />
                    <Label
                      htmlFor={`dept-${dept.ID}`}
                      className="font-normal cursor-pointer text-sm"
                    >
                      {dept.name}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ฝั่งขวา: การเกษียรเสนอและลายเซ็น (1/3) */}
        <div className="space-y-6">
          <Card className="border-theme-main-light shadow-md sticky top-6">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg text-theme-main">
                3. เสนอผู้อำนวยการ
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-theme-dark">
                  ข้อความเสนอ (เพื่อโปรด...)
                </Label>
                <Input
                  name="note_to_director"
                  value={formData.note_to_director}
                  onChange={handleChange}
                  className="border-theme-main-light focus:ring-theme-main"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-theme-dark font-bold">
                    ลายมือชื่อเจ้าหน้าที่
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => sigPad.current?.clear()}
                    className="h-7 text-[10px] text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> ล้าง
                  </Button>
                </div>

                <div className="rounded-lg border-2 border-dashed border-theme-main-light bg-white h-[180px] overflow-hidden">
                  <SignatureCanvas
                    ref={sigPad}
                    penColor="blue" // หมึกน้ำเงินตามคำขอ
                    canvasProps={{ className: "w-full h-full" }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center italic">
                  * กรุณาลงนามในกรอบเพื่อประทับตราลงใน PDF
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-theme-main hover:bg-theme-main h-14 text-lg shadow-lg shadow-theme-main"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                    กำลังประมวลผล...
                  </>
                ) : (
                  <>
                    <FileCheck className="mr-2 h-5 w-5" /> ลงรับหนังสือ
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-slate-400"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                ยกเลิก
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
