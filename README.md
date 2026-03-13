# TUNorth-EDMS (Electronic Document Management System)

ระบบจัดการเอกสารอิเล็กทรอนิกส์ (EDMS) พัฒนาขึ้นเพื่อจัดการงานเอกสารภายในองค์กรให้เป็นระบบ มีการสร้างเอกสาร การอนุมัติเอกสาร การจัดการสิทธิ์ผู้ใช้งาน และระบบรายงานผล รองรับการแสดงผลภาษาไทยอย่างเต็มรูปแบบ

## 🛠 Tech Stack

**Frontend:**

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
- **State Management:** Zustand
- **Form & Validation:** React Hook Form, Zod
- **Features:** React Signature Canvas (สำหรับลายเซ็นต์), Recharts (แผนภูมิ)

**Backend:**

- **Language/Framework:** [Go 1.25.5](https://golang.org/), [Fiber v2](https://gofiber.io/)
- **Database ORM:** GORM
- **Authentication:** JWT (JSON Web Tokens)
- **Features:** GoPDF (สำหรับสร้างไฟล์ PDF), Telegram Bot API

**Database & Infrastructure:**

- PostgreSQL 17
- Docker & Docker Compose
- Adminer (Database Management)

---

## 🚀 การติดตั้งและรันโปรเจค (Development)

การรันโปรเจคนี้แบบง่ายที่สุดคือผ่าน Docker Compose ซึ่งจะเตรียมสภาพแวดล้อมทั้งหมด (Frontend, Backend, Database, Adminer) ให้พร้อมใช้งานทันที พร้อมระบบ Hot Reload

### 1. ลอกเลียนแบบ / ดึงโค้ด (Clone)

```bash
git clone https://github.com/NOGiTTiS/TUNorth-EDMS.git
cd TUNorth-EDMS
```

### 2. รันโปรเจคด้วย Docker Compose

```bash
docker-compose up -d --build
```

ระบบจะทำการดาวน์โหลดและ Build image ที่เกี่ยวข้อง (อาจใช้เวลาสักครู่ในการรันครั้งแรก)

### 3. บริการที่เปิดใช้งาน:

| Service         | พอร์ต (Port) | URL สำหรับเข้าใช้งาน    | ข้อมูลเข้าสู่ระบบ (เริ่มต้น)                                                                                                  |
| --------------- | ------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**    | 3000         | `http://localhost:3000` | -                                                                                                                             |
| **Backend API** | 8080         | `http://localhost:8080` | -                                                                                                                             |
| **Adminer**     | 8880         | `http://localhost:8880` | **System**: PostgreSQL<br>**Server**: db<br>**Username**: admin<br>**Password**: password123<br>**Database**: tunorth_edms_db |

### 4. การหยุดและลบ Container

หากต้องการหยุดการทำงาน:

```bash
docker-compose down
```

_(หมายเหตุ: ข้อมูล Database จะยังคงอยู่เนื่องจากมีการใช้ Volume map เอาไว้)_

---

## 📦 โครงสร้างโปรเจค (Project Structure)

```
TUNorth-EDMS/
├── backend/                  # โค้ดส่วนหลังและ API (Go Fiber)
│   ├── main.go               # จุดเริ่มต้นของระบบฝั่ง Backend
│   ├── go.mod                # จัดการ Packages (Go)
│   └── Dockerfile            # ตั้งค่า Docker Image ฝั่ง Backend มีระบบ Air (Hot reload)
├── frontend/                 # โค้ดส่วนหน้าทั้งหมด (React/Next.js)
│   ├── src/                  # Source Code ส่วนใหญ่ (Pages, Components)
│   ├── package.json          # จัดการ Packages (Node.js)
│   └── Dockerfile            # ตั้งค่า Docker Image ฝั่ง Frontend
├── docker-compose.yml        # รันโปรเจครูปแบบ Development
├── docker-compose-prod.yml   # รันโปรเจครูปแบบ Production
└── README.md                 # รายละเอียดโปรเจค (ไฟล์นี้)
```

---

## 🔑 ฟีเจอร์เด่น (Key Features)

1. **ระบบสมาชิก (Authentication)**
   - ระบบลงชื่อเข้าใช้ด้วย JWT และสิทธิ์การใช้งาน
   - ระบบจดจำการเข้าระบบ (Persistent Session) ไม่เด้งหลุดเมื่อรีเฟรชหน้าเว็บ

2. **ระบบจัดการเอกสาร (Document Management)**
   - สร้าง ค้นหา และตรวจสอบสถานะเอกสาร
   - ระบุสถานะเอกสารได้ชัดเจนด้วยภาษาไทย (รอดำเนินการ, อนุมัติแล้ว, ฯลฯ)
   - รายงานเอกสารแยกตามแผนก / ห้อง
   - รองรับการเซ็นเอกสารอิเล็กทรอนิกส์ (E-Signature) ผ่านหน้าจอสัมผัสหรือเมาส์

3. **ส่งออกข้อมูลรายงาน (Export & PDF)**
   - สามารถสร้างเอกสาร PDF (GoPDF)
   - สรุปและส่งออกข้อมูลรูปแบบ Excel ได้

4. **การแจ้งเตือนและการเชื่อมต่อภายนอก (Integrations)**
   - รองรับการแจ้งเตือนผ่าน Telegram Bot อัตโนมัติ

---

## 🚢 การเปิดใช้งานบน Production (Deployment)

เมื่อต้องการนำโปรเจคขึ้นจำลองหรือใช้งานจริง โปรเจคจะใช้การทำงานในรูปแบบ Multi-stage Build เพื่อประหยัดพื้นที่ และเพิ่มประสิทธิภาพ

```bash
docker-compose -f docker-compose-prod.yml up -d --build
```

_(สามารถปรับแก้ไขตัวแปรต่างๆ เพิ่มเติมในไฟล์หรือเพิ่ม Environment เพื่อความปลอดภัยได้อีกที)_
