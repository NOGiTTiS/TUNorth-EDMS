import axios from 'axios';

// สร้าง instance ของ axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080', // URL Backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: ดักจับทุก Request เพื่อแนบ Token (ถ้ามี)
api.interceptors.request.use((config) => {
  // อ่าน Token จาก LocalStorage (ซึ่ง Zustand จะเป็นคนเก็บไว้ให้)
  // หมายเหตุ: เราจะเข้าถึง storage ผ่าน key ที่ zustand ตั้งไว้
  const storage = localStorage.getItem('auth-storage');
  if (storage) {
    const { state } = JSON.parse(storage);
    if (state?.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

export default api;