import api from './api';
import adminApi from '../utils/adminApi';

export const giftCardService = {
  /**
   * Customer: Purchase a new gift card
   */
  purchaseGiftCard: async (payload) => {
    const response = await api.post('/gift-cards/purchase', payload);
    return response;
  },

  /**
   * Customer: Claim / redeem a gift card code to wallet
   */
  redeemCard: async (code) => {
    const response = await api.post('/gift-cards/redeem', { code });
    return response;
  },

  /**
   * Customer: Get my gift cards and total balance
   */
  getMyGiftCards: async () => {
    const response = await api.get('/gift-cards/my-cards');
    return response;
  },

  /**
   * Customer: View transactions ledger for a gift card
   */
  getCardTransactions: async (cardId) => {
    const response = await api.get(`/gift-cards/${cardId}/transactions`);
    return response;
  },

  /**
   * Customer: Validate gift card code during checkout
   */
  validateForCheckout: async (code) => {
    const response = await api.post('/gift-cards/validate', { code });
    return response;
  },

  // ── Admin Endpoints (using adminApi with admin JWT) ──────────────────

  /**
   * Admin: List / search gift cards with pagination
   */
  adminListGiftCards: async ({ page = 1, limit = 20, search = '', status = '' } = {}) => {
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
  adminGetGiftCard: async (cardId) => {
    const response = await adminApi.get(`/gift-cards/${cardId}`);
    return response.data;
  },

  /**
   * Admin: Issue a new gift card directly
   */
  adminIssueGiftCard: async (payload) => {
    const response = await adminApi.post('/gift-cards/issue', payload);
    return response.data;
  },

  /**
   * Admin: Suspend a gift card
   */
  adminSuspendGiftCard: async (cardId, reason) => {
    const response = await adminApi.put(`/gift-cards/${cardId}/suspend`, { reason });
    return response.data;
  },

  /**
   * Admin: Reactivate a gift card
   */
  adminActivateGiftCard: async (cardId) => {
    const response = await adminApi.put(`/gift-cards/${cardId}/activate`);
    return response.data;
  },

  /**
   * Admin: Adjust balance
   */
  adminAdjustBalance: async (cardId, amount, reason) => {
    const response = await adminApi.post(`/gift-cards/${cardId}/adjust`, { amount, reason });
    return response.data;
  },

  /**
   * Admin: Delete / Revoke gift card
   */
  adminDeleteGiftCard: async (cardId, reason) => {
    const response = await adminApi.delete(`/gift-cards/${cardId}`, { data: { reason } });
    return response.data;
  }
};

export default giftCardService;
