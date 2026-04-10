const express = require('express');

const asyncHandler = require('../utils/async-handler');
const controller = require('../controllers/call.controller');

const router = express.Router();

router.post('/trigger', asyncHandler(controller.triggerCallScript));
router.all('/trigger', (req, res) => {
  res.set('Allow', 'POST');
  return res
    .status(405)
    .json({ error: 'Method not allowed. Use POST /api/calls/trigger' });
});

module.exports = router;