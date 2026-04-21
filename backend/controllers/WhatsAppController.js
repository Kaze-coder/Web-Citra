/**
 * WhatsApp Controller
 * Controller untuk menangani WhatsApp operations
 */

const axios = require('axios');
const TagihanModel = require('../models/TagihanModel');
const PelangganModel = require('../models/PelangganModel');
const WhatsAppService = require('../services/WhatsAppService');
require('dotenv').config();

class WhatsAppController {
  /**
   * Send reminder untuk tagihan belum bayar (H-3)
   */
  static async sendReminderTagihanH3(req, res) {
    try {
      // Get tagihan yang akan jatuh tempo dalam 3 hari
      const tagihan = await TagihanModel.getTagihanBelumBayar();
      const today = new Date();
      
      let sendCount = 0;
      let failCount = 0;

      for (let t of tagihan) {
        const dueDate = new Date(t.bulan_tagihan);
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

  /**
   * Send manual reminder
   */
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

      // Send message
      const wa = new WhatsAppService();
      const message = `Halo ${pelanggan.nama_pelanggan}! 👋\n\nReminder pembayaran WiFi Anda:\n\n💰 Jumlah: Rp${WhatsAppController.formatCurrency(pelanggan.harga_bulanan)}\n\nMohon segera lakukan pembayaran. Terima kasih! 🙏`;

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

  /**
   * Send payment confirmation
   */
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
        jumlah_tagihan: pelanggan.harga_bulanan
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

  /**
   * Format currency
   */
  static formatCurrency(value) {
    return new Intl.NumberFormat('id-ID').format(value);
  }
}

module.exports = WhatsAppController;
