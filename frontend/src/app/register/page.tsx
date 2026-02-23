'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingStore } from '@/store/settingStore';
import api from '@/lib/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LockKeyhole, User, Loader2, Contact, Building2, Send } from 'lucide-react';
import Link from 'next/link';

interface Department {
  ID: number;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { settings, fetchSettings } = useSettingStore();

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    password: '',
    confirm_password: '',
    department_id: '',     // เพิ่ม
    telegram_chat_id: '',  // เพิ่ม
  });
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false); // เปิด/ปิด Modal ช่วยเหลือ
  const [isFetchingID, setIsFetchingID] = useState(false); // สถานะตอนดึง Chat ID

  // โหลด Settings และ รายชื่อฝ่าย
  useEffect(() => {
    fetchSettings();
    const fetchDepts = async () => {
        try {
            const res = await api.get('/api/v1/departments');
            setDepartments(res.data.data);
        } catch (error) {
            console.error("Failed to load departments");
        }
    }
    fetchDepts();
  }, [fetchSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirm_password) {
      return toast.error('รหัสผ่านไม่ตรงกัน');
    }
    if (!formData.department_id) {
        return toast.error('กรุณาเลือกสังกัดฝ่าย');
    }

    setIsLoading(true);

    // แปลงข้อมูลให้ตรงกับ Backend
    const payload = {
        ...formData,
        department_id: parseInt(formData.department_id),
        // telegram_chat_id ส่งไปตรงๆ ได้เลย
    };

    try {
      await api.post('/api/v1/register', payload);
      toast.success('สมัครสมาชิกสำเร็จ!', { description: 'กรุณาเข้าสู่ระบบด้วยบัญชีที่สร้าง' });
      router.push('/');
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');
      } else {
        toast.error('สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันดึง Chat ID ล่าสุด
  const fetchLatestChatID = async () => {
    setIsFetchingID(true);
    try {
        const res = await api.get('/api/v1/telegram/latest-id');
        const chatId = res.data.chat_id;
        setFormData(prev => ({ ...prev, telegram_chat_id: String(chatId) }));
        toast.success(`ดึง Chat ID สำเร็จ: ${chatId}`);
        setIsHelpOpen(false); // ปิด Modal
    } catch (error: any) {
        toast.error(error.response?.data?.error || 'ไม่พบ Chat ID ล่าสุด (ลองกด Start ที่บอทหรือยัง?)');
    } finally {
        setIsFetchingID(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    let cleanPath = path.replace(/\\/g, '/');
    if (cleanPath.startsWith('/loads')) cleanPath = cleanPath.replace('/loads', '/uploads');
    return `${process.env.NEXT_PUBLIC_API_URL}${cleanPath}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-grad p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-theme-main bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {settings.logo_url ? (
              <img src={getImageUrl(settings.logo_url)} alt="Logo" className="h-20 w-auto object-contain drop-shadow-sm" />
            ) : (
              <div className="w-16 h-16 bg-theme-main rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {settings.system_name?.charAt(0) || 'T'}
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-theme-main">สร้างบัญชีใหม่</CardTitle>
          <CardDescription className="text-slate-500 mt-2">กรอกข้อมูลเพื่อลงทะเบียนเข้าใช้งานระบบ</CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4 pt-2">
            
            {/* ชื่อ - นามสกุล */}
            <div className="space-y-2">
              <Label htmlFor="full_name">ชื่อ-สกุล</Label>
              <div className="relative">
                <Contact className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input id="full_name" placeholder="ชื่อจริง นามสกุล" className="pl-9 bg-yellow-50/50" value={formData.full_name} onChange={handleChange} required />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้ (Username)</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input id="username" placeholder="ตั้งชื่อผู้ใช้ (ภาษาอังกฤษ/ตัวเลข)" className="pl-9 bg-yellow-50/50" value={formData.username} onChange={handleChange} required />
              </div>
            </div>
            
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input id="password" type="password" placeholder="••••••" className="pl-9 bg-yellow-50/50" value={formData.password} onChange={handleChange} required />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm_password">ยืนยันรหัสผ่าน</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input id="confirm_password" type="password" placeholder="••••••" className="pl-9 bg-yellow-50/50" value={formData.confirm_password} onChange={handleChange} required />
              </div>
            </div>

            <hr className="border-slate-100 my-2" />

            {/* Department Select */}
            <div className="space-y-2">
                <Label>สังกัดฝ่าย</Label>
                <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
                    <Select onValueChange={(v) => setFormData({...formData, department_id: v})}>
                        <SelectTrigger className="pl-9 bg-slate-50">
                            <SelectValue placeholder="-- กรุณาเลือกฝ่าย --" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map(d => (
                                <SelectItem key={d.ID} value={d.ID.toString()}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Telegram Chat ID */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="telegram_chat_id">Telegram Chat ID (ถ้ามี)</Label>
                    <span 
                        className="text-xs text-theme-main cursor-pointer hover:underline flex items-center gap-1"
                        onClick={() => setIsHelpOpen(true)}
                    >
                        หา Chat ID ของฉัน
                    </span>
                </div>
                <div className="relative">
                    <Send className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                        id="telegram_chat_id" 
                        placeholder="123456789" 
                        className="pl-9 bg-slate-50" 
                        value={formData.telegram_chat_id} 
                        onChange={handleChange} 
                    />
                </div>
            </div>

          </CardContent>

          <CardFooter className="flex flex-col gap-4 pb-6">
            <Button type="submit" className="w-full bg-theme-main text-white hover:brightness-90 transition-all shadow-md h-12 mt-6 text-md font-semibold" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'สมัครสมาชิก'}
            </Button>
            
            <p className="text-sm text-slate-500 text-center mt-2">
              มีบัญชีอยู่แล้ว? <Link href="/" className="text-theme-main hover:underline font-semibold">เข้าสู่ระบบ</Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* --- Modal ช่วยหา Chat ID --- */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="text-xl text-center pb-2">วิธีหา Telegram Chat ID</DialogTitle>
                
                {/* 
                   แก้ตรงนี้: เติม prop "asChild" เข้าไป 
                   เพื่อให้มันเรนเดอร์ div ด้านในแทน p ของตัวมันเอง 
                   ทำให้ HTML Valid และแก้ Hydration Error
                */}
                <DialogDescription asChild>
                    <div className="text-slate-600 space-y-4 pt-2">
                        <div className="space-y-2">
                            <p>1. คลิกปุ่มด้านล่างเพื่อเปิดแชทกับบอทของเรา แล้วกด <b>"Start"</b> หรือส่งข้อความอะไรก็ได้ 1 ข้อความ</p>
                            <Button 
                                variant="outline" 
                                className="w-full border-theme-main bg-blue-50 text-theme-main hover:bg-blue-100"
                                onClick={() => window.open(`https://t.me/${settings.telegram_username?.replace('@', '')}`, '_blank')}
                            >
                                เปิดแชทกับ {settings.telegram_username || 'Bot'}
                            </Button>
                        </div>
                        
                        <div className="space-y-2 pt-2">
                            <p>2. กลับมาที่หน้านี้ แล้วคลิกปุ่ม <b>"ดึง Chat ID ล่าสุด"</b></p>
                        </div>
                    </div>
                </DialogDescription>

            </DialogHeader>
            <DialogFooter className="flex-col sm:justify-center gap-2 mt-4">
                <div className="flex w-full gap-2">
                    <Button 
                        className="flex-1 bg-theme-main hover:bg-theme-main/80" 
                        onClick={fetchLatestChatID}
                        disabled={isFetchingID}
                    >
                        {isFetchingID ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                        ดึง Chat ID ล่าสุด
                    </Button>
                    <Button variant="secondary" onClick={() => setIsHelpOpen(false)}>ปิด</Button>
                </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}