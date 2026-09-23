import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

// รองรับ FR-BKG-01, FR-BKG-06
export default function SlotPicker({
  apiClient = api,
  initialPackage = 'pkg-a',
  initialDate = new Date().toISOString().slice(0, 10),
}) {
  const packageOptions = ['pkg-a', 'pkg-b', 'pkg-c']
  const [selectedPackage, setSelectedPackage] = useState(initialPackage)
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadSlots() {
      setLoading(true)
      setError('')

      try {
        const payload = await apiClient.getSlots({
          dateFrom: selectedDate,
          packageCode: selectedPackage,
        })

        const nextSlots = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.slots)
            ? payload.slots
            : []

        if (!cancelled) {
          setSlots(nextSlots)
        }
      } catch (err) {
        if (!cancelled) {
          setError('ไม่สามารถโหลดช่วงเวลาว่างได้ในขณะนี้')
          setSlots([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSlots()

    return () => {
      cancelled = true
    }
  }, [apiClient, selectedDate, selectedPackage])

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">เลือกแพ็กเกจและช่วงเวลา</h2>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="booking-date" className="mb-2 block text-sm font-medium text-slate-700">
            วันที่
          </label>
          <input
            id="booking-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none ring-0"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">แพ็กเกจ</p>
          <div className="flex flex-wrap gap-2">
            {packageOptions.map((packageCode) => (
              <button
                key={packageCode}
                type="button"
                aria-pressed={selectedPackage === packageCode}
                onClick={() => setSelectedPackage(packageCode)}
                className={[
                  'rounded-full border px-4 py-2 text-sm font-medium transition',
                  selectedPackage === packageCode
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-teal-500 hover:text-teal-700',
                ].join(' ')}
              >
                {packageCode === 'pkg-a' ? 'แพ็กเกจ A' : packageCode === 'pkg-b' ? 'แพ็กเกจ B' : 'แพ็กเกจ C'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-slate-800">ช่วงเวลาว่าง</h3>

        {loading && <p className="mt-3 text-slate-600">กำลังโหลดช่วงเวลาว่าง...</p>}
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && slots.length === 0 && (
          <p className="mt-3 text-slate-600">ไม่มีช่วงเวลาว่างสำหรับแพ็กเกจนี้</p>
        )}

        {!loading && slots.length > 0 && (
          <ul className="mt-3 space-y-2">
            {slots.map((slot) => {
              const slotDate = slot.slot_date || slot.date || selectedDate
              const label = slot.start_time || slot.time || 'เวลาไม่ได้ระบุ'
              const remaining = slot.remaining ?? slot.remaining_seats ?? 0

              return (
                <li key={slot.id ?? `${slotDate}-${label}`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:border-teal-500 hover:bg-teal-50"
                  >
                    <span className="font-medium text-slate-800">
                      {slotDate} {label}
                    </span>
                    <span className="text-sm text-slate-600">เหลือ {remaining} ที่นั่ง</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
