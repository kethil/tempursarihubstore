import { Database } from "@/integrations/supabase/types";

type ServiceType = Database["public"]["Enums"]["service_type"];
type RequestStatus = Database["public"]["Enums"]["request_status"];

interface WAHAConfig {
  url: string;
  apiKey: string;
  session: string;
}

interface ServiceRequest {
  id: string;
  request_number: string;
  service_type: ServiceType;
  full_name: string;
  nik: string;
  phone_number: string;
  status: RequestStatus;
  created_at: string;
  operator_notes?: string;
}

class WAHAService {
  private config: WAHAConfig;

  constructor() {
    this.config = {
      url: import.meta.env.VITE_WAHA_URL || '',
      apiKey: import.meta.env.VITE_WAHA_API_KEY || '',
      session: import.meta.env.VITE_WAHA_SESSION || 'default',
    };
  }

  private isConfigured(): boolean {
    return !!
      this.config.url && 
      this.config.apiKey && 
      this.config.apiKey !== 'your_waha_api_key' && 
      this.config.apiKey !== '';
  }

  private async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('WAHA not properly configured. Please set VITE_WAHA_API_KEY in .env file.');
      console.log('Simulating message send:', { phoneNumber, message });
      return true;
    }

    try {
      // Format phone number for WhatsApp (remove leading 0, add +62)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const response = await fetch(`${this.config.url}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify({
          session: this.config.session,
          chatId: `${formattedPhone}@c.us`,
          text: message,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`Authentication failed. Please check your WAHA API key.`);
        }
        throw new Error(`WAHA API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('WhatsApp message sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return false;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove any non-numeric characters
    let cleanPhone = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with 62
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }
    
    // If doesn't start with 62, add it
    if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }
    
    return cleanPhone;
  }

  private getServiceTypeName(serviceType: ServiceType): string {
    const serviceNames: Record<ServiceType, string> = {
      'surat_pengantar_ktp': 'Surat Pengantar KTP',
      'surat_keterangan_domisili': 'Surat Keterangan Domisili',
      'surat_keterangan_usaha': 'Surat Keterangan Usaha',
      'surat_keterangan_tidak_mampu': 'Surat Keterangan Tidak Mampu',
      'surat_keterangan_belum_menikah': 'Surat Keterangan Belum Menikah',
      'surat_pengantar_nikah': 'Surat Pengantar Nikah',
      'surat_keterangan_kematian': 'Surat Keterangan Kematian',
      'surat_keterangan_kelahiran': 'Surat Keterangan Kelahiran',
    };
    
    return serviceNames[serviceType] || 'Layanan Desa';
  }

  private getStatusMessage(status: RequestStatus): string {
    const statusMessages: Record<RequestStatus, string> = {
      'pending': 'sedang dalam antrian untuk diverifikasi',
      'on_process': 'sedang diproses oleh petugas desa',
      'completed': 'telah selesai dan siap untuk diambil',
      'cancelled': 'telah dibatalkan',
    };
    
    return statusMessages[status] || 'mengalami perubahan status';
  }

  async sendNewRequestNotification(request: ServiceRequest): Promise<boolean> {
    const serviceName = this.getServiceTypeName(request.service_type);
    
    const message = `🏛️ *DESA TEMPURSARI*

Halo, ${request.full_name}

Permohonan ${serviceName} Anda telah berhasil diterima!

📋 *Detail Permohonan:*
• Nomor: ${request.request_number}
• Layanan: ${serviceName}
• Status: Menunggu Verifikasi

⏰ *Estimasi Proses:* 1-3 hari kerja

Kami akan menghubungi Anda kembali jika diperlukan dokumen tambahan.

Terima kasih telah menggunakan layanan digital desa!`;

    return this.sendMessage(request.phone_number, message);
  }

  async sendStatusUpdateNotification(request: ServiceRequest, oldStatus: RequestStatus): Promise<boolean> {
    const serviceName = this.getServiceTypeName(request.service_type);
    const statusMessage = this.getStatusMessage(request.status);
    
    let message = `🏛️ *DESA TEMPURSARI*

Halo, ${request.full_name}

Permohonan ${serviceName} Anda ${statusMessage}.

📋 *Detail Permohonan:*
• Nomor: ${request.request_number}
• Layanan: ${serviceName}
• Status: ${this.getStatusDisplayName(request.status)}`;

    // Add specific instructions based on status
    if (request.status === 'completed') {
      message += `

🎉 *Dokumen Siap Diambil!*

Silakan datang ke kantor desa dengan membawa:
• KTP asli
• Nomor permohonan: ${request.request_number}

📍 *Alamat:* Kantor Desa Tempursari
⏰ *Jam Pelayanan:* Senin-Jumat, 08.00-15.00 WIB`;
    } else if (request.status === 'on_process') {
      message += `

⚙️ *Sedang Diproses*

Dokumen Anda sedang disiapkan oleh petugas. Mohon menunggu, kami akan memberitahu Anda jika sudah selesai.`;
    } else if (request.status === 'cancelled') {
      message += `

❌ *Permohonan Dibatalkan*

Untuk informasi lebih lanjut, silakan hubungi kantor desa di 0274-xxxxxxx atau datang langsung ke kantor.`;
    }

    // Add operator notes if available
    if (request.operator_notes) {
      message += `

📝 *Catatan Petugas:*
${request.operator_notes}`;
    }

    message += `

Terima kasih telah menggunakan layanan digital desa!`;

    return this.sendMessage(request.phone_number, message);
  }

  private getStatusDisplayName(status: RequestStatus): string {
    const displayNames: Record<RequestStatus, string> = {
      'pending': 'Menunggu Verifikasi',
      'on_process': 'Sedang Diproses',
      'completed': 'Selesai',
      'cancelled': 'Dibatalkan',
    };
    
    return displayNames[status] || 'Unknown';
  }

  async sendReminderNotification(request: ServiceRequest): Promise<boolean> {
    const serviceName = this.getServiceTypeName(request.service_type);
    
    const message = `🏛️ *DESA TEMPURSARI*

Halo, ${request.full_name}

Pengingat: Dokumen ${serviceName} Anda sudah siap diambil!

📋 *Detail Permohonan:*
• Nomor: ${request.request_number}
• Layanan: ${serviceName}

Silakan datang ke kantor desa dengan membawa:
• KTP asli
• Nomor permohonan: ${request.request_number}

📍 *Alamat:* Kantor Desa Tempursari
⏰ *Jam Pelayanan:* Senin-Jumat, 08.00-15.00 WIB

Terima kasih!`;

    return this.sendMessage(request.phone_number, message);
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.config.url) {
      return {
        success: false,
        message: 'WAHA URL not configured. Please set VITE_WAHA_URL in .env file.',
      };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'WAHA API key not configured. Please set a valid VITE_WAHA_API_KEY in .env file.',
        details: {
          url: this.config.url,
          hasApiKey: !!this.config.apiKey,
          apiKeyValue: this.config.apiKey === 'your_waha_api_key' ? 'placeholder_value' : 'configured',
        }
      };
    }

    try {
      const response = await fetch(`${this.config.url}/api/sessions`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 401) {
          errorMessage = 'Authentication failed. The API key is invalid or expired.';
        } else if (response.status === 404) {
          errorMessage = 'WAHA server endpoint not found. Check the server URL.';
        } else if (response.status === 500) {
          errorMessage = 'WAHA server internal error.';
        }

        return {
          success: false,
          message: errorMessage,
          details: {
            status: response.status,
            statusText: response.statusText,
            url: this.config.url,
          }
        };
      }

      const result = await response.json();
      return {
        success: true,
        message: 'WAHA connection successful!',
        details: result
      };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          message: 'Cannot connect to WAHA server. Check if the server is running and the URL is correct.',
          details: {
            error: error.message,
            url: this.config.url,
          }
        };
      }

      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
    }
  }
}

export const wahaService = new WAHAService();