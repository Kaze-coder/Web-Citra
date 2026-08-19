/**
 * WhatsApp Integration Service - Fonnte API
 */

const axios = require('axios');
require('dotenv').config();

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://api.fonnte.com/send';
    this.apiKey = process.env.WHATSAPP_API_KEY;
  }

  // Kirim pesan WhatsApp
  async sendMessage(phone, message) {
    try {
      // Format nomor telepon
      phone = this.formatPhoneNumber(phone);

      const payload = {
        target: phone,
        message: message,
        countryCode: '62' // Indonesia
      };

      const headers = {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(this.apiUrl, payload, { headers });

      console.log(`✓ WhatsApp message sent to ${phone}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('✗ Error sending WhatsApp message:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Format nomor telepon ke internasional (62)
  formatPhoneNumber(phone) {
    // Remove spaces and dashes
    phone = phone.replace(/[\s-]/g, '');

    // Convert 0 to 62
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    } else if (!phone.startsWith('62')) {
      phone = '62' + phone;
    }

    return phone;
  }

  // Kirim reminder tagihan
  async sendBillingReminder(pelanggan, tagihan) {
    const message = `Halo ${pelanggan.nama_pelanggan}! 👋\n\nReminder pembayaran WiFi Anda:\n\n💰 Jumlah: Rp${this.formatCurrency(tagihan.jumlah_tagihan)}\n📅 Jatuh Tempo: ${new Date(tagihan.bulan_tagihan).toLocaleDateString('id-ID')}\n\nMohon segera lakukan pembayaran. Terima kasih! 🙏`;

    return await this.sendMessage(pelanggan.no_telepon, message);
  }

  // Kirim konfirmasi pembayaran
  async sendPaymentConfirmation(pelanggan, tagihan) {
    const message = `Terima kasih ${pelanggan.nama_pelanggan}! ✅\n\nPembayaran Anda telah diterima:\n\n💰 Jumlah: Rp${this.formatCurrency(tagihan.jumlah_tagihan)}\n📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\nLayanan Anda tetap aktif. Sampai jumpa! 😊`;

    return await this.sendMessage(pelanggan.no_telepon, message);
  }

  // Kirim peringatan suspensi
  async sendSuspensionWarning(pelanggan) {
    const message = `⚠️ Perhatian ${pelanggan.nama_pelanggan}!\n\nLayanan WiFi Anda akan diputus jika tidak segera melakukan pembayaran.\n\nHubungi kami untuk informasi lebih lanjut.\n\nTerima kasih.`;

    return await this.sendMessage(pelanggan.no_telepon, message);
  }

  // Format mata uang Rupiah
  formatCurrency(value) {
    return new Intl.NumberFormat('id-ID').format(value);
  }
}

module.exports = WhatsAppService;
