'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, BarChart3, PieChart as PieIcon, Calendar, Users } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// แปลงสถานะเป็นไทย
const statusLabel: Record<string, string> = {
    distributed: 'รับเข้าฝ่ายแล้ว',
    pending_deputy: 'รอ รองฯ สั่งการ',
    deputy_signed: 'รอส่งหัวหน้างาน',
    sent_to_head: 'ส่งหัวหน้างานแล้ว',
    completed: 'เสร็จสิ้น'
};

export default function DeptReportPage() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await api.get('/api/v1/reports/department', {
        params: { start_date: startDate, end_date: endDate }
      });
      
      const formattedStatus = res.data.data.by_status.map((item: any) => ({
          ...item,
          name: statusLabel[item.name] || item.name
      }));

      setData({ ...res.data.data, by_status: formattedStatus });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-600" /> รายงานสรุปงานภายในฝ่าย
          </h1>
          <p className="text-slate-500 text-sm">สถิติภาระงานและการกระจายงานระดับฝ่าย</p>
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
            <Button onClick={fetchReport} className="h-8 bg-orange-600 hover:bg-orange-700">
                <Calendar className="w-3 h-3 mr-1"/> ค้นหา
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="h-8 border-slate-300">
                <Printer className="w-3 h-3 mr-1"/> พิมพ์
            </Button>
        </div>
      </div>

      <div className="hidden print:block text-center mb-8">
        <h1 className="text-xl font-bold">รายงานสรุปงานภายในฝ่าย</h1>
        <p className="text-sm">ข้อมูลระหว่างวันที่ {startDate} ถึง {endDate}</p>
      </div>

      {/* สถิติรวม */}
      <Card className="border-l-4 border-orange-500 bg-orange-50/50">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600">รับหนังสือเข้าฝ่ายทั้งหมด</CardTitle></CardHeader>
        <CardContent>
            <div className="text-4xl font-bold text-orange-700">{data?.total_received || 0}</div>
            <p className="text-xs text-orange-600 mt-1">ฉบับ ในช่วงเวลาที่เลือก</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1 print:gap-8">
        
        {/* Pie Chart: สถานะงานในฝ่าย */}
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><PieIcon className="w-4 h-4 text-blue-500"/> สถานะการดำเนินการในฝ่าย</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data?.by_status}
                            cx="50%" cy="50%"
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={100} fill="#8884d8" dataKey="value"
                        >
                            {data?.by_status?.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* Bar Chart: ภาระงานหัวหน้างาน */}
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-purple-500"/> ภาระงานแยกตามหัวหน้างาน</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.by_head} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={30} name="จำนวนงาน (ฉบับ)">
                             {data?.by_head?.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}