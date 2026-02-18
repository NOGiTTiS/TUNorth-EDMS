'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from 'lucide-react';

export default function ReceiveDocumentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    receive_no: '',
    receive_date: new Date().toISOString().split('T')[0], // วันนี้ YYYY-MM-DD
    doc_no: '',
    doc_date: '',
    from: '',
    to: 'ผู้อำนวยการโรงเรียน',
    subject: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('กรุณาอัปโหลดไฟล์ PDF');
      return;
    }

    setIsLoading(true);
    
    // สร้าง FormData สำหรับส่งไฟล์
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    data.append('file', file);

    try {
      await api.post('/api/v1/documents', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('ลงรับหนังสือสำเร็จ');
      router.push('/dashboard'); // กลับไปหน้า Dashboard หรือหน้ารายการ
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">ลงทะเบียนรับหนังสือ</h1>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลหนังสือ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* แถว 1: เลขทะเบียนรับ + วันที่ลงรับ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="receive_no">เลขทะเบียนรับ</Label>
                <Input 
                  id="receive_no" 
                  name="receive_no" 
                  placeholder="เช่น 1234" 
                  value={formData.receive_no}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receive_date">วันที่ลงรับ</Label>
                <Input 
                  id="receive_date" 
                  name="receive_date" 
                  type="date" 
                  value={formData.receive_date}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            <hr />

            {/* แถว 2: ที่ + ลงวันที่ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="doc_no">ที่ (เลขหนังสือภายนอก)</Label>
                <Input 
                  id="doc_no" 
                  name="doc_no" 
                  placeholder="เช่น ศธ 04..." 
                  value={formData.doc_no}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc_date">ลงวันที่ (ในหนังสือ)</Label>
                <Input 
                  id="doc_date" 
                  name="doc_date" 
                  type="date" 
                  value={formData.doc_date}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            {/* แถว 3: จาก + ถึง */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="from">จาก (หน่วยงาน)</Label>
                <Input 
                  id="from" 
                  name="from" 
                  placeholder="ระบุหน่วยงานต้นทาง" 
                  value={formData.from}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to">ถึง (เรียน)</Label>
                <Input 
                  id="to" 
                  name="to" 
                  value={formData.to}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            {/* แถว 4: เรื่อง */}
            <div className="space-y-2">
              <Label htmlFor="subject">เรื่อง</Label>
              <Textarea 
                id="subject" 
                name="subject" 
                placeholder="ระบุชื่อเรื่อง..." 
                className="h-20"
                value={formData.subject}
                onChange={handleChange}
                required 
              />
            </div>

            {/* แถว 5: อัปโหลดไฟล์ */}
            <div className="space-y-2">
              <Label htmlFor="file" className="text-pink-600 font-medium">อัปโหลดไฟล์ต้นฉบับ (PDF เท่านั้น)</Label>
              <Input 
                id="file" 
                type="file" 
                accept="application/pdf"
                onChange={handleFileChange}
                required 
                className="cursor-pointer file:text-pink-600 file:font-semibold hover:file:bg-pink-50"
              />
              <p className="text-xs text-slate-500">รองรับไฟล์ PDF ขนาดไม่เกิน 10MB</p>
            </div>

          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>ยกเลิก</Button>
          <Button type="submit" className="bg-pink-600 hover:bg-pink-700 min-w-[150px]" disabled={isLoading}>
            {isLoading ? 'กำลังบันทึก...' : 'ลงรับหนังสือ'}
          </Button>
        </div>
      </form>
    </div>
  );
}