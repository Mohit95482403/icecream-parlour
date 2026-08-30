const giftCardService = require('../services/giftCardService');
const orderService = require('../services/orderService');
const db = require('../config/db');

// In-memory rate limiter for gift card redeem attempts: max 10 attempts per minute per user/ip
const redeemAttempts = new Map();

function checkRateLimit(key) {
  const now = Date.now();
  const entry = redeemAttempts.get(key) || { count: 0, resetAt: now + 60000 };

  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + 60000;
  } else {
    entry.count += 1;
  }

  redeemAttempts.set(key, entry);

  if (entry.count > 10) {
    return false;
  }
  return true;
}

const giftCardController = {
  /**
   * POST /api/gift-cards/purchase
   * Purchase a new gift card. Creates an order and a pending gift card.
   */
  purchaseGiftCard: async (req, res) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        amount,
        recipientEmail,
        recipientName,
        senderName,
        personalMessage
      } = req.body;

      const parsedAmount = parseFloat(amount);
      const allowedAmounts = [250, 500, 1000, 2000, 5000];

      if (isNaN(parsedAmount) || !allowedAmounts.includes(parsedAmount)) {
        return res.status(400).json({
          success: false,
          error: { message: `Invalid gift card denomination. Allowed: ₹${allowedAmounts.join(', ₹')}` }
        });
      }

      if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
        return res.status(400).json({
          success: false,
          error: { message: 'A valid recipient email address is required' }
        });
      }

      if (personalMessage && personalMessage.length > 300) {
        return res.status(400).json({
          success: false,
          error: { message: 'Personal message cannot exceed 300 characters' }
        });
      }

      const userId = req.user.sub;

      // 1. Fetch buyer info
      const [users] = await conn.query('SELECT * FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'User not found' } });
      }
      const buyer = users[0];

      // 2. Generate order number
      const orderNumber = orderService.generateOrderNumber();

      // 3. Create the purchase order record
      const [orderResult] = await conn.query(
        `INSERT INTO orders (
          order_number, user_id, guest_first_name, guest_last_name, guest_email, guest_phone,
          subtotal, discount_amount, delivery_fee, tax_amount, total_amount,
          delivery_method, delivery_address_snapshot, payment_status, order_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber,
          userId,
          buyer.first_name,
          buyer.last_name,
          buyer.email,
          buyer.phone || '',
          parsedAmount,
          0.00,
          0.00,
          0.00,
          parsedAmount,
          'delivery',
          JSON.stringify({ 
            type: 'gift_card',
            recipientEmail: recipientEmail.trim().toLowerCase(),
            recipientName: recipientName ? recipientName.trim() : 'Valued Customer',
            senderName: senderName ? senderName.trim() : `${buyer.first_name} ${buyer.last_name}`,
            personalMessage: personalMessage ? personalMessage.trim() : null
          }),
          'pending',
          'pending',
          `Glacé Gift Card purchase (₹${parsedAmount})`
        ]
      );
      const orderId = orderResult.insertId;

      // 4. Create pending gift card linked to order
      const giftCard = await giftCardService.createGiftCard({
        initialAmount: parsedAmount,
        purchasedBy: userId,
        purchaseOrderId: orderId,
        recipientEmail,
        recipientName,
        senderName: senderName || `${buyer.first_name} ${buyer.last_name}`,
        personalMessage,
        connection: conn
      });

      // 5. Create initial payment entry
      const txnDate = new Date();
      const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
      const transactionReference = `PAY-GC-${txnDate.getFullYear()}${String(txnDate.getMonth() + 1).padStart(2, '0')}-${rand}`;

      await conn.query(
        `INSERT INTO payments (order_id, gateway, transaction_reference, amount, currency, status)
         VALUES (?, 'internal', ?, ?, 'INR', 'pending')`,
        [orderId, transactionReference, parsedAmount]
      );

      await conn.commit();

      res.status(201).json({
        success: true,
        data: {
          orderId,
          orderNumber,
          amount: parsedAmount,
          giftCard: {
            id: giftCard.id,
            code: giftCard.code,
            amount: giftCard.initialAmount,
            recipientEmail: giftCard.recipientEmail,
            recipientName: giftCard.recipientName
          }
        }
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error purchasing gift card:', error);
      res.status(500).json({ success: false, error: { message: error.message || 'Failed to initiate gift card purchase' } });
    } finally {
      conn.release();
    }
  },

  /**
   * POST /api/gift-cards/redeem
   * Claim / bind gift card code to customer's account
   */
  redeemCard: async (req, res) => {
    try {
      const { code } = req.body;
      const userId = req.user.sub;

      const rateKey = `redeem_${userId}_${req.ip}`;
      if (!checkRateLimit(rateKey)) {
        return res.status(429).json({
          success: false,
          error: { message: 'Too many redemption attempts. Please wait a minute and try again.' }
        });
      }

      if (!code) {
        return res.status(400).json({
          success: false,
          error: { message: 'Gift card code is required' }
        });
      }

      const result = await giftCardService.redeemToAccount(code, userId);

      res.status(200).json({
        success: true,
        message: result.isAlreadyBound ? 'Gift card verified' : 'Gift card successfully added to your wallet!',
        data: result
      });
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      res.status(400).json({
        success: false,
        error: { message: error.message || 'Failed to redeem gift card' }
      });
    }
  },

  /**
   * GET /api/gift-cards/my-cards
   * List customer's saved and purchased gift cards
   */
  getMyGiftCards: async (req, res) => {
    try {
      const userId = req.user.sub;
      const cards = await giftCardService.getCustomerGiftCards(userId);

      const totalBalance = cards
        .filter(c => c.status === 'active')
        .reduce((sum, c) => sum + c.currentBalance, 0);

      res.status(200).json({
        success: true,
        data: {
          cards,
          totalBalance: Math.round(totalBalance * 100) / 100
        }
      });
    } catch (error) {
      console.error('Error getting customer gift cards:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch gift cards' }
      });
    }
  },

  /**
   * GET /api/gift-cards/:id/transactions
   * View transaction ledger for a gift card
   */
  getCardTransactions: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.sub;

      const data = await giftCardService.getCardTransactions(parseInt(id, 10), userId);

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error getting card transactions:', error);
      const statusCode = error.message.includes('Unauthorized') ? 403 : 404;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to fetch gift card transactions' }
      });
    }
  },

  /**
   * POST /api/gift-cards/validate
   * Check / validate gift card code during checkout
   */
  validateForCheckout: async (req, res) => {
    try {
      const { code } = req.body;
      const userId = req.user.sub;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: { message: 'Gift card code is required' }
        });
      }

      const result = await giftCardService.validateForCheckout(code, userId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error validating gift card for checkout:', error);
      res.status(400).json({
        success: false,
        error: { message: error.message || 'Invalid gift card' }
      });
    }
  }
};

module.exports = giftCardController;
