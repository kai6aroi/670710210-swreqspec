import { render, screen, waitFor } from '@testing-library/react'
import SlotPicker from '../pages/SlotPicker.jsx'

const mockApi = {
  async getSlots({ dateFrom, packageCode }) {
    return [
      { id: 1, slot_date: dateFrom, start_time: '09:00', remaining: 4, package_code: packageCode },
      { id: 2, slot_date: dateFrom, start_time: '10:00', remaining: 2, package_code: packageCode },
    ]
  },
}

test('T-10 แสดงแพ็กเกจและช่วงเวลาว่างตาม API /slots', async () => {
  render(
    <SlotPicker
      apiClient={mockApi}
      initialPackage="pkg-a"
      initialDate="2026-09-23"
    />
  )

  expect(screen.getByText('เลือกแพ็กเกจและช่วงเวลา')).toBeTruthy()
  expect(screen.getByLabelText('วันที่')).toBeTruthy()

  await waitFor(() => {
    expect(screen.getByText('2026-09-23 09:00')).toBeTruthy()
    expect(screen.getByText('เหลือ 4 ที่นั่ง')).toBeTruthy()
  })

  expect(screen.getByRole('button', { name: /แพ็กเกจ A/i })).toBeTruthy()
})
