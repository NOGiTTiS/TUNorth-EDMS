'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Route Protection: ถ้าไม่ได้ Login ให้ดีดกลับไปหน้า Login
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!user) return null;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-4">ยินดีต้อนรับ, {user.full_name}</h1>
      <p className="text-slate-600 mb-6">ตำแหน่ง: {user.role} (Dept ID: {user.dept_id})</p>
      
      <Button variant="destructive" onClick={() => {
        logout();
        router.push('/');
      }}>
        ออกจากระบบ
      </Button>
    </div>
  );
}