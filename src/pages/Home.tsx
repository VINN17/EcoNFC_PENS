/**
 * Halaman Home: Portal konfigurasi perangkat via NFC.
 * Menyajikan hero ringkas, peringatan kompatibilitas, dan panel konfigurasi NFC.
 */

import { Nfc } from "lucide-react"
import { Toaster } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Separator } from "../components/ui/separator"
import NfcConfigurator from "../features/nfc/NfcConfigurator"

/**
 * Komponen HomePage menampilkan pengantar dan komponen konfigurasi NFC.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      <Toaster position="top-right" richColors />
      <header className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow">
              <Nfc className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Konfigurasi Perangkat via NFC</h1>
              <p className="text-slate-600">Scan tag, isi Wi-Fi & server, lalu tulis konfigurasi ke NFC</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <NfcConfigurator />
          </div>
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Petunjuk Singkat</CardTitle>
                <CardDescription>Langkah aman & cepat untuk menyiapkan perangkat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="font-medium">1) Scan NFC</p>
                  <p className="text-sm text-slate-600">Tekan “Mulai Scan NFC” lalu tempelkan HP ke perangkat/tag.</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="font-medium">2) Isi Konfigurasi</p>
                  <p className="text-sm text-slate-600">Masukkan SSID, password Wi-Fi, dan alamat server tujuan.</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="font-medium">3) Tulis ke Tag</p>
                  <p className="text-sm text-slate-600">Tekan “Tulis ke NFC”, lalu tempelkan lagi HP ke tag untuk menyimpan.</p>
                </div>
                <Separator />
                <div className="rounded-lg overflow-hidden">
                  <img src="https://pub-cdn.sider.ai/u/U0NWHJXL2G5/web-coder/689720f8119369152a9d7098/resource/0554f037-fed2-4eaa-b322-41771500f4bf.jpg" className="object-cover" />
                </div>
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800 text-sm">
                  Catatan kompatibilitas: Web NFC saat ini optimal di Chrome Android. Jika perangkat Anda tidak mendukung,
                  Anda tetap bisa menyusun JSON konfigurasi sebagai alternatif.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
