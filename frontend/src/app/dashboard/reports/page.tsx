'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Printer, BarChart3, PieChart as PieIcon, Calendar } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';

// สีสำหรับกราฟ Pie
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// แปลงสถานะเป็นภาษาไทยสำหรับแสดงในกราฟ
const statusLabel: Record<string, string> = {
    draft: 'ร่าง',
    pending_director: 'รอ ผอ.',
    director_signed: 'ผอ. สั่งการแล้ว',
    distributed: 'ถึงธุรการฝ่าย',
    pending_deputy: 'รอ รองฯ',
    deputy_signed: 'รองฯ สั่งการแล้ว',
    sent_to_head: 'ส่งหัวหน้างาน',
    completed: 'เสร็จสิ้น'
};

export default function ReportPage() {
  // Default วันที่: ต้นเดือน - ปัจจุบัน
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/v1/reports/summary', {
        params: { start_date: startDate, end_date: endDate }
      });
      
      // แปลงข้อมูลสถานะเป็นภาษาไทย
      const formattedStatus = res.data.data.by_status.map((item: any) => ({
          ...item,
          name: statusLabel[item.name] || item.name
      }));

      setData({
          ...res.data.data,
          by_status: formattedStatus
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto print:p-0 print:max-w-none">
      
      {/* Header & Filter (ซ่อนตอน Print) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-pink-600" /> รายงานสรุปผลการดำเนินงาน
          </h1>
          <p className="text-slate-500 text-sm">สถิติปริมาณหนังสือและการปฏิบัติงานในระบบ</p>
        </div>
        
        <div className="flex items-end gap-2 bg-white p-2 rounded-lg border shadow-sm">
            <div className="space-y-1">
                <Label className="text-xs">ตั้งแต่วันที่</Label>
                <Input type="date" className="h-8" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
                <Label className="text-xs">ถึงวันที่</Label>
                <Input type="date" className="h-8" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <Button onClick={fetchReport} className="h-8 bg-slate-800 hover:bg-slate-900">
                <Calendar className="w-3 h-3 mr-1"/> ค้นหา
            </Button>
            <Button variant="outline" onClick={handlePrint} className="h-8 border-slate-300">
                <Printer className="w-3 h-3 mr-1"/> พิมพ์
            </Button>
        </div>
      </div>

      {/* ส่วนหัวกระดาษสำหรับ Print Only */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">รายงานสรุปงานสารบรรณอิเล็กทรอนิกส์</h1>
        <p>โรงเรียนเตรียมอุดมศึกษา ภาคเหนือ</p>
        <p className="text-sm mt-2">ข้อมูลระหว่างวันที่ {startDate} ถึง {endDate}</p>
      </div>

      {/* สถิติรวม */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-blue-500 bg-blue-50/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">หนังสือรับทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold text-blue-700">{data?.total_docs || 0}</div>
                <p className="text-xs text-blue-600 mt-1">ฉบับ ในช่วงเวลาที่เลือก</p>
            </CardContent>
        </Card>
        {/* สามารถเพิ่ม Card สถิติอื่นๆ ได้ที่นี่ */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1 print:gap-8">
        
        {/* กราฟวงกลม: สถานะเอกสาร */}
        <Card className="print:shadow-none print:border">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-theme-main"/> สัดส่วนสถานะเอกสาร
                </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data?.by_status}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="theme-main"
                                dataKey="value"
                            >
                                {data?.by_status?.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* กราฟแท่ง: ปริมาณงานแยกตามฝ่าย */}
        <Card className="print:shadow-none print:border print:break-before-auto">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-theme-main"/> ปริมาณงานแยกตามฝ่าย
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data?.by_department}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={30}>
                                {data?.by_department?.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill="#8b5cf6" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

      </div>
      
      {/* ตารางรายละเอียด (สำหรับ Print) */}
      <div className="hidden print:block mt-8">
        <h3 className="font-bold text-lg mb-2">สรุปข้อมูลเชิงตาราง</h3>
        <table className="w-full border-collapse border border-slate-300 text-sm">
            <thead>
                <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-2 text-left">ฝ่ายงาน</th>
                    <th className="border border-slate-300 p-2 text-right">จำนวนหนังสือรับ (ฉบับ)</th>
                </tr>
            </thead>
            <tbody>
                {data?.by_department?.map((dept: any, index: number) => (
                    <tr key={index}>
                        <td className="border border-slate-300 p-2">{dept.name}</td>
                        <td className="border border-slate-300 p-2 text-right">{dept.value}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

    </div>
  );
}