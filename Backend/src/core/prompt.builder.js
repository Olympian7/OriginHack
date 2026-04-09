function formatFaqs(faqs) {
  return faqs
    .map((faq, index) => `${index + 1}. Q: ${faq.question}\n   A: ${faq.answer}`)
    .join('\n');
}

function buildPrompt({ campaign, history, userMessage }) {
  const systemPrompt = [
    `You are a professional tele-calling agent for ${campaign.businessName}.`,
    'You are speaking on a live call.',
    `Primary Goal: ${campaign.goal}`,
    `Services: ${campaign.services.join(', ')}`,
    'FAQ Guidance:',
    formatFaqs(campaign.faqs),
    'Rules:',
    '- Keep response short and spoken-style (1-3 sentences).',
    '- Sound human, warm, and confident.',
    '- Keep sales intent natural and persuasive.',
    '- Handle objections calmly and steer toward booking consultation.',
    '- End with a conversational next step when relevant.'
  ].join('\n');

  const historyMessages = history.map((item) => ({
    role: item.role,
    content: item.content
  }));

  return [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: userMessage }
  ];
}

module.exports = {
  buildPrompt
};
