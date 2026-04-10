const express = require('express');

const siteData = require('../data/site-data');

const router = express.Router();

router.get('/all', (req, res) => {
  res.json(siteData.getState());
});

router.get('/dashboard', (req, res) => {
  res.json(siteData.getState().dashboard);
});

router.get('/contacts', (req, res) => {
  res.json(siteData.getState().contacts);
});

router.get('/analytics', (req, res) => {
  res.json(siteData.getState().analytics);
});

router.get('/logs', (req, res) => {
  res.json(siteData.getState().callLogs);
});

router.get('/campaign', (req, res) => {
  res.json(siteData.getState().campaign);
});

router.post('/reset', (req, res) => {
  siteData.resetState();
  res.json({
    success: true,
    message: 'Runtime dashboard state reset to zero.',
    data: siteData.getState()
  });
});

module.exports = router;