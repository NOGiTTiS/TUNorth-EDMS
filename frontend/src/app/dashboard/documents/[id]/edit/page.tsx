'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

export default function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const [docId, setDocId] = useState<string | null>(null);
  useEffect(() => {
    params.then(p => setDocId(p.id));
  }, [params]);

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    receive_no: '',
    receive_date: '',
    doc_no: '',
    doc_date: '',
    from: '',
    to: '',
    subject: '',
  });

  useEffect(() => {
    if (!docId) return;
    const fetchDoc = async () => {
      try {
        const res = await api.get(`/api/v1/documents/${docId}`);
        const data = res.data.data;
        setFormData({
            receive_no: data.receive_no,
            // ตัด Timezone ออก เอาแค่วันที่ YYYY-MM-DD
            receive_date: data.receive_date ? data.receive_date.split('T')[0] : '',
            doc_no: data.doc_no,
            doc_date: data.doc_date ? data.doc_date.split('T')[0] : '',
            from: data.from,
            to: data.to,
            subject: data.subject,
        });
      } catch (error) {
        toast.error("ไม่พบข้อมูลหนังสือ");
        router.push('/dashboard');
      } finally {
        setIsFetching(false);
      }
    };
    fetchDoc();
  }, [docId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.put(`/api/v1/documents/${docId}`, formData);
      toast.success('แก้ไขข้อมูลสำเร็จ');
      router.push('/dashboard');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="p-10 text-center flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-slate-800">แก้ไขข้อมูลหนังสือ</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle>อัปเดตรายละเอียด</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label>เลขทะเบียนรับ</Label>
                  <Input name="receive_no" value={formData.receive_no} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                  <Label>วันที่ลงรับ</Label>
                  <Input name="receive_date" type="date" value={formData.receive_date} onChange={handleChange} required />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label>ที่ (เลขในหนังสือ)</Label>
                  <Input name="doc_no" value={formData.doc_no} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                  <Label>ลงวันที่</Label>
                  <Input name="doc_date" type="date" value={formData.doc_date} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2">
                <Label>เรื่อง</Label>
                <Textarea name="subject" value={formData.subject} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label>จาก</Label>
                  <Input name="from" value={formData.from} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                  <Label>ถึง</Label>
                  <Input name="to" value={formData.to} onChange={handleChange} required />
              </div>
            </div>

            {/* Note: การแก้ไขนี้จะเปลี่ยนเฉพาะข้อมูลในระบบค้นหา (Database) ไม่ได้ไปแก้ตัวอักษรในไฟล์ PDF ที่ประทับตราไปแล้ว */}
            <p className="text-xs text-slate-400 italic pt-4">
              * หมายเหตุ: การแก้ไขข้อมูลนี้จะเป็นการอัปเดตข้อมูลในระบบฐานข้อมูล เพื่อการค้นหาที่ถูกต้องเท่านั้น จะไม่ส่งผลต่อข้อความในไฟล์ PDF ที่ถูกประทับตราไปแล้ว
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>ยกเลิก</Button>
            <Button type="submit" className="bg-theme-main hover:bg-theme-main" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                บันทึกการแก้ไข
            </Button>
        </div>
      </form>
    </div>
  );
}