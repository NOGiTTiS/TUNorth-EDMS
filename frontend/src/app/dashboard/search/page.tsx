'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';

import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Loader2, Search, FilterX, ChevronLeft, ChevronRight } from 'lucide-react';

interface Document {
  ID: number;
  receive_no: string;
  receive_date: string;
  doc_no: string;      // <--- เพิ่มบรรทัดนี้
  doc_date: string;    // <--- เพิ่มบรรทัดนี้ (เผื่อใช้)
  subject: string;
  from: string;
  status: string;
  file_path: string;
  CreatedAt: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false); // เริ่มต้น false รอคนกดค้นหา หรือจะให้โหลดเลยก็ได้

  // Search States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [year, setYear] = useState('0');
  const [month, setMonth] = useState('0');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Debounce Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Data
  useEffect(() => {
    fetchDocuments();
  }, [debouncedSearch, year, month, page]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/v1/documents', {
        params: {
          search: debouncedSearch,
          year: year,
          month: month,
          page: page,
          limit: 20 // หน้าค้นหาแสดงเยอะหน่อย
        }
      });
      setDocuments(res.data.data);
      setTotalPages(res.data.total_pages);
      setTotalItems(res.data.total);
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถค้นหาข้อมูลได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSearch('');
    setYear('0');
    setMonth('0');
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="outline" className="text-slate-500">ร่าง</Badge>;
      case 'pending_director': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">รอ ผอ.</Badge>;
      case 'director_signed': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">ผอ. สั่งการแล้ว</Badge>;
      case 'distributed': return <Badge variant="secondary" className="bg-purple-100 text-purple-800">ถึงฝ่ายแล้ว</Badge>;
      case 'sent_to_head': return <Badge variant="secondary" className="bg-green-100 text-green-800">เสร็จสิ้น</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Search className="w-8 h-8 text-theme-main" /> ค้นหาหนังสือ
        </h1>
        <p className="text-slate-500 mt-1">สืบค้นเอกสารย้อนหลังและติดตามสถานะหนังสือ</p>
      </div>

      {/* Search Box Card */}
      <Card className="shadow-md border-t-4 border-t-theme-main">
        <CardContent className="p-6 space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <Input 
                    placeholder="พิมพ์คำค้นหา... (เช่น ชื่อเรื่อง, เลขรับ, หน่วยงาน)" 
                    className="pl-10 h-12 text-lg"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            
            <div className="flex gap-4">
                <Select value={month} onValueChange={(v) => { setMonth(v); setPage(1); }}>
                    <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="เดือน" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">ทุกเดือน</SelectItem>
                        {['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'].map((m, i) => (
                            <SelectItem key={i} value={(i+1).toString()}>{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={year} onValueChange={(v) => { setYear(v); setPage(1); }}>
                    <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="ปี" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">ทุกปี</SelectItem>
                        {yearOptions.map(y => (
                            <SelectItem key={y} value={y.toString()}>{y + 543}</SelectItem> 
                        ))}
                    </SelectContent>
                </Select>

                <Button variant="outline" onClick={handleReset} title="ล้างค่าค้นหา">
                    <FilterX className="h-4 w-4 mr-2" /> ล้างค่า
                </Button>
            </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50 border-b py-4">
            <CardTitle className="text-base font-medium text-slate-600">
                ผลการค้นหา ({totalItems} รายการ)
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white">
                <TableRow>
                  <TableHead className="w-[120px] text-center">เลขรับ</TableHead>
                  <TableHead className="w-[120px]">ลงวันที่</TableHead>
                  <TableHead>เรื่อง</TableHead>
                  <TableHead className="w-[200px]">จาก</TableHead>
                  <TableHead className="w-[150px] text-center">สถานะ</TableHead>
                  <TableHead className="w-[80px] text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-theme-main"/> กำลังค้นหา...</TableCell></TableRow>
                ) : documents.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">ไม่พบเอกสารที่ตรงกับคำค้นหา</TableCell></TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.ID} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-center font-medium text-slate-700">{doc.receive_no}</TableCell>
                      <TableCell className="text-slate-600">{doc.receive_date ? format(new Date(doc.receive_date), 'd MMM bb', { locale: th }) : '-'}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-800 line-clamp-1">{doc.subject}</div>
                        <div className="text-xs text-slate-400 mt-0.5">เลขที่หนังสือ: {doc.doc_no || '-'}</div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm truncate max-w-[200px]">{doc.from}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="text-theme-main hover:bg-slate-100" onClick={() => router.push(`/dashboard/documents/${doc.ID}`)}>
                          <FileText className="h-4 w-4 mr-1" /> เปิด
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/50">
          <div className="text-sm text-slate-500">หน้า {page} จาก {totalPages}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || isLoading}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isLoading}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

    </div>
  );
}