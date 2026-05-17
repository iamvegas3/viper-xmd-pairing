const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { generatePairingCode, checkConnectionStatus } = require('../controllers/pairingController');

router.post('/generate',
  [
    body('phoneNumber').isMobilePhone().withMessage('Invalid phone number')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { phoneNumber } = req.body;
      const result = await generatePairingCode(phoneNumber);
      res.json(result);
    } catch (error) {
      console.error('Pairing error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const status = await checkConnectionStatus(sessionId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
