window.TelecallerSite = {
  zeroState() {
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
      contacts: [],
      analytics: {
        successRate: 0,
        totalMade: 0,
        answered: 0,
        missed: 0,
        avgDuration: '0s',
        lineSeries: [0, 0, 0, 0, 0, 0, 0],
        lineLabels: ['T-1', 'T-2', 'T-3', 'T-4', 'T-5', 'T-6', 'T-7'],
        statusBreakdown: [0, 0, 0],
        intentAccuracy: 0,
        intentSplit: [0, 0, 0]
      },
      callLogs: [],
      campaign: {
        businessName: 'Vedaspark Astrology Services',
        goal: 'Trigger calls to start collecting live telemetry.',
        services: ['Horoscope reading', 'Career guidance', 'Relationship analysis']
      }
    };
  },

  async load() {
    const response = await fetch('/api/site/all');
    if (!response.ok) {
      throw new Error('Failed to load website data');
    }

    return response.json();
  },

  async loadSafe() {
    try {
      return await this.load();
    } catch (error) {
      console.error(error);
      return this.zeroState();
    }
  }
};