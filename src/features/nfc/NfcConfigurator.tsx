/**
 * Panel konfigurasi NFC: scan tag, isi formulir, dan tulis konfigurasi.
 * Dirancang sebagai wizard 3 langkah dengan validasi ringan.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, Nfc, Save, Server, Wifi } from "lucide-react"

import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Separator } from "../../components/ui/separator"
import { Switch } from "../../components/ui/switch"
import { Textarea } from "../../components/ui/textarea"

import type { DeviceConfig } from "./types"
import { buildConfigJson, isWebNfcAvailable, toScanResult, validateBasicConfig } from "./nfc-helpers"

/**
 * Nilai default konfigurasi baru.
 */
const defaultConfig: DeviceConfig = {
  version: "1.0",
  deviceId: "",
  publishInterval: 60,
  wifi: { ssid: "", password: "" },
  server: { url: "", port: 443, tls: true, token: "", topic: "" },
}

/**
 * Komponen label langkah visual sederhana.
 */
function StepBadge(props: { index: number; active?: boolean; done?: boolean; label: string }) {
  const { index, active, done, label } = props
  return (
    <div className="flex items-center gap-2">
      <div
        className={[
          "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold",
          done ? "bg-emerald-600 text-white" : active ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700",
        ].join(" ")}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : index}
      </div>
      <span className={active ? "font-medium text-slate-900" : "text-slate-600"}>{label}</span>
    </div>
  )
}

/**
 * Komponen utama konfigurator NFC.
 */
export default function NfcConfigurator() {
  const [supported, setSupported] = useState<boolean>(false)
  const [scanning, setScanning] = useState<boolean>(false)
  const [activeStep, setActiveStep] = useState<number>(1)
  const [serial, setSerial] = useState<string | undefined>(undefined)
  const [rawRead, setRawRead] = useState<string>("")
  const ndefRef = useRef<any>(null)

  const { register, handleSubmit, setValue, watch, reset, formState } = useForm<DeviceConfig>({
    mode: "onChange",
    defaultValues: defaultConfig,
  })

  const watchAll = watch()

  useEffect(() => {
    // Cek ketersediaan Web NFC
    const ok = isWebNfcAvailable()
    setSupported(ok)
  }, [])

  /**
   * Memulai proses scan NFC dan mengisi form jika ada payload konfigurasi.
   */
  const startScan = async () => {
    if (!supported) {
      toast.error("Web NFC tidak didukung di perangkat/browser ini.")
      return
    }
    try {
      const ndef = new (window as any).NDEFReader()
      ndefRef.current = ndef
      await ndef.scan()
      setScanning(true)
      toast.info("Pemindaian dimulai. Tempelkan HP ke tag/perangkat.")
      ndef.onreading = (e: any) => {
        const res = toScanResult(e)
        setSerial(res.serialNumber)
        if (res.rawPayload) setRawRead(res.rawPayload)
        if (res.config) {
          // Isi form dengan konfigurasi yang terbaca
          reset(res.config)
          toast.success("Konfigurasi terdeteksi dari tag.")
          setActiveStep(2)
        } else {
          toast("Tag terbaca, namun tidak ada konfigurasi valid. Silakan isi konfigurasi baru.")
          setActiveStep(2)
        }
      }
      ndef.onreadingerror = () => {
        toast.error("Gagal membaca tag. Coba ulangi.")
      }
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        toast.error("Izin NFC ditolak. Izinkan akses NFC untuk melanjutkan.")
      } else {
        toast.error("Tidak dapat memulai scan NFC.")
      }
      setScanning(false)
    }
  }

  /**
   * Menulis konfigurasi ke NFC dalam format NDEF Text (payload JSON).
   */
  const onWrite = async (data: DeviceConfig) => {
    // Validasi minimum sebelum tulis
    let normalized: DeviceConfig
    try {
      normalized = validateBasicConfig(data)
    } catch (e: any) {
      toast.error(e?.message ?? "Konfigurasi belum lengkap.")
      return
    }
    const jsonStr = buildConfigJson(normalized)
    if (!supported) {
      toast.warning("Web NFC tidak tersedia. Salin JSON di bawah untuk metode lain.")
      return
    }
    try {
      const ndef = ndefRef.current ?? new (window as any).NDEFReader()
      ndefRef.current = ndef
      // Tulisan harus dipicu gesture user (klik tombol ini)
      await ndef.write(jsonStr)
      toast.success("Konfigurasi berhasil ditulis ke NFC.")
      setActiveStep(3)
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        toast.error("Izin NFC ditolak saat menulis.")
      } else {
        toast.error("Gagal menulis ke NFC. Coba ulang dan tempelkan lebih dekat.")
      }
    }
  }

  /**
   * Membuat JSON pratinjau untuk ditampilkan.
   */
  const previewJson = useMemo(() => {
    try {
      const normalized = validateBasicConfig({
        ...watchAll,
        // Jika field kosong, validasi akan melempar. Kita tangani di try/catch.
      })
      return buildConfigJson(normalized)
    } catch {
      return buildConfigJson({
        ...defaultConfig,
        deviceId: watchAll.deviceId || "",
        wifi: { ssid: watchAll?.wifi?.ssid || "", password: watchAll?.wifi?.password || "" },
        server: {
          url: watchAll?.server?.url || "",
          port: watchAll?.server?.port ?? 443,
          tls: !!watchAll?.server?.tls,
          token: watchAll?.server?.token || "",
          topic: watchAll?.server?.topic || "",
        },
        publishInterval: watchAll.publishInterval ?? 60,
      })
    }
  }, [watchAll])

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Nfc className="h-5 w-5" />
          Konfigurasi via NFC
        </CardTitle>
        <CardDescription>Scan tag untuk membaca konfigurasi lama, atau isi baru dan tulis ke NFC.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stepper */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
          <StepBadge index={1} active={activeStep === 1} done={activeStep > 1} label="Scan NFC" />
          <StepBadge index={2} active={activeStep === 2} done={activeStep > 2} label="Isi Konfigurasi" />
          <StepBadge index={3} active={activeStep === 3} done={activeStep > 3} label="Tulis ke NFC" />
        </div>

        {!supported && (
          <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">Web NFC tidak terdeteksi</p>
              <p className="text-sm">
                Gunakan Chrome Android untuk membaca/menulis NFC. Anda tetap bisa menyusun konfigurasi di bawah dan
                menyalin JSON untuk metode alternatif.
              </p>
            </div>
          </div>
        )}

        {/* Bagian Scan */}
        <div className="rounded-lg border bg-white">
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Nfc className="h-4 w-4 text-slate-600" />
                <p className="text-sm text-slate-700">
                  Status: {supported ? (scanning ? "Memindai..." : "Siap memindai") : "Tidak didukung"}
                </p>
              </div>
              <Button
                variant="outline"
                className="bg-transparent"
                onClick={startScan}
                disabled={!supported}
              >
                Mulai Scan NFC
              </Button>
            </div>
            {serial && (
              <p className="text-xs text-slate-500">Serial Tag: {serial}</p>
            )}
            {rawRead && (
              <div className="rounded-md bg-slate-50 border text-slate-700">
                <div className="px-3 py-2 text-xs font-medium border-b bg-slate-100">Payload Terbaca (JSON)</div>
                <pre className="p-3 text-xs overflow-auto">{rawRead}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Form Konfigurasi */}
        <div className="rounded-lg border bg-white">
          <div className="p-4 space-y-5">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-slate-600" />
              <h3 className="font-medium">Wi‑Fi</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ssid">SSID</Label>
                <Input id="ssid" placeholder="Nama Wi‑Fi" {...register("wifi.ssid", { required: true })} />
                {formState.errors?.wifi?.ssid && (
                  <p className="text-xs text-rose-600 mt-1">SSID wajib diisi.</p>
                )}
              </div>
              <div>
                <Label htmlFor="wifipass">Password</Label>
                <Input id="wifipass" type="password" placeholder="******" {...register("wifi.password")} />
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-slate-600" />
              <h3 className="font-medium">Server</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="url">URL/Host</Label>
                <Input id="url" placeholder="https://api.server.com atau mqtt://broker.local" {...register("server.url", { required: true })} />
                {formState.errors?.server?.url && (
                  <p className="text-xs text-rose-600 mt-1">URL/host server wajib diisi.</p>
                )}
              </div>
              <div>
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="443"
                  {...register("server.port", { valueAsNumber: true })}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <Label htmlFor="tls">TLS/HTTPS</Label>
                  <p className="text-xs text-slate-500">Aktifkan untuk koneksi aman</p>
                </div>
                <Switch
                  id="tls"
                  checked={!!watchAll?.server?.tls}
                  onCheckedChange={(v) => setValue("server.tls", v)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="token">Token/API Key (opsional)</Label>
                <Input id="token" placeholder="contoh: Bearer xxxxxx" {...register("server.token")} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="topic">Topic/Endpoint (opsional)</Label>
                <Input id="topic" placeholder="mis: devices/{deviceId}/telemetry" {...register("server.topic")} />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deviceId">Device ID</Label>
                <Input id="deviceId" placeholder="mis: esp32-001" {...register("deviceId", { required: true })} />
                {formState.errors?.deviceId && (
                  <p className="text-xs text-rose-600 mt-1">Device ID wajib diisi.</p>
                )}
              </div>
              <div>
                <Label htmlFor="interval">Publish Interval (detik)</Label>
                <Input
                  id="interval"
                  type="number"
                  placeholder="60"
                  {...register("publishInterval", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview JSON */}
        <div className="rounded-lg border bg-white">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4 text-slate-600" />
              <h3 className="font-medium">Pratinjau Payload JSON</h3>
            </div>
            <Textarea value={previewJson} readOnly className="font-mono text-xs h-44" />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="bg-transparent"
                onClick={() => {
                  navigator.clipboard.writeText(previewJson)
                  toast.success("JSON disalin ke clipboard.")
                }}
              >
                Salin JSON
              </Button>
              <Button
                onClick={() => {
                  reset(defaultConfig)
                  setRawRead("")
                  setSerial(undefined)
                  setActiveStep(1)
                }}
                variant="outline"
                className="bg-transparent"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Pastikan HP ditempel rapat ke tag saat membaca/menulis.
        </div>
        <Button onClick={handleSubmit(onWrite)} className="bg-slate-900 hover:bg-slate-800 text-white">
          <Save className="h-4 w-4 mr-2" />
          Tulis ke NFC
        </Button>
      </CardFooter>
    </Card>
  )
}
