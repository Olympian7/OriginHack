const MAX_LOGS = 30;
const SERIES_WINDOW = 7;

const BASE_CAMPAIGN = {
  businessName: 'Vedaspark Astrology Services',
  goal: 'Click the green button to trigger a live call and begin collecting telemetry.',
  services: [
    'Horoscope reading',
    'Career guidance',
    'Relationship analysis'
  ]
};

const BASE_CONTACTS = [
  {
    id: '#AZ881',
    name: 'Tushar Jaisi',
    city: 'Mumbai, IN',
    astroProfile: 'Shani Mahadasha',
    contact: '+91 7678XXX-004',
    resonance: '0',
    status: 'Idle'
  },
  {
    id: '#AZ882',
    name: 'Priya Sharma',
    city: 'Delhi, IN',
    astroProfile: 'Kalasarpa Dosha',
    contact: '+91 97XXX-X5678',
    resonance: '0',
    status: 'Idle'
  }
];

let triggerCount = 0;
let state = createInitialState();

const INTENT_KEYWORDS = {
  interested: [
    'interested',
    'career',
    'guidance',
    'yes',
    'book',
    'schedule',
    'consultation',
    'tell me',
    'want to know',
    'help me'
  ],
  callback: [
    'call me later',
    'later',
    'tomorrow',
    'next week',
    'callback',
    'call back',
    'not now',
    'busy right now'
  ],
  notInterested: [
    'not interested',
    'no thanks',
    'stop',
    'remove me',
    'do not call',
    'dont call',
    'hang up'
  ]
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toPercent(part, total) {
  if (!total) {
    return 0;
  }

  return Number(((part / total) * 100).toFixed(1));
}

function createInitialState() {
  return {
    dashboard: {
      summary: {
        globalSessions: 0,
        leadRepository: 0,
        nluPrecision: '0%',
        conversionRate: '0%'
      },
      engagement: {
        conversionRate: 0,
        activeEngagement: 0,
        dropOffFlux: 0
      },
      sentiment: [0, 0, 0],
      upcomingCalls: []
    },
    contacts: clone(BASE_CONTACTS),
    analytics: {
      successRate: 0,
      totalMade: 0,
      answered: 0,
      missed: 0,
      avgDuration: '0s',
      lineSeries: new Array(SERIES_WINDOW).fill(0),
      lineLabels: ['T-1', 'T-2', 'T-3', 'T-4', 'T-5', 'T-6', 'T-7'],
      statusBreakdown: [0, 0, 0],
      intentAccuracy: 0,
      intentSplit: [0, 0, 0]
    },
    callLogs: [],
    campaign: clone(BASE_CAMPAIGN)
  };
}

function getKeywordHits(text, keywords) {
  return keywords.filter((keyword) => text.includes(keyword));
}

function analyzeIntentFromTranscript(transcript) {
  const normalized = String(transcript || '').trim().toLowerCase();

  if (!normalized) {
    return {
      label: 'Unknown',
      confidence: 0,
      reason: 'Transcript was empty.'
    };
  }

  const interestedHits = getKeywordHits(normalized, INTENT_KEYWORDS.interested);
  const callbackHits = getKeywordHits(normalized, INTENT_KEYWORDS.callback);
  const notInterestedHits = getKeywordHits(normalized, INTENT_KEYWORDS.notInterested);

  const scores = {
    Interested: interestedHits.length,
    'Callback Request': callbackHits.length,
    'Not Interested': notInterestedHits.length
  };

  let topLabel = 'Unknown';
  let topScore = 0;

  for (const [label, score] of Object.entries(scores)) {
    if (score > topScore) {
      topLabel = label;
      topScore = score;
    }
  }

  if (topScore === 0) {
    return {
      label: 'Unknown',
      confidence: 0,
      reason: 'No clear intent keywords matched in transcript.'
    };
  }

  const allScore = scores.Interested + scores['Callback Request'] + scores['Not Interested'];
  const confidence = Number(((topScore / allScore) * 100).toFixed(1));

  const hitMap = {
    Interested: interestedHits,
    'Callback Request': callbackHits,
    'Not Interested': notInterestedHits
  };

  return {
    label: topLabel,
    confidence,
    reason: `Matched keywords: ${hitMap[topLabel].join(', ')}`
  };
}

function recalculateIntentMetricsFromLogs() {
  const analyzedLogs = state.callLogs.filter(
    (entry) => entry.intentAnalysis && entry.intentAnalysis.label !== 'Unknown'
  );

  if (!analyzedLogs.length) {
    state.analytics.intentAccuracy = 0;
    state.analytics.intentSplit = [0, 0, 0];
    return;
  }

  const interestedCount = analyzedLogs.filter(
    (entry) => entry.intentAnalysis.label === 'Interested'
  ).length;
  const notInterestedCount = analyzedLogs.filter(
    (entry) => entry.intentAnalysis.label === 'Not Interested'
  ).length;
  const callbackCount = analyzedLogs.filter(
    (entry) => entry.intentAnalysis.label === 'Callback Request'
  ).length;

  state.analytics.intentSplit = [
    toPercent(interestedCount, analyzedLogs.length),
    toPercent(notInterestedCount, analyzedLogs.length),
    toPercent(callbackCount, analyzedLogs.length)
  ];
  state.analytics.intentAccuracy = state.analytics.intentSplit[0];
}

function recalculateState() {
  const total = state.analytics.totalMade;
  const answered = state.analytics.answered;
  const missed = state.analytics.missed;

  const successRate = toPercent(answered, total);
  const dropOffRate = toPercent(missed, total);
  const remaining = Math.max(0, Number((100 - successRate - dropOffRate).toFixed(1)));

  state.analytics.successRate = successRate;
  state.analytics.statusBreakdown = [answered, missed, 0];
  state.analytics.avgDuration = answered ? `${35 + answered * 3}s` : '0s';

  state.dashboard.summary.globalSessions = total;
  state.dashboard.summary.leadRepository = answered;
  state.dashboard.summary.nluPrecision = `${successRate}%`;
  state.dashboard.summary.conversionRate = `${successRate}%`;

  state.dashboard.engagement.conversionRate = successRate;
  state.dashboard.engagement.activeEngagement = successRate;
  state.dashboard.engagement.dropOffFlux = dropOffRate;

  state.dashboard.sentiment = [successRate, dropOffRate, remaining];
  state.dashboard.upcomingCalls = state.callLogs.slice(0, 5).map((entry) => ({
    name: entry.seeker,
    node: entry.sessionId,
    alignment: `${entry.intentAnalysis?.label || 'Pending'} Align`,
    status: entry.status
  }));

  recalculateIntentMetricsFromLogs();
}

function registerCallTrigger({ success, callSid, errorMessage }) {
  triggerCount += 1;
  state.analytics.totalMade += 1;

  if (success) {
    state.analytics.answered += 1;
    state.contacts[0].resonance = 'High Intent';
    state.contacts[0].status = 'Ready';
  } else {
    state.analytics.missed += 1;
    state.contacts[0].resonance = '0';
    state.contacts[0].status = 'Retry';
  }

  state.analytics.lineSeries = [...state.analytics.lineSeries.slice(1), success ? 1 : 0];
  state.analytics.lineLabels = [...state.analytics.lineLabels.slice(1), `T-${triggerCount}`];

  state.callLogs.unshift({
    sessionId: callSid || `TRG-${String(triggerCount).padStart(4, '0')}`,
    seeker: state.contacts[0].name,
    plan: success ? 'Trigger Call Success' : 'Trigger Call Failed',
    timestamp: new Date().toISOString(),
    review: success
      ? 'Call trigger completed successfully and telemetry counters were updated.'
      : `Call trigger failed: ${(errorMessage || 'Unknown error').slice(0, 200)}`,
    status: success ? 'Synced' : 'Failed'
  });

  state.callLogs = state.callLogs.slice(0, MAX_LOGS);
  recalculateState();
}

function registerTranscriptAnalysis({ sessionId, transcript }) {
  const normalizedTranscript = String(transcript || '').trim();
  const intentAnalysis = analyzeIntentFromTranscript(normalizedTranscript);

  state.callLogs.unshift({
    sessionId: sessionId || `SES-${Date.now()}`,
    seeker: state.contacts[0]?.name || 'Unknown Seeker',
    plan: 'Transcript Captured',
    timestamp: new Date().toISOString(),
    review: `Intent: ${intentAnalysis.label} (${intentAnalysis.confidence}%)`,
    transcript: normalizedTranscript,
    intentAnalysis,
    status: 'Analyzed'
  });

  state.callLogs = state.callLogs.slice(0, MAX_LOGS);
  recalculateState();
}

function resetState() {
  triggerCount = 0;
  state = createInitialState();
}

function getState() {
  return clone(state);
}

module.exports = {
  getState,
  resetState,
  registerCallTrigger,
  registerTranscriptAnalysis
};