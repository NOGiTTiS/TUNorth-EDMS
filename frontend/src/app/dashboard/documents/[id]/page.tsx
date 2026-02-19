'use client';

import { useEffect, useState, use } from 'react';
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
import { ArrowLeft, Send, PenTool } from 'lucide-react';

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

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // จัดการ Params (Next.js 16)
  const [docId, setDocId] = useState<string | null>(null);
  
  useEffect(() => {
    params.then(p => setDocId(p.id));
  }, [params]);

  const router = useRouter();
  const { user } = useAuthStore();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State สำหรับฟอร์มเกษียร (Checkbox หลายตัวเลือก)
  // Default: เลือก "ทราบ" ไว้ก่อน
  const [selectedActions, setSelectedActions] = useState<string[]>(['ทราบ']);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ดึงข้อมูลหนังสือ
  useEffect(() => {
    if (!docId) return;
    const fetchDoc = async () => {
      try {
        const res = await api.get(`/api/v1/documents/${docId}`);
        setDocument(res.data.data);
      } catch (error) {
        console.error(error);
        toast.error("ไม่สามารถดึงข้อมูลหนังสือได้");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoc();
  }, [docId]);

  // Logic การเลือก Checkbox
  const toggleAction = (value: string) => {
    setSelectedActions((prev) => {
      // กรณี 1: ถ้ามีค่านี้อยู่แล้ว -> เอาออก (Uncheck)
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      } 
      // กรณี 2: ถ้ายังไม่มี -> เพิ่มเข้า (Check)
      else {
        // Logic พิเศษ: ถ้าเลือก "มอบหมาย/สั่งการ" ต้องเลือก "ทราบ" ด้วยอัตโนมัติ
        if (value === 'มอบหมาย/สั่งการ') {
           if (!prev.includes('ทราบ')) {
             return [...prev, value, 'ทราบ'];
           }
        }
        return [...prev, value];
      }
    });
  };

  // บันทึกข้อมูล (Submit)
  const handleKasien = async () => {
    if (!document) return;
    setIsSubmitting(true);
    
    // แปลง Array เป็น String คั่นด้วยคอมม่า (เช่น "ทราบ, มอบหมาย/สั่งการ")
    const actionString = selectedActions.join(', ');

    try {
      await api.post(`/api/v1/documents/${document.ID}/route`, {
        action: actionString,
        command_note: comment,
      });
      toast.success("บันทึกการสั่งการเรียบร้อยแล้ว");
      router.push('/dashboard'); // กลับไปหน้า Dashboard
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !docId) return <div className="p-10 text-center">กำลังโหลดข้อมูล...</div>;
  if (!document) return <div className="p-10 text-center">ไม่พบข้อมูล</div>;

  // แปลง Path เป็น URL เพื่อแสดงใน iframe
  const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL}/${document.file_path.replace('./', '')}`;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold truncate max-w-2xl">{document.subject}</h1>
          <p className="text-sm text-slate-500">
            เลขรับ: {document.receive_no} | ลงวันที่: {document.CreatedAt ? format(new Date(document.CreatedAt), 'd MMM yy', { locale: th }) : '-'}
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left: PDF Viewer */}
        <div className="flex-1 bg-slate-200 rounded-lg overflow-hidden shadow-inner border relative">
          <iframe 
            src={pdfUrl} 
            className="w-full h-full" 
            title="PDF Viewer"
          />
        </div>

        {/* Right: Action Panel */}
        <div className="w-[400px] flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
          
          {/* 1. ส่วนแสดงสถานะปัจจุบัน */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">สถานะดำเนินการ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-slate-700 mb-2">
                 สถานะ: <span className="text-pink-600">{document.status}</span>
              </div>
              <div className="text-xs text-slate-500">
                รอการสั่งการจากผู้อำนวยการโรงเรียน
              </div>
            </CardContent>
          </Card>

          {/* 2. ฟอร์มเกษียร (Action Form) */}
          <Card className="border-pink-200 shadow-md">
            <CardHeader className="bg-pink-50 pb-3 border-b border-pink-100">
              <CardTitle className="text-lg text-pink-700 flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                เกษียรสั่งการ
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              
              {/* Checkbox Options */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="c1" 
                    checked={selectedActions.includes('ทราบ')}
                    onCheckedChange={() => toggleAction('ทราบ')}
                  />
                  <Label htmlFor="c1" className="cursor-pointer font-normal">ทราบ</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="c2" 
                    checked={selectedActions.includes('อนุมัติ/อนุญาต')}
                    onCheckedChange={() => toggleAction('อนุมัติ/อนุญาต')}
                  />
                  <Label htmlFor="c2" className="cursor-pointer font-normal">อนุมัติ / อนุญาต</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="c3" 
                    checked={selectedActions.includes('เห็นชอบตามเสนอ')}
                    onCheckedChange={() => toggleAction('เห็นชอบตามเสนอ')}
                  />
                  <Label htmlFor="c3" className="cursor-pointer font-normal">เห็นชอบตามเสนอ</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="c4" 
                    checked={selectedActions.includes('มอบหมาย/สั่งการ')}
                    onCheckedChange={() => toggleAction('มอบหมาย/สั่งการ')}
                  />
                  <Label htmlFor="c4" className="cursor-pointer font-normal">มอบหมาย / สั่งการ</Label>
                </div>
              </div>

              <Separator />

              {/* Textarea */}
              <div className="space-y-2">
                <Label>ข้อความเพิ่มเติม / สั่งการ</Label>
                <Textarea 
                  placeholder="ระบุข้อความสั่งการ..." 
                  className="min-h-[100px]"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {/* Signature Preview */}
              <div className="bg-slate-50 p-3 rounded border text-center">
                <p className="text-xs text-slate-500 mb-1">ลงชื่ออิเล็กทรอนิกส์</p>
                {/* แสดงชื่อผู้ใช้งานปัจจุบัน */}
                <div className="font-bold text-slate-800">{user?.full_name || 'ผู้อำนวยการ'}</div>
                <div className="text-xs text-slate-500">{user?.role === 'director' ? 'ผู้อำนวยการโรงเรียน' : 'ตำแหน่ง...'}</div>
              </div>

              {/* Submit Button */}
              <Button 
                className="w-full bg-pink-600 hover:bg-pink-700 text-lg py-6"
                onClick={handleKasien}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกสั่งการ'} <Send className="ml-2 h-4 w-4" />
              </Button>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}