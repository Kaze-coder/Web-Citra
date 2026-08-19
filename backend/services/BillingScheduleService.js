/**
 * Billing Schedule Service (MySQL)
 */

const PelangganModel = require('../models/PelangganModel');
const TagihanModel = require('../models/TagihanModel');

class BillingScheduleService {
  // Hitung tanggal tagihan berikutnya
  static calculateNextBillingDate(pelanggan) {
    const today = new Date();
    const subscriptionDate = new Date(pelanggan.tanggal_langganan);

    // Get the day of subscription
    const subscriptionDay = subscriptionDate.getDate();

    // Calculate next billing date (same day of next month)
    let nextBillingDate = new Date(today.getFullYear(), today.getMonth(), subscriptionDay);

    // If we've already passed that day this month, move to next month
    if (nextBillingDate <= today) {
      nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 1, subscriptionDay);
    }

    // Calculate days until billing
    const daysUntilBilling = Math.ceil((nextBillingDate - today) / (1000 * 60 * 60 * 24));

    return {
      nextBillingDate,
      daysUntilBilling,
      formattedDate: nextBillingDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  }

  // Bangun objek jadwal untuk satu pelanggan
  static async buildSchedule(p) {
    const tagihanBelumLunas = await TagihanModel.countBelumLunasByPelanggan(p.id);
    const billingInfo = this.calculateNextBillingDate(p);

    return {
      id: p.id,
      nama_pelanggan: p.nama_pelanggan,
      no_telepon: p.no_telepon,
      paket_layanan: p.paket_layanan,
      harga_bulanan: Number(p.harga_bulanan) || 0,
      tanggal_langganan: p.tanggal_langganan,
      tagihan_belum_lunas: tagihanBelumLunas,
      next_billing_date: billingInfo.nextBillingDate,
      next_billing_formatted: billingInfo.formattedDate,
      days_until_billing: billingInfo.daysUntilBilling,
      status: billingInfo.daysUntilBilling <= 0 ? 'overdue' :
              billingInfo.daysUntilBilling <= 3 ? 'soon' : 'normal',
      message_preview: this.generateMessagePreview(p, billingInfo)
    };
  }

  // Ambil semua jadwal tagihan
  static async getAllBillingSchedules() {
    try {
      // Get all active customers
      const pelangganList = await PelangganModel.getPelangganAktif();

      const schedules = [];
      for (const p of pelangganList) {
        schedules.push(await this.buildSchedule(p));
      }

      return schedules;
    } catch (error) {
      console.error('Error getting billing schedules:', error);
      throw error;
    }
  }

  // Buat preview pesan WhatsApp
  static generateMessagePreview(pelanggan, billingInfo) {
    const currency = new Intl.NumberFormat('id-ID').format(Number(pelanggan.harga_bulanan) || 0);

    return `🔔 *Notifikasi Tagihan WiFi* 🔔\n\nHalo ${pelanggan.nama_pelanggan}! 👋\n\nBerikut ringkasan tagihan WiFi Anda:\n\n📦 *Paket*: ${pelanggan.paket_layanan}\n💰 *Jumlah Tagihan*: Rp${currency}\n📅 *Jatuh Tempo*: ${billingInfo.formattedDate}\n⏰ *Status*: Belum Dibayar\n\nMohon segera lakukan pembayaran untuk menjaga kelancaran layanan Anda.\n\nTerima kasih! 🙏`;
  }

  // Ambil jadwal tagihan pelanggan tertentu
  static async getBillingScheduleByCustomer(pelangganId) {
    try {
      const p = await PelangganModel.getPelangganById(pelangganId);

      if (!p || p.status !== 'aktif') {
        return null;
      }

      return this.buildSchedule(p);
    } catch (error) {
      console.error('Error getting billing schedule:', error);
      throw error;
    }
  }
}

module.exports = BillingScheduleService;
