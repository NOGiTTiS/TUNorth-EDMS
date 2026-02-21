'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Trash2 } from 'lucide-react';

// Type Department
interface Department {
  ID: number;
  name: string;
}

export default function ReceiveDocumentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    receive_no: '',
    receive_date: new Date().toISOString().split('T')[0],
    doc_no: '',
    doc_date: '',
    from: '',
    to: 'ผู้อำนวยการโรงเรียนเตรียมอุดมศึกษา ภาคเหนือ',
    subject: '',
    note_to_director: 'ทราบและพิจารณา',
  });
  const [file, setFile] = useState<File | null>(null);
  
  // Data for Stamping
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<number[]>([]);
  
  // Modal & Signature State
  const [isStampModalOpen, setIsStampModalOpen] = useState(false);
  const [tempDocId, setTempDocId] = useState<number | null>(null);
  const sigPad = useRef<SignatureCanvas>(null);

  // ดึงรายชื่อฝ่ายเมื่อ Component โหลด
  useEffect(() => {
    const fetchDepts = async () => {
        try {
            const res = await api.get('/api/v1/departments');
            setDepartments(res.data.data);
        } catch (error) {
            toast.error("ไม่สามารถดึงข้อมูลฝ่ายได้");
        }
    };
    fetchDepts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const toggleDept = (deptId: number) => {
    setSelectedDepts(prev => 
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  // Step 1: Submit Form & PDF
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('กรุณาอัปโหลดไฟล์ PDF');
      return;
    }
    if (selectedDepts.length === 0) {
      toast.error("กรุณาเลือกฝ่ายที่รับผิดชอบอย่างน้อย 1 ฝ่าย");
      return;
    }

    setIsLoading(true);
    
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    data.append('file', file);

    try {
      // Backend ต้องปรับแก้ API นี้ให้รับหนังสือเข้าโดยไม่เปลี่ยนสถานะทันที (เช่น "draft" หรือ "pending_stamp")
      const res = await api.post('/api/v1/documents', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setTempDocId(res.data.data.ID);
      setIsStampModalOpen(true);
      toast.success('บันทึกข้อมูลเบื้องต้นสำเร็จ', {
        description: 'กรุณาลงนามเพื่อยืนยันการประทับตรา'
      });

    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Confirm Stamp & Signature
  const handleConfirmStamp = async () => {
    if (!sigPad.current || sigPad.current.isEmpty()) {
        toast.error("กรุณาลงนามในช่องว่าง");
        return;
    }
    setIsLoading(true);

    const signatureData = sigPad.current.getTrimmedCanvas().toDataURL('image/png');

    try {
        await api.post(`/api/v1/documents/${tempDocId}/stamp`, {
            dept_ids: selectedDepts,
            signature_data: signatureData,
            note_to_director: formData.note_to_director // ส่งค่าไป Backend
        });
        toast.success("ประทับตราและส่งเสนอ ผอ. เรียบร้อย");
        setIsStampModalOpen(false);
        router.push('/dashboard');
    } catch(err) {
        console.error(err);
        toast.error("เกิดข้อผิดพลาดในการประทับตรา");
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">ลงทะเบียนรับหนังสือ</h1>
        
        <form onSubmit={handleInitialSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลหนังสือ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="receive_no">เลขทะเบียนรับ</Label><Input id="receive_no" name="receive_no" value={formData.receive_no} onChange={handleChange} required /></div>
                <div className="space-y-2"><Label htmlFor="receive_date">วันที่ลงรับ</Label><Input id="receive_date" name="receive_date" type="date" value={formData.receive_date} onChange={handleChange} required /></div>
              </div>
              <hr />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="doc_no">ที่ (เลขหนังสือภายนอก)</Label><Input id="doc_no" name="doc_no" value={formData.doc_no} onChange={handleChange} required /></div>
                <div className="space-y-2"><Label htmlFor="doc_date">ลงวันที่ (ในหนังสือ)</Label><Input id="doc_date" name="doc_date" type="date" value={formData.doc_date} onChange={handleChange} required /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="from">จาก (หน่วยงาน)</Label><Input id="from" name="from" value={formData.from} onChange={handleChange} required /></div>
                <div className="space-y-2"><Label htmlFor="to">ถึง (เรียน)</Label><Input id="to" name="to" value={formData.to} onChange={handleChange} required /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="subject">เรื่อง</Label><Textarea id="subject" name="subject" value={formData.subject} onChange={handleChange} required /></div>
              
              <div className="space-y-2">
                <Label className="font-semibold">ฝ่ายที่รับผิดชอบ (สำหรับประทับตรา)</Label>
                <div className="grid grid-cols-2 gap-2 border p-3 rounded-md bg-slate-50">
                    {departments.map(dept => (
                        <div key={dept.ID} className="flex items-center space-x-2">
                            <Checkbox id={`dept-${dept.ID}`} checked={selectedDepts.includes(dept.ID)} onCheckedChange={() => toggleDept(dept.ID)} />
                            <Label htmlFor={`dept-${dept.ID}`} className="font-normal cursor-pointer">{dept.name}</Label>
                        </div>
                    ))}
                </div>
              </div>

              {/* // 2. เพิ่มช่องกรอกในหน้าจอ (วางไว้ก่อนส่วนอัปโหลดไฟล์) */}
              <div className="space-y-2">
                <Label htmlFor="note_to_director" className="text-blue-600 font-bold">ข้อความเสนอ ผอ. (เพื่อโปรด...)</Label>
                <Input 
                  id="note_to_director" 
                  name="note_to_director" 
                  placeholder="เช่น ทราบและพิจารณา, ทราบและพิจารณาดำเนินการ"
                  value={formData.note_to_director}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file" className="text-pink-600 font-medium">อัปโหลดไฟล์ต้นฉบับ (PDF เท่านั้น)</Label>
                <Input id="file" type="file" accept="application/pdf" onChange={handleFileChange} required className="cursor-pointer" />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>ยกเลิก</Button>
            <Button type="submit" className="bg-pink-600 hover:bg-pink-700 min-w-[200px]" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'กำลังบันทึก...' : 'บันทึกและเตรียมประทับตรา'}
            </Button>
          </div>
        </form>
      </div>

      {/* Modal สำหรับเซ็นชื่อ */}
      <Dialog open={isStampModalOpen} onOpenChange={setIsStampModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>ลงนามและยืนยันการประทับตรา</DialogTitle>
            <DialogDescription>
              กรุณาลงนามในช่องด้านล่างเพื่อยืนยันการเสนอหนังสือถึงผู้อำนวยการ
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="rounded-lg border bg-slate-50 w-full h-[200px] shadow-inner">
              <SignatureCanvas
                ref={sigPad}
                penColor="blue"
                canvasProps={{ className: 'w-full h-full rounded-md' }}
              />
            </div>
            <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => sigPad.current?.clear()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    ล้างลายเซ็น
                </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStampModalOpen(false)}>ยกเลิก</Button>
            <Button className="bg-pink-600 hover:bg-pink-700" onClick={handleConfirmStamp} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              ยืนยันและส่งเสนอ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}