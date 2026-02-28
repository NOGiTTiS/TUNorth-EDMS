"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { useSettingStore } from "@/store/settingStore"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Save,
  Loader2,
  Settings,
  Image as ImageIcon,
  Palette,
  FileText,
  Send,
  UploadCloud,
} from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { settings: globalSettings, updateLocalSettings } = useSettingStore()

  const [isLoading, setIsLoading] = useState(false)
  // ใช้ State ย่อยในหน้านี้ เพื่อให้พิมพ์แก้ก่อนแล้วค่อยกด Save ทีเดียว
  const [settings, setSettings] =
    useState<Record<string, string>>(globalSettings)

  // อัปเดตข้อมูลในหน้าต่างนี้ หาก Global Store โหลดข้อมูลเสร็จทีหลัง
  useEffect(() => {
    if (Object.keys(globalSettings).length > 0) {
      setSettings(globalSettings)
    }
  }, [globalSettings])

  // ฟังก์ชันแก้ไขข้อความ/สี
  const handleChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: String(value) }))
  }

  // ฟังก์ชันอัปโหลดรูปภาพ (Logo / Favicon)
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    // แสดง UI โหลด
    const loadingToast = toast.loading("กำลังอัปโหลดรูปภาพ...")

    try {
      const res = await api.post("/api/v1/settings/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const newUrl = res.data.url
      handleChange(key, newUrl) // นำ URL ใหม่ใส่ในช่อง Input

      toast.success("อัปโหลดรูปภาพสำเร็จ", { id: loadingToast })
      toast.info('กรุณากด "บันทึกการตั้งค่า" เพื่อนำไปใช้งานจริง')
    } catch (error) {
      console.error(error)
      toast.error("อัปโหลดล้มเหลว กรุณาลองใหม่", { id: loadingToast })
    }
  }

  // ฟังก์ชันบันทึกการตั้งค่าลง Database
  const handleSave = async () => {
    setIsLoading(true)
    try {
      await api.put("/api/v1/settings", settings)
      updateLocalSettings(settings) // อัปเดต Global Store -> ธีมเว็บจะเปลี่ยนทันที!
      toast.success("บันทึกการตั้งค่าระบบเรียบร้อยแล้ว")
    } catch (error) {
      console.error(error)
      toast.error("เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setIsLoading(false)
    }
  }

  // ป้องกันการเข้าถึงหากไม่ใช่ ธุรการกลาง
  if (user?.role !== "admin_central") {
    return (
      <div className="p-10 text-center text-red-500 font-bold">
        คุณไม่มีสิทธิ์เข้าถึงหน้านี้
      </div>
    )
  }

  // ฟังก์ชันช่วยจัดการ URL และแก้ปัญหา Path เก่าที่พังจาก Windows (\loads) สำหรับ Preview
  const getImageUrl = (path: string) => {
    if (!path) return ""
    let cleanPath = path.replace(/\\/g, "/") // เปลี่ยน \ เป็น /
    if (cleanPath.startsWith("/loads")) {
      cleanPath = cleanPath.replace("/loads", "/uploads") // แก้ loads เป็น uploads
    }
    return `${process.env.NEXT_PUBLIC_API_URL}${cleanPath}`
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <PageHeader
        title="ตั้งค่าระบบ (System Settings)"
        description="จัดการข้อมูลพื้นฐาน ธีม และการแจ้งเตือนของระบบ"
        icon={Settings}
      >
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-theme-main hover:bg-theme-main shadow-md h-12 px-6 text-md w-full md:w-auto"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          บันทึกการตั้งค่า
        </Button>
      </PageHeader>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex md:grid w-full h-12 md:grid-cols-5 bg-white border shadow-sm rounded-lg">
          <TabsTrigger
            value="general"
            className="data-[state=active]:text-(--theme-main) flex-1 shrink-0 px-3 md:px-4"
          >
            <Settings className="w-5 h-5 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">ทั่วไป</span>
          </TabsTrigger>
          <TabsTrigger
            value="images"
            className="data-[state=active]:text-(--theme-main) flex-1 shrink-0 px-3 md:px-4"
          >
            <ImageIcon className="w-5 h-5 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">รูปภาพ</span>
          </TabsTrigger>
          <TabsTrigger
            value="theme"
            className="data-[state=active]:text-(--theme-main) flex-1 shrink-0 px-3 md:px-4"
          >
            <Palette className="w-5 h-5 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">ธีม & UI</span>
          </TabsTrigger>
          <TabsTrigger
            value="document"
            className="data-[state=active]:text-(--theme-main) flex-1 shrink-0 px-3 md:px-4"
          >
            <FileText className="w-5 h-5 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">เอกสาร</span>
          </TabsTrigger>
          <TabsTrigger
            value="telegram"
            className="data-[state=active]:text-(--theme-main) flex-1 shrink-0 px-3 md:px-4"
          >
            <Send className="w-5 h-5 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">การแจ้งเตือน</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. ทั่วไป */}
        <TabsContent value="general" className="mt-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-theme-main">
                <Settings className="w-5 h-5" />
                ข้อมูลทั่วไปของระบบ
              </CardTitle>
              <CardDescription>จัดการข้อมูลพื้นฐานของระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>ชื่อระบบ (System Name)</Label>
                <Input
                  value={settings.system_name || ""}
                  onChange={(e) => handleChange("system_name", e.target.value)}
                  placeholder="เช่น TUNorth EDMS"
                />
              </div>
              <div className="space-y-2">
                <Label>คำอธิบายระบบ (Description)</Label>
                <Input
                  value={settings.system_description || ""}
                  onChange={(e) =>
                    handleChange("system_description", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>ลิขสิทธิ์ (Copyright)</Label>
                <Input
                  value={settings.copyright || ""}
                  onChange={(e) => handleChange("copyright", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. รูปภาพ */}
        <TabsContent value="images" className="mt-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-theme-main">
                <ImageIcon className="w-5 h-5" />
                รูปภาพระบบ
              </CardTitle>
              <CardDescription>
                อัปโหลดรูปภาพเพื่อนำไปแสดงผลที่หน้าจอ Login และแถบเมนู
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-3">
                <Label className="font-semibold text-base">
                  โลโก้ระบบ (Main Logo)
                </Label>
                <div className="flex items-end gap-6">
                  <div className="h-24 w-24 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                    {settings.logo_url ? (
                      <img
                        src={getImageUrl(settings.logo_url)}
                        alt="Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="text-slate-300 w-8 h-8" />
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label
                      htmlFor="logo_upload"
                      className="cursor-pointer flex items-center gap-2 bg-white border shadow-sm w-fit px-4 py-2 rounded-md hover:bg-slate-50 transition-colors text-sm"
                    >
                      <UploadCloud className="w-4 h-4 text-theme-main" />
                      เลือกไฟล์รูปภาพโลโก้
                    </Label>
                    <Input
                      id="logo_upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "logo_url")}
                      className="hidden"
                    />
                    <Input
                      value={settings.logo_url || ""}
                      readOnly
                      placeholder="/uploads/settings/..."
                      className="bg-slate-100 text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="font-semibold text-base">
                  ไอคอนเว็บ (Favicon)
                </Label>
                <div className="flex items-end gap-6">
                  <div className="h-16 w-16 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                    {settings.favicon_url ? (
                      <img
                        src={getImageUrl(settings.favicon_url)}
                        alt="Favicon Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="text-slate-300 w-6 h-6" />
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label
                      htmlFor="fav_upload"
                      className="cursor-pointer flex items-center gap-2 bg-white border shadow-sm w-fit px-4 py-2 rounded-md hover:bg-slate-50 transition-colors text-sm"
                    >
                      <UploadCloud className="w-4 h-4 text-theme-main" />
                      เลือกไฟล์รูปภาพไอคอน
                    </Label>
                    <Input
                      id="fav_upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "favicon_url")}
                      className="hidden"
                    />
                    <Input
                      value={settings.favicon_url || ""}
                      readOnly
                      placeholder="/uploads/settings/..."
                      className="bg-slate-100 text-slate-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. ธีมและสี */}
        <TabsContent value="theme" className="mt-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-theme-main">
                <Palette className="w-5 h-5" />
                การปรับแต่งสีและสไตล์ (Theme & UI)
              </CardTitle>
              <CardDescription>จัดการสีและสไตล์ของระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-3">
                <div className="space-y-3">
                  <Label className="font-semibold text-base">
                    สีหลัก (Main Color)
                  </Label>
                  <p className="text-xs text-slate-500">
                    ใช้สำหรับปุ่มสำคัญ, ชื่อโปรแกรม, ไอคอน
                  </p>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      className="w-16 h-12 p-1 cursor-pointer"
                      value={settings.theme_main_color || "#db2777"}
                      onChange={(e) =>
                        handleChange("theme_main_color", e.target.value)
                      }
                    />
                    <Input
                      value={settings.theme_main_color || "#db2777"}
                      onChange={(e) =>
                        handleChange("theme_main_color", e.target.value)
                      }
                      className="font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="font-semibold text-base block mb-1">
                  สีพื้นหลังหน้า Login (Background Gradient)
                </Label>
                <p className="text-xs text-slate-500 mb-4">
                  ระบบจะไล่สีจากมุมซ้ายบนไปยังมุมขวาล่างโดยอัตโนมัติ
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label>สีเริ่มต้น (Start Color)</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        className="w-16 h-12 p-1 cursor-pointer"
                        value={settings.theme_bg_gradient_start || "#ffffff"}
                        onChange={(e) =>
                          handleChange(
                            "theme_bg_gradient_start",
                            e.target.value,
                          )
                        }
                      />
                      <Input
                        value={settings.theme_bg_gradient_start || "#ffffff"}
                        onChange={(e) =>
                          handleChange(
                            "theme_bg_gradient_start",
                            e.target.value,
                          )
                        }
                        className="font-mono uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>สีสิ้นสุด (End Color)</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        className="w-16 h-12 p-1 cursor-pointer"
                        value={settings.theme_bg_gradient_end || "#ffffff"}
                        onChange={(e) =>
                          handleChange("theme_bg_gradient_end", e.target.value)
                        }
                      />
                      <Input
                        value={settings.theme_bg_gradient_end || "#ffffff"}
                        onChange={(e) =>
                          handleChange("theme_bg_gradient_end", e.target.value)
                        }
                        className="font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Box ตัวอย่างสีพื้นหลัง แบบ Real-time */}
                <div className="mt-6">
                  <Label>ตัวอย่างสีพื้นหลังหน้าจอ</Label>
                  <div
                    className="w-full h-32 rounded-xl border shadow-inner mt-2 flex items-center justify-center font-bold text-slate-700 transition-all duration-300"
                    style={{
                      background: `linear-gradient(to bottom right, ${settings.theme_bg_gradient_start || "#fff"}, ${settings.theme_bg_gradient_end || "#fff"})`,
                    }}
                  >
                    <div className="bg-white/80 backdrop-blur-sm px-6 py-2 rounded-lg shadow-sm border border-white/50">
                      Preview Background
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. เอกสาร */}
        <TabsContent value="document" className="mt-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-theme-main">
                <FileText className="w-5 h-5" />
                ตั้งค่าการรันเลขเอกสาร
              </CardTitle>
              <CardDescription>จัดการเลขทะเบียนรับของระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2 max-w-md">
                <Label>รูปแบบเลขทะเบียนรับ</Label>
                <Select
                  value={settings.doc_number_format || "continuous"}
                  onValueChange={(v) => handleChange("doc_number_format", v)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="continuous">
                      รันต่อเนื่อง (เช่น 1, 2, 3, ...)
                    </SelectItem>
                    <SelectItem value="yearly">
                      รันต่อปีการศึกษา (เช่น 1/2569, 2/2569, ...)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 pt-1">
                  * ระบบจะนำรูปแบบนี้ไปแนะนำในช่อง "เลขทะเบียนรับ" อัตโนมัติ
                  (กำลังพัฒนาในเฟสถัดไป)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. การแจ้งเตือน Telegram */}
        <TabsContent value="telegram" className="mt-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-theme-main">
                <Send className="w-5 h-5" />
                การตั้งค่า Telegram Bot
              </CardTitle>
              <CardDescription>
                จัดการการแจ้งเตือนไปยัง Telegram Bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="space-y-1">
                  <Label className="text-base font-semibold text-slate-800">
                    เปิดใช้งานการแจ้งเตือน (Global Notification)
                  </Label>
                  <p className="text-sm text-slate-500">
                    หากปิดสวิตช์นี้ ระบบจะไม่ส่งข้อความแจ้งเตือนใดๆ
                    ไปยังทุกช่องทาง แม้จะใส่ Token ไว้ก็ตาม
                  </p>
                </div>
                <Switch
                  checked={settings.notification_enabled === "on"}
                  onCheckedChange={(checked) =>
                    handleChange("notification_enabled", checked ? "on" : "off")
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="space-y-2 max-w-2xl">
                <Label>Telegram Bot Username</Label>
                <Input
                  placeholder="@YourBotName"
                  value={settings.telegram_username || ""}
                  onChange={(e) =>
                    handleChange("telegram_username", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2 max-w-2xl">
                <Label>Telegram Bot API Token</Label>
                <Input
                  type="password"
                  placeholder="123456789:ABCDefghIJKLmnop..."
                  value={settings.telegram_token || ""}
                  onChange={(e) =>
                    handleChange("telegram_token", e.target.value)
                  }
                />
                <p className="text-xs text-slate-500">
                  กรุณาสร้างบอทผ่าน @BotFather ในแอปพลิเคชัน Telegram เพื่อรับ
                  Token นี้
                </p>
              </div>
              <div className="space-y-2 max-w-2xl">
                <Label>Frontend URL (สำหรับลิงก์ในแจ้งเตือน)</Label>
                <Input
                  placeholder="https://edms.tn.ac.th"
                  value={settings.frontend_url || ""}
                  onChange={(e) => handleChange("frontend_url", e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  ระบุ URL ของหน้าเว็บ (ไม่ต้องมี / ต่อท้าย)
                  เพื่อใช้สร้างลิงก์ใน Telegram
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
