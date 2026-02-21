import { create } from 'zustand';
import api from '@/lib/api';

interface SettingState {
  settings: Record<string, string>;
  fetchSettings: () => Promise<void>;
  updateLocalSettings: (newSettings: Record<string, string>) => void;
}

export const useSettingStore = create<SettingState>((set) => ({
  settings: {
    system_name: 'TUNorth EDMS',
    system_description: 'ระบบสารบรรณอิเล็กทรอนิกส์ โรงเรียนเตรียมอุดมศึกษา ภาคเหนือ',
    copyright: '© 2026 TUNorth',
    logo_url: '',
    favicon_url: '',
    theme_main_color: '#db2777', // สีชมพู
    theme_bg_gradient_start: '#fdf2f8', // พื้นหลังชมพูอ่อน
    theme_bg_gradient_end: '#ffffff',
  },
  fetchSettings: async () => {
    try {
      const res = await api.get('/api/v1/settings');
      if (res.data.data && Object.keys(res.data.data).length > 0) {
        // แก้ไขบรรทัดนี้: ให้ดึง state เดิมมาผสมกับข้อมูลจาก DB
        set((state) => ({ 
            settings: { ...state.settings, ...res.data.data } 
        }));
      }
    } catch (e) { console.error(e); }
  },
  updateLocalSettings: (newSettings) => set({ settings: newSettings }),
}));