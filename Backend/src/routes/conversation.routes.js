const express = require('express');
const multer = require('multer');

const asyncHandler = require('../utils/async-handler');
const controller = require('../controllers/conversation.controller');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

router.post('/text', asyncHandler(controller.handleText));
router.all('/text', (req, res) => {
  res.set('Allow', 'POST');
  return res
    .status(405)
    .json({ error: 'Method not allowed. Use POST /api/conversation/text' });
});

router.post(
  '/audio',
  upload.single('file'),
  asyncHandler(controller.handleAudio)
);
router.all('/audio', (req, res) => {
  res.set('Allow', 'POST');
  return res
    .status(405)
    .json({ error: 'Method not allowed. Use POST /api/conversation/audio' });
});

module.exports = router;
