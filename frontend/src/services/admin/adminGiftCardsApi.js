import adminApi from '../../utils/adminApi';

const adminGiftCardsApi = {
  /**
   * Admin: List / search gift cards with pagination
   */
  getGiftCards: async ({ page = 1, limit = 20, search = '', status = '' } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);

    const response = await adminApi.get(`/gift-cards?${params.toString()}`);
    return response.data;
  },

  /**
   * Admin: Get single gift card details with transaction history
   */
  getGiftCardById: async (cardId) => {
    const response = await adminApi.get(`/gift-cards/${cardId}`);
    return response.data;
  },

  /**
   * Admin: Issue a new gift card directly
   */
  issueGiftCard: async (payload) => {
    const response = await adminApi.post('/gift-cards/issue', payload);
    return response.data;
  },

  /**
   * Admin: Suspend a gift card
   */
  suspendGiftCard: async (cardId, reason) => {
    const response = await adminApi.put(`/gift-cards/${cardId}/suspend`, { reason });
    return response.data;
  },

  /**
   * Admin: Reactivate a gift card
   */
  activateGiftCard: async (cardId) => {
    const response = await adminApi.put(`/gift-cards/${cardId}/activate`);
    return response.data;
  },

  /**
   * Admin: Adjust balance
   */
  adjustBalance: async (cardId, amount, reason) => {
    const response = await adminApi.post(`/gift-cards/${cardId}/adjust`, { amount, reason });
    return response.data;
  },

  /**
   * Admin: Delete / Revoke gift card
   */
  deleteGiftCard: async (cardId, reason) => {
    const response = await adminApi.delete(`/gift-cards/${cardId}`, { data: { reason } });
    return response.data;
  }
};

// Aliases for seamless naming compatibility
adminGiftCardsApi.adminListGiftCards = adminGiftCardsApi.getGiftCards;
adminGiftCardsApi.adminGetGiftCard = adminGiftCardsApi.getGiftCardById;
adminGiftCardsApi.adminIssueGiftCard = adminGiftCardsApi.issueGiftCard;
adminGiftCardsApi.adminSuspendGiftCard = adminGiftCardsApi.suspendGiftCard;
adminGiftCardsApi.adminActivateGiftCard = adminGiftCardsApi.activateGiftCard;
adminGiftCardsApi.adminAdjustBalance = adminGiftCardsApi.adjustBalance;
adminGiftCardsApi.adminDeleteGiftCard = adminGiftCardsApi.deleteGiftCard;

export default adminGiftCardsApi;
