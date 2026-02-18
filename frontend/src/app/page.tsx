'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LockKeyhole, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. เรียก API Login
      const res = await api.post('/api/v1/login', { username, password });
      
      // 2. ถ้าสำเร็จ ดึง Token และถอดรหัส (ในที่นี้ Backend ส่ง Token มาอย่างเดียว เรา decode ง่ายๆ หรือใช้ lib ก็ได้)
      // เพื่อความง่าย เราจะเก็บ Token ไว้ก่อน ส่วนข้อมูล User ปกติควร decode จาก JWT 
      // แต่ใน Part นี้ผมจะสมมติข้อมูล User จาก Response หรือ Decode JWT (เดี๋ยวสอน Decode Part หน้า)
      // *แก้ขัด:* ให้ Backend ส่ง user info มาด้วยจะง่ายกว่า แต่ตอนนี้เราเก็บแค่ Token ก่อน
      const token = res.data.token;
      
      // Decode JWT แบบบ้านๆ (Base64) เพื่อเอา User Info
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const userData = JSON.parse(jsonPayload);

      // 3. บันทึกลง Store
      login(token, {
        user_id: userData.user_id,
        username: userData.username,
        role: userData.role,
        full_name: userData.full_name,
        dept_id: userData.dept_id
      });

      toast.success('เข้าสู่ระบบสำเร็จ');
      
      // 4. ไปหน้า Dashboard
      router.push('/dashboard');

    } catch (error: any) {
      console.error(error);
      toast.error('เข้าสู่ระบบไม่สำเร็จ', {
        description: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {/* Logo Placeholder */}
            <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              ต.อ.
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-pink-700">TUNorth EDMS</CardTitle>
          <CardDescription>
            ระบบสารบรรณอิเล็กทรอนิกส์<br/>โรงเรียนเตรียมอุดมศึกษา ภาคเหนือ
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้งาน</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  id="username" 
                  placeholder="admin" 
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••" 
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full mt-4 bg-pink-600 hover:bg-pink-700" disabled={isLoading}>
              {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}