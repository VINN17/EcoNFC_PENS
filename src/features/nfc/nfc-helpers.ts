/**
 * Helper util untuk Web NFC: pengecekan support, parsing, dan penyusunan payload NDEF.
 */

import type { DeviceConfig, NfcScanResult } from "./types"

/**
 * Mengecek ketersediaan Web NFC pada browser saat ini.
 */
export function isWebNfcAvailable(): boolean {
  return typeof (window as any).NDEFReader !== "undefined"
}

/**
 * Mencoba parse record NDEF menjadi JSON string. Mengembalikan string atau null.
 * Catatan: Kita prioritaskan record berjenis 'text' atau mime 'application/json'.
 */
export function extractJsonStringFromRecords(records: any[]): string | null {
  // Penanganan umum untuk record Web NFC
  for (const rec of records ?? []) {
    try {
      // Chrome mengisi recordType: "text" untuk string.
      if (rec.recordType === "text") {
        // data bisa berupa string langsung atau DataView
        if (typeof rec.data === "string") return rec.data
        if (rec.data && typeof rec.data === "object" && "buffer" in rec.data) {
          const dv = rec.data as DataView
          const dec = new TextDecoder()
          return dec.decode(dv.buffer)
        }
      }
      // MIME JSON
      if ((rec.mediaType === "application/json") || (rec.recordType === "mime" && rec.mediaType === "application/json")) {
        if (rec.data && typeof rec.data === "object" && "buffer" in rec.data) {
          const dv = rec.data as DataView
          const dec = new TextDecoder()
          return dec.decode(dv.buffer)
        }
        if (typeof rec.data === "string") return rec.data
      }
    } catch {
      // Abaikan record yang gagal diproses
    }
  }
  return null
}

/**
 * Validasi sangat sederhana untuk memastikan minimal field penting ada.
 * Kembalikan DeviceConfig atau lempar error bila tidak valid.
 */
export function validateBasicConfig(obj: any): DeviceConfig {
  if (!obj || typeof obj !== "object") throw new Error("Payload bukan objek konfigurasi yang valid")
  if (!obj.deviceId || !obj.wifi || !obj.wifi.ssid || !obj.server || !obj.server.url) {
    throw new Error("Konfigurasi minimal harus berisi deviceId, wifi.ssid, dan server.url")
  }
  // Normalisasi tipe
  const cfg: DeviceConfig = {
    version: obj.version ?? "1.0",
    deviceId: String(obj.deviceId),
    publishInterval: obj.publishInterval != null ? Number(obj.publishInterval) : 60,
    wifi: {
      ssid: String(obj.wifi.ssid),
      password: obj.wifi.password ? String(obj.wifi.password) : undefined,
    },
    server: {
      url: String(obj.server.url),
      port: obj.server.port != null ? Number(obj.server.port) : undefined,
      tls: Boolean(obj.server.tls),
      token: obj.server.token ? String(obj.server.token) : undefined,
      topic: obj.server.topic ? String(obj.server.topic) : undefined,
    },
  }
  return cfg
}

/**
 * Mencoba memproses event reading dari Web NFC menjadi NfcScanResult.
 */
export function toScanResult(e: any): NfcScanResult {
  const serialNumber = e?.serialNumber
  const records = e?.message?.records ?? []
  const rawJson = extractJsonStringFromRecords(records)
  let config: DeviceConfig | null = null
  if (rawJson) {
    try {
      const obj = JSON.parse(rawJson)
      config = validateBasicConfig(obj)
    } catch {
      config = null
    }
  }
  return { serialNumber, rawPayload: rawJson ?? undefined, config }
}

/**
 * Membuat string JSON siap tulis ke NDEF.
 */
export function buildConfigJson(config: DeviceConfig): string {
  const payload = {
    version: config.version ?? "1.0",
    deviceId: config.deviceId,
    publishInterval: config.publishInterval ?? 60,
    wifi: {
      ssid: config.wifi.ssid,
      password: config.wifi.password ?? "",
    },
    server: {
      url: config.server.url,
      port: config.server.port ?? null,
      tls: !!config.server.tls,
      token: config.server.token ?? "",
      topic: config.server.topic ?? "",
    },
  }
  return JSON.stringify(payload)
}
