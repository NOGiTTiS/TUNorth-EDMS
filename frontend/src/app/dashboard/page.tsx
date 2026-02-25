"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LayoutDashboard,
  Clock,
  FileStack,
  BarChart3,
  Loader2,
} from "lucide-react" // เปลี่ยนไอคอนนิดหน่อย
import { PageHeader } from "@/components/dashboard/page-header"

// นำเข้า Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

// ชื่อเดือนภาษาไทย
const thaiMonths = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
]

export default function DashboardOverview() {
  const { user } = useAuthStore()

  const [stats, setStats] = useState({
    pending_works: 0,
    total_month: 0,
    monthly_stats: [] as { month: number; count: number }[],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/api/v1/dashboard/stats")
        setStats(res.data.data)
      } catch (error) {
        console.error("Failed to load stats")
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const getPendingLabel = () => {
    switch (user?.role) {
      case "director":
        return "รอท่านลงนาม/สั่งการ"
      case "admin_central":
        return "รอส่งต่อฝ่าย"
      case "admin_dept":
        return "รอเสนอเรื่องต่อ (ในฝ่าย)"
      case "deputy":
        return "รอท่านสั่งการ (ระดับฝ่าย)"
      case "head":
        return "งานที่ได้รับมอบหมาย (รอรับทราบ)"
      default:
        return "งานที่รอดำเนินการ"
    }
  }

  // เตรียมข้อมูลกราฟ (เติมเดือนที่ไม่มีข้อมูลให้เป็น 0)
  const chartData = thaiMonths.map((name, index) => {
    const found = stats.monthly_stats?.find((s) => s.month === index + 1)
    return {
      name: name,
      count: found ? found.count : 0,
    }
  })

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto">
      <PageHeader
        title="ภาพรวม (Dashboard)"
        description={`ยินดีต้อนรับคุณ ${user?.full_name} เข้าสู่ระบบสารบรรณอิเล็กทรอนิกส์`}
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: งานค้าง */}
        <Card className="shadow-sm border-l-4 border-l-(--theme-main) bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              งานที่รอดำเนินการ
            </CardTitle>
            <Clock className="h-4 w-4 text-(--theme-main)" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="animate-spin h-8 w-8 text-slate-300" />
            ) : (
              <div className="text-4xl font-bold text-slate-800">
                {stats.pending_works}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">{getPendingLabel()}</p>
          </CardContent>
        </Card>

        {/* Card 2: สถิติรวมเดือนนี้ */}
        <Card className="shadow-sm border-l-4 border-l-(--theme-main) bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              หนังสือเข้าทั้งหมด (เดือนนี้)
            </CardTitle>
            <FileStack className="h-4 w-4 text-(--theme-main)" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="animate-spin h-8 w-8 text-slate-300" />
            ) : (
              <div className="text-4xl font-bold text-slate-800">
                {stats.total_month}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              ฉบับ (ในเดือนปัจจุบัน)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* --- ส่วนกราฟ (วางไว้ด้านล่าง) --- */}
      <Card className="shadow-sm border-t-4" style={{ borderTopColor: 'var(--theme-main)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            {/* เปลี่ยน text-pink-500 เป็น class text-theme-main ที่เราเขียนไว้ใน Provider */}
            <BarChart3 className="h-5 w-5 text-theme-main" />
            สถิติปริมาณหนังสือเข้า (รายเดือน)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full mt-4">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                กำลังโหลดกราฟ...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false} // ไม่แสดงทศนิยม
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    cursor={{ fill: "#f1f5f9" }}
                  />
                  <Bar dataKey="count" name="จำนวนหนังสือ" radius={[4, 4, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      // เปลี่ยนจาก "#db2777" เป็น "var(--theme-main)"
                      <Cell key={`cell-${index}`} fill="var(--theme-main)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
