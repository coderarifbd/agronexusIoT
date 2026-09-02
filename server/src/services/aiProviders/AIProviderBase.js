/**
 * Abstract Base Class for AI Providers in AgroNexus IoT
 */
export class AIProviderBase {
  constructor(name) {
    this.name = name;
  }

  /**
   * Process a user chat query and return a structured response
   * @param {Object} options
   * @param {string} options.query - User query text
   * @param {string} options.userId - Authenticated user ID
   * @param {string} options.channelId - Focused channel ID
   * @param {Array} options.conversationHistory - Recent turns
   * @param {Object} options.context - Active conversation context
   * @returns {Promise<{ answer: string, cards: Object, actionProposal: Object|null }>}
   */
  async processQuery(options) {
    throw new Error(`processQuery() not implemented in ${this.name}`);
  }
}
