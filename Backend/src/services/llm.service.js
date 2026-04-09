const env = require('../config/env');
const logger = require('../utils/logger');

// Groq uses an OpenAI-compatible API surface.
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 8000;
const FALLBACK_RESPONSE = 'Sorry, could you repeat that?';

async function generateResponse(messages) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 150
      }),
      signal: controller.signal
    });

    const data = await response.json();

    if (!response.ok) {
      logger.warn('Groq LLM request failed', {
        status: response.status,
        message: data?.error?.message || 'Unknown error'
      });
      return FALLBACK_RESPONSE;
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      logger.warn('Groq LLM response was empty');
      return FALLBACK_RESPONSE;
    }

    return content.trim();
  } catch (error) {
    logger.warn('Groq LLM request exception', {
      message: error.message,
      name: error.name
    });
    return FALLBACK_RESPONSE;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  generateResponse
};
