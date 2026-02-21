'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import SignatureCanvas from 'react-signature-canvas';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Send, 
  PenTool, 
  Share2, 
  CheckCircle2, 
  RotateCcw,
  FileText
} from 'lucide-react';

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

interface Department {
  ID: number;
  name: string;
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [docId, setDocId] = useState<string | null>(null);
  useEffect(() => {
    params.then(p => setDocId(p.id));
  }, [params]);

  const router = useRouter();
  const { user } = useAuthStore();
  
  // Data States
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Director States (ผอ.) ---
  const [selectedActions, setSelectedActions] = useState<string[]>(['ทราบ']);
  const [comment, setComment] = useState('');
  const sigPad = useRef<SignatureCanvas>(null);
  
  // --- Admin States (ธุรการ) ---
  const [selectedDepts, setSelectedDepts] = useState<number[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!docId) return;

    const fetchData = async () => {
      try {
        const docRes = await api.get(`/api/v1/documents/${docId}`);
        setDocument(docRes.data.data);
        const deptRes = await api.get('/api/v1/departments');
        setDepartments(deptRes.data.data);
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูลได้");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [docId]);

  // Logic: ผอ. เลือกคำสั่งการ
  const toggleAction = (value: string) => {
    setSelectedActions((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      } else {
        if (value === 'มอบหมาย/สั่งการ' && !prev.includes('ทราบ')) {
          return [...prev, value, 'ทราบ'];
        }
        return [...prev, value];
      }
    });
  };

  // Logic: ผอ. บันทึกเกษียร (ลงนามสด)
  const handleKasien = async () => {
    if (!document) return;
    if (!sigPad.current || sigPad.current.isEmpty()) {
      toast.error("กรุณาลงนามเกษียรหนังสือ");
      return;
    }

    setIsSubmitting(true);
    const signatureData = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
    const actionString = selectedActions.join(', ');

    try {
      await api.post(`/api/v1/documents/${document.ID}/route`, {
        action: actionString,
        command_note: comment,
        signature_data: signatureData
      });
      toast.success("ลงนามและบันทึกการสั่งการเรียบร้อยแล้ว");
      router.push('/dashboard');
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Logic: ธุรการแจกจ่าย
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

  if (isLoading || !docId) return <div className="p-10 text-center flex items-center justify-center h-screen"><Loader2 className="animate-spin mr-2"/> กำลังโหลด...</div>;
  if (!document) return <div className="p-10 text-center">ไม่พบข้อมูล</div>;

  const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL}/${document.file_path.replace('./', '')}`;

  return (
    <div className="h-[calc(100vh-40px)] flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center gap-4 mb-4 bg-white p-4 rounded-lg shadow-sm border">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold truncate">{document.subject}</h1>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>เลขรับ: {document.receive_no}</span>
            <span>|</span>
            <span>ลงวันที่: {document.CreatedAt ? format(new Date(document.CreatedAt), 'd MMM yy', { locale: th }) : '-'}</span>
          </div>
        </div>
        <Badge variant="outline" className="bg-slate-50">{document.status}</Badge>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Left: PDF Viewer */}
        <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden border shadow-inner">
          <iframe src={pdfUrl} className="w-full h-full" title="PDF Viewer" />
        </div>

        {/* Right: Action Panel */}
        <div className="w-full md:w-[420px] flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
          
          {/* FLOW 1: สำหรับผู้อำนวยการ (เกษียรหนังสือ) */}
          {user?.role === 'director' && document.status === 'pending_director' && (
            <Card className="border-pink-200 shadow-md">
              <CardHeader className="bg-pink-50 pb-3 border-b border-pink-100">
                <CardTitle className="text-lg text-pink-700 flex items-center gap-2">
                  <PenTool className="h-5 w-5" /> เกษียรสั่งการ (ผอ.)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                <div className="flex flex-col gap-3">
                  {['ทราบ', 'อนุมัติ/อนุญาต', 'เห็นชอบตามเสนอ', 'มอบหมาย/สั่งการ'].map((act) => (
                    <div key={act} className="flex items-center space-x-2">
                      <Checkbox 
                        id={act} 
                        checked={selectedActions.includes(act)} 
                        onCheckedChange={() => toggleAction(act)} 
                      />
                      <Label htmlFor={act} className="cursor-pointer font-normal text-sm">{act}</Label>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">ข้อความสั่งการเพิ่มเติม</Label>
                  <Textarea 
                    placeholder="พิมพ์บันทึกข้อความ..." 
                    className="min-h-[80px] text-sm bg-slate-50"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-pink-700 font-bold flex justify-between">
                    ลงนามเกษียรหนังสือ
                    <Button variant="ghost" size="sm" onClick={() => sigPad.current?.clear()} className="h-6 text-[10px]">
                      <RotateCcw className="h-3 w-3 mr-1"/> ล้าง
                    </Button>
                  </Label>
                  <div className="rounded-lg border-2 border-pink-100 bg-white w-full h-[150px]">
                    <SignatureCanvas
                      ref={sigPad}
                      penColor="blue"
                      canvasProps={{ className: 'w-full h-full' }}
                    />
                  </div>
                  <div className="text-center py-2 border rounded bg-slate-50">
                    <div className="font-bold text-slate-800 text-sm">{user?.full_name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">ผู้อำนวยการโรงเรียน</div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-pink-600 hover:bg-pink-700 h-12 text-md"
                  onClick={handleKasien}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'ลงนามและบันทึกสั่งการ'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* FLOW 2: สำหรับธุรการ (แจกจ่ายฝ่าย) */}
          {user?.role === 'admin_central' && document.status === 'director_signed' && (
            <Card className="border-blue-200 shadow-md">
              <CardHeader className="bg-blue-50 pb-3 border-b border-blue-100">
                <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                  <Share2 className="h-5 w-5" /> แจกจ่ายหนังสือ
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-xs text-yellow-800">
                  ผอ. ลงนามแล้ว กรุณาเลือกฝ่ายเพื่อส่งต่อแจ้งเตือน
                </div>
                <div className="grid grid-cols-1 gap-1 border p-3 rounded bg-slate-50 max-h-[250px] overflow-y-auto">
                  {departments.map(dept => (
                    <div key={dept.ID} className="flex items-center space-x-3 p-2 hover:bg-white rounded transition-colors border border-transparent">
                      <Checkbox 
                        id={`dept-${dept.ID}`} 
                        checked={selectedDepts.includes(dept.ID)}
                        onCheckedChange={() => setSelectedDepts(prev => prev.includes(dept.ID) ? prev.filter(id => id !== dept.ID) : [...prev, dept.ID])}
                      />
                      <Label htmlFor={`dept-${dept.ID}`} className="text-sm cursor-pointer flex-1">{dept.name}</Label>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-blue-600 h-12" onClick={handleDistribute} disabled={isSubmitting}>
                  {isSubmitting ? 'กำลังส่ง...' : 'ยืนยันการแจกจ่าย'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* FLOW 3: สำหรับสถานะแจกจ่ายแล้ว */}
          {document.status === 'distributed' && (
             <Card className="bg-green-50 border-green-200">
               <CardContent className="pt-6 text-center space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                  <div className="font-bold text-green-800">ดำเนินการเสร็จสิ้น</div>
                  <p className="text-xs text-green-600">หนังสือถูกส่งต่อถึงฝ่ายเรียบร้อยแล้ว</p>
               </CardContent>
             </Card>
          )}

        </div>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <RotateCcw className={className} />;
}