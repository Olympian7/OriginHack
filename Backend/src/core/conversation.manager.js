const campaign = require('../data/campaign');
const llmService = require('../services/llm.service');
const { buildPrompt } = require('./prompt.builder');

const MAX_HISTORY_MESSAGES = 12;

class ConversationManager {
  constructor() {
    this.sessions = new Map();
  }

  getSessionHistory(sessionId) {
    return this.sessions.get(sessionId) || [];
  }

  setSessionHistory(sessionId, history) {
    this.sessions.set(sessionId, history.slice(-MAX_HISTORY_MESSAGES));
  }

  async respond(sessionId, userMessage) {
    const history = this.getSessionHistory(sessionId);
    const prompt = buildPrompt({
      campaign,
      history,
      userMessage
    });

    const reply = await llmService.generateResponse(prompt);

    const updatedHistory = [
      ...history,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: reply }
    ];

    this.setSessionHistory(sessionId, updatedHistory);

    return reply;
  }
}

module.exports = new ConversationManager();
