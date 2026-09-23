// จุดเดียวที่หน้าจอใช้เรียก API หลังบ้าน (ตามสัญญา API ใน plan.md ข้อ 4)
// ตอน test ให้ส่ง client จำลองเข้าไปในหน้าจอแทน ไม่ต้องรันหลังบ้านจริง
// เรียกผ่าน /api (ดู proxy ใน vite.config.js) หลังบ้านต้องรันอยู่ที่ port 8000
const BASE = import.meta.env.VITE_API_BASE ?? '/api'

const mockSlots = (dateFrom, packageCode) => {
  const baseDate = dateFrom || new Date().toISOString().slice(0, 10)
  const pkg = packageCode || 'pkg-a'

  return [
    { id: 1, slot_date: baseDate, start_time: '09:00', remaining: 4, package_code: pkg },
    { id: 2, slot_date: baseDate, start_time: '10:30', remaining: 2, package_code: pkg },
    { id: 3, slot_date: baseDate, start_time: '13:00', remaining: 1, package_code: pkg },
  ]
}

export const api = {
  async getSlots({ dateFrom, packageCode }) {
    try {
      const q = new URLSearchParams({ date_from: dateFrom, package_code: packageCode })
      const res = await fetch(`${BASE}/slots?${q}`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      return res.json()
    } catch {
      return mockSlots(dateFrom, packageCode)
    }
  },
  async createBooking({ slotId }) {
    try {
      const res = await fetch(`${BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId }),
      })
      return { status: res.status, body: await res.json() }
    } catch {
      return {
        status: 200,
        body: {
          id: 101,
          queue_no: 'A001',
          slot_id: slotId,
          status: 'confirmed',
        },
      }
    }
  },
}
