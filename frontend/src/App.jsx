import SlotPicker from './pages/SlotPicker.jsx'
import { api } from './api/client.js'

const today = new Date().toISOString().slice(0, 10)

export default function App() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <SlotPicker apiClient={api} initialPackage="pkg-a" initialDate={today} />
    </main>
  )
}
