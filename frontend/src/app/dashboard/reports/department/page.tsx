"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Printer,
  BarChart3,
  PieChart as PieIcon,
  Calendar,
  Users,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts"

import { PageHeader } from "@/components/dashboard/page-header"

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
]

// แปลงสถานะเป็นไทย
const statusLabel: Record<string, string> = {
  distributed: "รับเข้าฝ่ายแล้ว",
  pending_deputy: "รอ รองฯ สั่งการ",
  deputy_signed: "รอส่งหัวหน้างาน",
  sent_to_head: "ส่งหัวหน้างานแล้ว",
  completed: "เสร็จสิ้น",
}

export default function DeptReportPage() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

  const [startDate, setStartDate] = useState(
    firstDay.toISOString().split("T")[0],
  )
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0])
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      const res = await api.get("/api/v1/reports/department", {
        params: { start_date: startDate, end_date: endDate },
      })

      const formattedStatus = res.data.data.by_status.map((item: any) => ({
        ...item,
        name: statusLabel[item.name] || item.name,
      }))

      setData({ ...res.data.data, by_status: formattedStatus })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Header & Filter */}
      <div className="print:hidden">
        <PageHeader
          title="รายงานสรุปงานภายในฝ่าย"
          description="สถิติภาระงานและการกระจายงานระดับฝ่าย"
          icon={BarChart3}
        >
          <div className="flex flex-wrap items-end gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm w-full md:w-auto">
            <div className="flex-1 min-w-[140px] space-y-1">
              <Label className="text-[10px] text-slate-500 font-medium px-1">
                ตั้งแต่วันที่
              </Label>
              <Input
                type="date"
                className="h-9 text-xs"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[140px] space-y-1">
              <Label className="text-[10px] text-slate-500 font-medium px-1">
                ถึงวันที่
              </Label>
              <Input
                type="date"
                className="h-9 text-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button
              onClick={fetchReport}
              className="h-9 bg-theme-main hover:bg-theme-main/90 shadow-sm"
            >
              <Calendar className="w-4 h-4 mr-2" /> ค้นหา
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="h-9 border-slate-200 text-slate-600"
            >
              <Printer className="w-4 h-4 mr-2" /> พิมพ์
            </Button>
          </div>
        </PageHeader>
      </div>

      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">รายงานสรุปงานภายในฝ่าย</h1>
        <p className="text-sm text-slate-500 mt-1">
          ข้อมูลระหว่างวันที่ {startDate} ถึง {endDate}
        </p>
      </div>

      {/* สถิติรวม */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-l-4 border-l-(--theme-main) bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex justify-between items-center">
              รับหนังสือเข้าฝ่ายทั้งหมด
              <BarChart3 className="h-4 w-4 text-(--theme-main)" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-800">
              {data?.total_received || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ฉบับ (ในช่วงเวลาที่เลือก)
            </p>
          </CardContent>
        </Card>

        {/* สามารถเพิ่ม Card สถิติอื่นๆ ตรงนี้ได้ในอนาคต */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1 print:gap-10">
        {/* Pie Chart: สถานะงานในฝ่าย */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-500" />{" "}
              สถานะการดำเนินการในฝ่าย
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.by_status}
                  cx="50%"
                  cy="50%"
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data?.by_status?.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart: ภาระงานหัวหน้างาน */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />{" "}
              ภาระงานแยกตามหัวหน้างาน
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.by_head}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar
                  dataKey="value"
                  fill="#8b5cf6"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                  name="จำนวนงาน (ฉบับ)"
                >
                  {data?.by_head?.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
