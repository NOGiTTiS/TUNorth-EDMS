'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation'; // เพิ่ม usePathname
import Link from 'next/link';
import { 
  LayoutDashboard, 
  FileInput, 
  Files, 
  Search, 
  Settings, 
  LogOut,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Shadcn Button

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null; // หรือ Loading spinner

  const menuItems = [
    { name: 'ภาพรวม (Dashboard)', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'ลงรับหนังสือ', icon: FileInput, href: '/dashboard/receive' }, // เมนูที่เราจะทำ
    { name: 'งานที่ต้องทำ', icon: Files, href: '/dashboard/tasks' },
    { name: 'ค้นหาหนังสือ', icon: Search, href: '/dashboard/search' },
    { name: 'ตั้งค่าระบบ', icon: Settings, href: '/dashboard/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r shadow-sm hidden md:flex flex-col">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold">
            ต.อ.
          </div>
          <span className="font-bold text-lg text-pink-700">TUNorth EDMS</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400" 
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                )}>
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              logout();
              router.push('/');
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            ออกจากระบบ
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white dark:bg-slate-800 border-b flex items-center justify-between px-6 md:hidden">
            <span className="font-bold">TUNorth EDMS</span>
            <Menu className="w-6 h-6" /> {/* Mobile Menu Trigger (ยังไม่ทำ logic) */}
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}