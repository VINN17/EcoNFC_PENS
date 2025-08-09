/**
 * Tipe data dan antarmuka untuk konfigurasi perangkat via NFC.
 */

/**
 * Konfigurasi jaringan Wi-Fi.
 */
export interface WifiConfig {
  /** SSID dari jaringan Wi-Fi */
  ssid: string
  /** Password Wi-Fi, bisa kosong untuk open network */
  password?: string
}

/**
 * Konfigurasi server tujuan (MQTT/REST).
 */
export interface ServerConfig {
  /** URL atau host server, misal: https://api.server.com atau mqtt://broker.local */
  url: string
  /** Port server, opsional */
  port?: number
  /** Menggunakan TLS/HTTPS (true) atau tidak (false) */
  tls?: boolean
  /** Token/API key atau credential ringkas, opsional */
  token?: string
  /** Topic/endpoint opsional untuk publish data */
  topic?: string
}

/**
 * Konfigurasi utama perangkat yang akan ditulis/diambil dari NFC.
 */
export interface DeviceConfig {
  /** ID unik perangkat */
  deviceId: string
  /** Interval publish data (detik) */
  publishInterval?: number
  /** Konfigurasi Wi-Fi */
  wifi: WifiConfig
  /** Konfigurasi server */
  server: ServerConfig
  /** Versi schema konfigurasi */
  version?: string
}

/**
 * Hasil scan NFC yang diproses.
 */
export interface NfcScanResult {
  /** Nomor seri tag (jika tersedia dari event) */
  serialNumber?: string
  /** Payload mentah (JSON string) jika berhasil diambil */
  rawPayload?: string
  /** Konfigurasi yang di-decode dari payload */
  config?: DeviceConfig | null
}
