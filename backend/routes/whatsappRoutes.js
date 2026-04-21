/**
 * WhatsApp Routes
 * Routes untuk endpoint WhatsApp integration
 */

const express = require('express');
const router = express.Router();
const WhatsAppController = require('../controllers/WhatsAppController');

// Send reminder untuk tagihan H-3 (biasanya di-trigger oleh cron job)
router.post('/send-reminder-h3', WhatsAppController.sendReminderTagihanH3);

// Send manual reminder
router.post('/send-manual', WhatsAppController.sendManualReminder);
router.post('/send-reminder', WhatsAppController.sendManualReminder); // Legacy route

// Send payment confirmation
router.post('/send-confirmation', WhatsAppController.sendPaymentConfirmation);

module.exports = router;
