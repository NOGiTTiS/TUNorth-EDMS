'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, PlusCircle, ExternalLink } from 'lucide-react';

// Type สำหรับข้อมูลหนังสือ (ตรงกับ Backend)
interface Document {
  ID: number;
  receive_no: string;
  receive_date: string;
  subject: string;
  from: string;
  status: string;
  file_path: string;
  CreatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ดึงข้อมูลเมื่อเข้าหน้าเว็บ
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get('/api/v1/documents');
        setDocuments(res.data.data);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  // ฟังก์ชันแปลงสถานะเป็น Badge สีต่างๆ
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_director':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">รอ ผอ. สั่งการ</Badge>;
      case 'director_signed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">ผอ. สั่งการแล้ว</Badge>;
      case 'distributed':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">แจกจ่ายแล้ว</Badge>;
      case 'sent_to_head':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">ดำเนินการเสร็จสิ้น</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // ฟังก์ชันเปิดไฟล์ PDF
 const openPdf = (docId: number) => {
    // เปลี่ยนเป็นไปหน้า Detail
    router.push(`/dashboard/documents/${docId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            ภาพรวม (Dashboard)
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            รายการหนังสือเข้าล่าสุด และสถานะการดำเนินการ
          </p>
        </div>
        
        {/* ปุ่มลัดสำหรับ Admin */}
        {user?.role === 'admin_central' && (
            <Button 
              className="bg-pink-600 hover:bg-pink-700"
              onClick={() => router.push('/dashboard/receive')}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              ลงรับหนังสือใหม่
            </Button>
        )}
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-lg">ทะเบียนหนังสือรับ</CardTitle>
          <CardDescription>แสดงรายการหนังสือรับล่าสุด 20 รายการ</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px] text-center">ทะเบียนรับ</TableHead>
                <TableHead className="w-[120px]">วันที่ลงรับ</TableHead>
                <TableHead>เรื่อง</TableHead>
                <TableHead className="w-[150px]">จาก</TableHead>
                <TableHead className="w-[150px] text-center">สถานะ</TableHead>
                <TableHead className="w-[100px] text-center">ไฟล์</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                    ไม่พบข้อมูลหนังสือในระบบ
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.ID} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-center">{doc.receive_no}</TableCell>
                    <TableCell>
                      {format(new Date(doc.receive_date), 'd MMM yyyy', { locale: th })}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{doc.subject}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        สร้างเมื่อ: {format(new Date(doc.CreatedAt), 'd MMM yyyy HH:mm', { locale: th })}
                      </div>
                    </TableCell>
                    <TableCell>{doc.from}</TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(doc.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                        onClick={() => openPdf(doc.ID)} // ส่ง ID แทน Path
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        เปิด
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}