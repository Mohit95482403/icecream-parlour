const giftCardService = require('../services/giftCardService');

const adminGiftCardController = {
  /**
   * GET /api/admin/gift-cards
   * List gift cards with pagination, status filter, and search
   */
  listGiftCards: async (req, res) => {
    try {
      const { page = 1, limit = 20, search = '', status = '' } = req.query;

      const result = await giftCardService.adminListGiftCards({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search,
        status
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error listing gift cards for admin:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch gift cards' }
      });
    }
  },

  /**
   * GET /api/admin/gift-cards/:id
   * Get single gift card details + full ledger
   */
  getGiftCard: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await giftCardService.adminGetGiftCard(parseInt(id, 10));

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting gift card details for admin:', error);
      res.status(404).json({
        success: false,
        error: { message: error.message || 'Gift card not found' }
      });
    }
  },

  /**
   * POST /api/admin/gift-cards/issue
   * Admin directly issues a new gift card
   */
  issueGiftCard: async (req, res) => {
    try {
      const {
        amount,
        recipientEmail,
        recipientName,
        senderName,
        personalMessage
      } = req.body;

      const adminId = req.user.sub;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Valid amount is required' }
        });
      }

      const result = await giftCardService.adminIssueGiftCard({
        amount: parseFloat(amount),
        recipientEmail,
        recipientName,
        senderName: senderName || 'GLACÉ Concierge',
        personalMessage,
        adminId
      });

      res.status(201).json({
        success: true,
        message: 'Gift card issued successfully',
        data: result
      });
    } catch (error) {
      console.error('Error issuing gift card by admin:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to issue gift card' }
      });
    }
  },

  /**
   * PUT /api/admin/gift-cards/:id/suspend
   * Suspend a gift card
   */
  suspendGiftCard: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.sub;

      const result = await giftCardService.adminSuspendGiftCard(
        parseInt(id, 10),
        adminId,
        reason || 'Suspended by admin'
      );

      res.status(200).json({
        success: true,
        message: 'Gift card suspended',
        data: result
      });
    } catch (error) {
      console.error('Error suspending gift card:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to suspend gift card' }
      });
    }
  },

  /**
   * PUT /api/admin/gift-cards/:id/activate
   * Reactivate a suspended gift card
   */
  activateGiftCard: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.sub;

      const result = await giftCardService.adminActivateGiftCard(
        parseInt(id, 10),
        adminId
      );

      res.status(200).json({
        success: true,
        message: 'Gift card activated',
        data: result
      });
    } catch (error) {
      console.error('Error activating gift card:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to activate gift card' }
      });
    }
  },

  /**
   * POST /api/admin/gift-cards/:id/adjust
   * Adjust balance with ledger audit
   */
  adjustBalance: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;
      const adminId = req.user.sub;

      if (amount === undefined || isNaN(parseFloat(amount)) || parseFloat(amount) === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'A non-zero adjustment amount is required' }
        });
      }

      if (!reason || !reason.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'A reason for adjustment is required' }
        });
      }

      const result = await giftCardService.adminAdjustBalance(
        parseInt(id, 10),
        parseFloat(amount),
        reason.trim(),
        adminId
      );

      res.status(200).json({
        success: true,
        message: 'Gift card balance adjusted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error adjusting gift card balance:', error);
      res.status(400).json({
        success: false,
        error: { message: error.message || 'Failed to adjust balance' }
      });
    }
  },

  /**
   * DELETE /api/admin/gift-cards/:id
   * Admin: Delete/Revoke gift card
   */
  deleteGiftCard: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const adminId = req.user.sub;

      const result = await giftCardService.adminDeleteGiftCard(
        parseInt(id, 10),
        adminId,
        reason
      );

      res.status(200).json({
        success: true,
        message: 'Gift card deleted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error deleting gift card:', error);
      const isNotFound = error.message && error.message.includes('not found');
      res.status(isNotFound ? 404 : 500).json({
        success: false,
        error: { message: error.message || 'Failed to delete gift card' }
      });
    }
  }
};

module.exports = adminGiftCardController;
