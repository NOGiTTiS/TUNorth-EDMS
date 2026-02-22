import type { Metadata } from "next"
import { Prompt } from "next/font/google"
import "./globals.css"
import "@/lib/canvas-patch"
import { Toaster } from "@/components/ui/sonner"
import ThemeProvider from "@/components/ThemeProvider"

// ตั้งค่าฟอนต์ Prompt
const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
})

// ตั้งค่า Metadata พื้นฐาน (SEO/Title)
export const metadata: Metadata = {
  title: "TUNorth EDMS",
  description: "ระบบสารบรรณอิเล็กทรอนิกส์ โรงเรียนเตรียมอุดมศึกษา ภาคเหนือ",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // แท็ก <html> และ <body> ต้องอยู่ที่นี่เสมอ
    <html lang="th">
      <body className={`${prompt.className} antialiased`}>
        {/* ครอบ ThemeProvider เพื่อให้ดึงสีจาก Settings มาใช้ได้ทั้งเว็บ */}
        <ThemeProvider>{children}</ThemeProvider>

        {/* ตัวแจ้งเตือน Toast */}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
