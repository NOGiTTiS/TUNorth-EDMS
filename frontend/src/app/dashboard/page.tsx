'use client';

import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Clock, BarChart3, FileText } from 'lucide-react';
import { PageHeader } from "@/components/dashboard/page-header"

export default function DashboardOverview() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto">
      <PageHeader
        title="ภาพรวม (Dashboard)"
        description={`ยินดีต้อนรับคุณ ${user?.full_name} เข้าสู่ระบบ`}
        icon={LayoutDashboard}
      />

      {/* สถิติเบื้องต้น (Placeholder สำหรับอนาคต) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">งานที่รอดำเนินการ</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">0 รายการ</div>
            <p className="text-xs text-slate-500 mt-1">หนังสือที่รอท่านสั่งการหรือเปิดอ่าน</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">หนังสือเข้าทั้งหมด (เดือนนี้)</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">0 ฉบับ</div>
            <p className="text-xs text-slate-500 mt-1">ปริมาณงานสารบรรณในเดือนปัจจุบัน</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">สถิติระบบ</CardTitle>
            <BarChart3 className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">กราฟ</div>
            <p className="text-xs text-slate-500 mt-1">จะแสดงผลในอัปเดตถัดไป</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}