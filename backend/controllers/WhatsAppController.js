/**
 * WhatsApp Controller
 */

const TagihanModel = require('../models/TagihanModel');
const PelangganModel = require('../models/PelangganModel');
const WhatsAppService = require('../services/WhatsAppService');
require('dotenv').config();

class WhatsAppController {
  // Kirim pesan umum
  static async sendMessage(req, res) {
    try {
      const { phone, message } = req.body;

      if (!phone || !message) {
        return res.status(400).json({
          success: false,
          message: 'phone dan message harus diisi',
          error: 'Missing required fields'
        });
      }

      const wa = new WhatsAppService();
      const result = await wa.sendMessage(phone, message);

      if (result.success) {
        console.log(`✓ WhatsApp sent to ${phone}`);
        res.json({
          success: true,
          message: 'Pesan berhasil dikirim ke ' + phone,
          data: result.data
        });
      } else {
        console.error(`✗ Failed to send to ${phone}: ${result.error}`);
        res.status(500).json({
          success: false,
          message: 'Gagal mengirim pesan',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengirim pesan',
        error: error.message
      });
    }
  }

  // Kirim reminder tagihan (H-3)
  static async sendReminderTagihanH3(req, res) {
    try {
      // Get tagihan yang belum lunas (sudah join data pelanggan)
      const tagihan = await TagihanModel.getTagihanBelumBayar();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let sendCount = 0;
      let failCount = 0;

      for (let t of tagihan) {
        const dueDate = new Date(t.bulan_tagihan);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

        // Jika akan jatuh tempo dalam 3 hari
        if (daysUntilDue === 3 && t.status_pembayaran === 'belum_lunas') {
          const wa = new WhatsAppService();
          const result = await wa.sendBillingReminder(t, t);

          if (result.success) {
            sendCount++;
          } else {
            failCount++;
          }
        }
      }

      res.json({
        success: true,
        message: `Reminder terkirim ke ${sendCount} pelanggan${failCount > 0 ? `, ${failCount} gagal` : ''}`,
        data: {
          sent: sendCount,
          failed: failCount
        }
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengirim reminder',
        error: error.message
      });
    }
  }

  // Kirim reminder manual
  static async sendManualReminder(req, res) {
    try {
      const { pelanggan_id, tagihan_id } = req.body;

      if (!pelanggan_id || !tagihan_id) {
        return res.status(400).json({
          success: false,
          message: 'pelanggan_id dan tagihan_id harus diisi'
        });
      }

      // Get pelanggan dan tagihan
      const pelanggan = await PelangganModel.getPelangganById(pelanggan_id);
      if (!pelanggan) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

      const tagihan = await TagihanModel.getTagihanById(tagihan_id);
      const jumlah = tagihan ? Number(tagihan.jumlah_tagihan) : Number(pelanggan.harga_bulanan) || 0;

      // Send message
      const wa = new WhatsAppService();
      const message = `Halo ${pelanggan.nama_pelanggan}! 👋\n\nReminder pembayaran WiFi Anda:\n\n💰 Jumlah: Rp${WhatsAppController.formatCurrency(jumlah)}\n\nMohon segera lakukan pembayaran. Terima kasih! 🙏`;

      const result = await wa.sendMessage(pelanggan.no_telepon, message);

      if (result.success) {
        res.json({
          success: true,
          message: 'Message berhasil dikirim ke ' + pelanggan.no_telepon,
          data: result.data
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Gagal mengirim message',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error sending manual reminder:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengirim message',
        error: error.message
      });
    }
  }

  // Kirim konfirmasi pembayaran
  static async sendPaymentConfirmation(req, res) {
    try {
      const { pelanggan_id } = req.body;

      if (!pelanggan_id) {
        return res.status(400).json({
          success: false,
          message: 'pelanggan_id harus diisi'
        });
      }

      const pelanggan = await PelangganModel.getPelangganById(pelanggan_id);
      if (!pelanggan) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

      const wa = new WhatsAppService();
      const result = await wa.sendPaymentConfirmation(pelanggan, {
        jumlah_tagihan: Number(pelanggan.harga_bulanan) || 0
      });

      if (result.success) {
        res.json({
          success: true,
          message: 'Konfirmasi pembayaran terkirim'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Gagal mengirim konfirmasi'
        });
      }
    } catch (error) {
      console.error('Error sending confirmation:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengirim konfirmasi',
        error: error.message
      });
    }
  }

  // Format mata uang
  static formatCurrency(value) {
    return new Intl.NumberFormat('id-ID').format(value);
  }
}

module.exports = WhatsAppController;
