'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, PenTool, Share2, CheckCircle2 } from 'lucide-react';

// Type ข้อมูลหนังสือ
interface DocumentDetail {
  ID: number;
  receive_no: string;
  receive_date: string;
  subject: string;
  from: string;
  file_path: string;
  status: string;
  CreatedAt: string;
}

// Type ข้อมูลฝ่าย
interface Department {
  ID: number;
  name: string;
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. จัดการ Params (Next.js 16)
  const [docId, setDocId] = useState<string | null>(null);
  useEffect(() => {
    params.then(p => setDocId(p.id));
  }, [params]);

  const router = useRouter();
  const { user } = useAuthStore();
  
  // Data State
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Director State (ผอ.) ---
  const [selectedActions, setSelectedActions] = useState<string[]>(['ทราบ']);
  const [comment, setComment] = useState('');
  
  // --- Admin State (ธุรการ) ---
  const [selectedDepts, setSelectedDepts] = useState<number[]>([]);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Fetch Data
  useEffect(() => {
    if (!docId) return;

    const fetchData = async () => {
      try {
        // ดึงข้อมูลหนังสือ
        const docRes = await api.get(`/api/v1/documents/${docId}`);
        setDocument(docRes.data.data);

        // ดึงข้อมูลฝ่าย (เตรียมไว้สำหรับ Admin แจกจ่าย)
        const deptRes = await api.get('/api/v1/departments');
        setDepartments(deptRes.data.data);

      } catch (error) {
        console.error(error);
        toast.error("ไม่สามารถดึงข้อมูลได้");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [docId]);

  // 3. Logic: ผอ. เกษียรหนังสือ
  const toggleAction = (value: string) => {
    setSelectedActions((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      } else {
        // Logic พิเศษ: เลือก "มอบหมาย" ต้องเลือก "ทราบ" ด้วย
        if (value === 'มอบหมาย/สั่งการ') {
           if (!prev.includes('ทราบ')) {
             return [...prev, value, 'ทราบ'];
           }
        }
        return [...prev, value];
      }
    });
  };

  const handleKasien = async () => {
    if (!document) return;
    setIsSubmitting(true);
    const actionString = selectedActions.join(', ');

    try {
      await api.post(`/api/v1/documents/${document.ID}/route`, {
        action: actionString,
        command_note: comment,
      });
      toast.success("บันทึกการสั่งการเรียบร้อยแล้ว");
      router.push('/dashboard');
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Logic: ธุรการ แจกจ่ายหนังสือ
  const toggleDept = (deptId: number) => {
    setSelectedDepts(prev => 
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  const handleDistribute = async () => {
    if (selectedDepts.length === 0) {
        toast.error("กรุณาเลือกฝ่ายอย่างน้อย 1 ฝ่าย");
        return;
    }
    setIsSubmitting(true);
    try {
        await api.post(`/api/v1/documents/${document?.ID}/distribute`, {
            dept_ids: selectedDepts
        });
        toast.success("แจกจ่ายหนังสือเรียบร้อยแล้ว");
        router.push('/dashboard');
    } catch (err) {
        toast.error("เกิดข้อผิดพลาดในการแจกจ่าย");
    } finally {
        setIsSubmitting(false);
    }
  };

  // Render Loading / Error
  if (isLoading || !docId) return <div className="p-10 text-center flex items-center justify-center h-full"><div className="animate-pulse">กำลังโหลดข้อมูล...</div></div>;
  if (!document) return <div className="p-10 text-center">ไม่พบข้อมูล</div>;

  // PDF URL
  const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL}/${document.file_path.replace('./', '')}`;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center gap-4 mb-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold truncate text-slate-800 dark:text-slate-100">{document.subject}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
            <Badge variant="outline" className="font-normal">เลขรับ: {document.receive_no}</Badge>
            <span>ลงวันที่: {document.CreatedAt ? format(new Date(document.CreatedAt), 'd MMM yy', { locale: th }) : '-'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Left: PDF Viewer */}
        <div className="flex-1 bg-slate-200 rounded-lg overflow-hidden shadow-inner border relative min-h-[400px]">
          <iframe 
            src={pdfUrl} 
            className="w-full h-full" 
            title="PDF Viewer"
          />
        </div>

        {/* Right: Action Panel */}
        <div className="w-full md:w-[400px] flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
          
          {/* 1. Status Card */}
          <Card>
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base flex justify-between items-center">
                สถานะดำเนินการ
                <Badge variant={document.status === 'distributed' ? 'default' : 'secondary'}>
                    {document.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-slate-500">
                {document.status === 'pending_director' && 'รอผู้อำนวยการลงนามสั่งการ'}
                {document.status === 'director_signed' && 'ผอ. สั่งการแล้ว รอธุรการแจกจ่าย'}
                {document.status === 'distributed' && 'แจกจ่ายไปยังฝ่ายเรียบร้อยแล้ว'}
              </div>
            </CardContent>
          </Card>

          {/* ========================================================= */}
          {/* FLOW 1: ผู้อำนวยการ (Director Workflow)                   */}
          {/* แสดงเมื่อ: User เป็น Director และ สถานะเป็น pending_director */}
          {/* ========================================================= */}
          {user?.role === 'director' && document.status === 'pending_director' && (
            <Card className="border-pink-200 shadow-md">
                <CardHeader className="bg-pink-50 pb-3 border-b border-pink-100">
                <CardTitle className="text-lg text-pink-700 flex items-center gap-2">
                    <PenTool className="h-5 w-5" />
                    เกษียรสั่งการ
                </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-6">
                
                {/* Checkboxes */}
                <div className="flex flex-col gap-3">
                    {['ทราบ', 'อนุมัติ/อนุญาต', 'เห็นชอบตามเสนอ', 'มอบหมาย/สั่งการ'].map((action) => (
                        <div key={action} className="flex items-center space-x-2">
                            <Checkbox 
                                id={action} 
                                checked={selectedActions.includes(action)}
                                onCheckedChange={() => toggleAction(action)}
                            />
                            <Label htmlFor={action} className="cursor-pointer font-normal text-base">{action}</Label>
                        </div>
                    ))}
                </div>

                <Separator />

                <div className="space-y-2">
                    <Label>ข้อความเพิ่มเติม</Label>
                    <Textarea 
                        placeholder="ระบุข้อความสั่งการ..." 
                        className="min-h-[100px] bg-slate-50"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>

                {/* Signature Block */}
                <div className="bg-slate-50 p-3 rounded border text-center border-dashed border-slate-300">
                    <p className="text-xs text-slate-400 mb-1">ลงชื่ออิเล็กทรอนิกส์</p>
                    <div className="font-bold text-slate-800 text-lg">{user?.full_name}</div>
                    <div className="text-xs text-slate-500">ผู้อำนวยการโรงเรียน</div>
                </div>

                <Button 
                    className="w-full bg-pink-600 hover:bg-pink-700 text-lg py-6 shadow-lg shadow-pink-200"
                    onClick={handleKasien}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกสั่งการ'} <Send className="ml-2 h-4 w-4" />
                </Button>

                </CardContent>
            </Card>
          )}


          {/* ========================================================= */}
          {/* FLOW 2: ธุรการกลาง (Admin Workflow)                       */}
          {/* แสดงเมื่อ: User เป็น Admin และ สถานะเป็น director_signed     */}
          {/* ========================================================= */}
          {user?.role === 'admin_central' && document.status === 'director_signed' && (
            <Card className="border-blue-200 shadow-md">
                <CardHeader className="bg-blue-50 pb-3 border-b border-blue-100">
                    <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        แจกจ่ายหนังสือ
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800">
                        <strong>สถานะ:</strong> ผอ. สั่งการแล้ว กรุณาเลือกฝ่ายเพื่อส่งต่อ
                    </div>

                    <div className="space-y-2">
                        <Label className="text-base font-semibold">เลือกฝ่ายที่รับผิดชอบ</Label>
                        <div className="grid grid-cols-1 gap-2 border p-3 rounded max-h-[300px] overflow-y-auto bg-slate-50">
                            {departments.length === 0 ? (
                                <div className="text-center text-sm text-slate-400 py-4">ไม่พบข้อมูลฝ่าย</div>
                            ) : (
                                departments.map(dept => (
                                    <div key={dept.ID} className="flex items-center space-x-3 p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-200">
                                        <Checkbox 
                                            id={`dept-${dept.ID}`} 
                                            checked={selectedDepts.includes(dept.ID)}
                                            onCheckedChange={() => toggleDept(dept.ID)}
                                        />
                                        <Label htmlFor={`dept-${dept.ID}`} className="font-normal cursor-pointer flex-1">
                                            {dept.name}
                                        </Label>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="text-xs text-slate-500 text-right">
                            เลือกแล้ว {selectedDepts.length} ฝ่าย
                        </div>
                    </div>

                    <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 shadow-lg shadow-blue-200"
                        onClick={handleDistribute}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'กำลังส่ง...' : 'ยืนยันการแจกจ่าย'} <Send className="ml-2 h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>
          )}

          {/* ========================================================= */}
          {/* FLOW 3: เสร็จสิ้น (Finished)                              */}
          {/* ========================================================= */}
          {document.status === 'distributed' && (
             <div className="p-6 bg-green-50 text-green-700 rounded-lg border border-green-200 text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
                <h3 className="font-bold text-lg">ดำเนินการเสร็จสิ้น</h3>
                <p className="text-sm">หนังสือถูกแจกจ่ายไปยังฝ่ายที่เกี่ยวข้องเรียบร้อยแล้ว</p>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}