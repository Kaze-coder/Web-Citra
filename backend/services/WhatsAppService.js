/**
 * WhatsApp Integration Service
 * Integrasi dengan Fonnte API untuk pengiriman pesan WhatsApp otomatis
 * 
 * Setup:
 * 1. Daftar di https://www.fonnte.com/
 * 2. Dapatkan API Key
 * 3. Masukkan ke .env file: WHATSAPP_API_KEY=xxxxx
 */

const axios = require('axios');
require('dotenv').config();

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://api.fonnte.com/send';
    this.apiKey = process.env.WHATSAPP_API_KEY;
  }

  /**
   * Send WhatsApp message
   * @param {string} phone - Nomor telepon (62812345678 atau 0812345678)
   * @param {string} message - Pesan yang akan dikirim
   * @returns {object} - Response dari Fonnte API
   */
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

  /**
   * Format nomor telepon ke format internasional
   * @param {string} phone - Nomor telepon
   * @returns {string} - Nomor terformat
   */
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

  /**
   * Send billing reminder (Reminder H-3)
   * @param {object} pelanggan - Data pelanggan
   * @param {object} tagihan - Data tagihan
   */
  async sendBillingReminder(pelanggan, tagihan) {
    const message = `Halo ${pelanggan.nama_pelanggan}! 👋\n\nReminder pembayaran WiFi Anda:\n\n💰 Jumlah: Rp${this.formatCurrency(tagihan.jumlah_tagihan)}\n📅 Jatuh Tempo: ${new Date(tagihan.bulan_tagihan).toLocaleDateString('id-ID')}\n\nMohon segera lakukan pembayaran. Terima kasih! 🙏`;

    return await this.sendMessage(pelanggan.no_telepon, message);
  }

  /**
   * Send payment confirmation
   * @param {object} pelanggan - Data pelanggan
   * @param {object} tagihan - Data tagihan
   */
  async sendPaymentConfirmation(pelanggan, tagihan) {
    const message = `Terima kasih ${pelanggan.nama_pelanggan}! ✅\n\nPembayaran Anda telah diterima:\n\n💰 Jumlah: Rp${this.formatCurrency(tagihan.jumlah_tagihan)}\n📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\nLayanan Anda tetap aktif. Sampai jumpa! 😊`;

    return await this.sendMessage(pelanggan.no_telepon, message);
  }

  /**
   * Send suspension warning
   * @param {object} pelanggan - Data pelanggan
   */
  async sendSuspensionWarning(pelanggan) {
    const message = `⚠️ Perhatian ${pelanggan.nama_pelanggan}!\n\nLayanan WiFi Anda akan diputus jika tidak segera melakukan pembayaran.\n\nHubungi kami untuk informasi lebih lanjut.\n\nTerima kasih.`;

    return await this.sendMessage(pelanggan.no_telepon, message);
  }

  /**
   * Format currency to Indonesian Rupiah format
   * @param {number} value - Nilai uang
   * @returns {string} - Format Rp xxx.xxx
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('id-ID').format(value);
  }
}

module.exports = WhatsAppService;
