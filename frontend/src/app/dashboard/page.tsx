'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api'; // เรียก API
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Clock, BarChart3, FileText, Loader2 } from 'lucide-react';
import { PageHeader } from "@/components/dashboard/page-header"

export default function DashboardOverview() {
  const { user } = useAuthStore();
  
  // State สำหรับเก็บข้อมูลสถิติ
  const [stats, setStats] = useState({
    pending_works: 0,
    total_month: 0,
    completed: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // ดึงข้อมูลเมื่อเข้าหน้าเว็บ
  useEffect(() => {
    const fetchStats = async () => {
        try {
            const res = await api.get('/api/v1/dashboard/stats');
            setStats(res.data.data);
        } catch (error) {
            console.error("Failed to load stats");
        } finally {
            setIsLoading(false);
        }
    }
    fetchStats();
  }, []);

  // ฟังก์ชันเปลี่ยนคำอธิบายตาม Role
  const getPendingLabel = () => {
    switch (user?.role) {
        case 'director': return 'รอท่านลงนาม/สั่งการ';
        case 'admin_central': return 'รอส่งต่อฝ่าย';
        case 'admin_dept': return 'รอเสนอเรื่องต่อ (ในฝ่าย)';
        case 'deputy': return 'รอท่านสั่งการ (ระดับฝ่าย)';
        case 'head': return 'งานที่ได้รับมอบหมาย (รอรับทราบ)';
        default: return 'งานที่รอดำเนินการ';
    }
  };

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto">
      <PageHeader
        title="ภาพรวม (Dashboard)"
        description={`ยินดีต้อนรับคุณ ${user?.full_name} เข้าสู่ระบบสารบรรณอิเล็กทรอนิกส์`}
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: งานค้าง (สำคัญที่สุด) */}
        <Card className="shadow-sm border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">งานที่รอดำเนินการ</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <Loader2 className="animate-spin h-6 w-6 text-slate-400" />
            ) : (
                <div className="text-3xl font-bold text-slate-800">{stats.pending_works} รายการ</div>
            )}
            <p className="text-xs text-slate-500 mt-1">{getPendingLabel()}</p>
          </CardContent>
        </Card>

        {/* Card 2: สถิติรวมเดือนนี้ */}
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">หนังสือเข้าทั้งหมด (เดือนนี้)</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <Loader2 className="animate-spin h-6 w-6 text-slate-400" />
            ) : (
                <div className="text-3xl font-bold text-slate-800">{stats.total_month} ฉบับ</div>
            )}
            <p className="text-xs text-slate-500 mt-1">ปริมาณงานสารบรรณในเดือนปัจจุบัน</p>
          </CardContent>
        </Card>

        {/* Card 3: Placeholder หรือกราฟ */}
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