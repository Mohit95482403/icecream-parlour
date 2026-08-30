const crypto = require('crypto');
const db = require('../config/db');
const notificationService = require('./notificationService');

class GiftCardService {
  /**
   * Generate secure unique 16-character alphanumeric code in format: GC-XXXX-XXXX-XXXX
   */
  generateCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 without confusing chars (0, 1, I, O)
    const generateSegment = (length) => {
      const bytes = crypto.randomBytes(length);
      let res = '';
      for (let i = 0; i < length; i++) {
        res += chars[bytes[i] % chars.length];
      }
      return res;
    };
    return `GC-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}`;
  }

  /**
   * Create a new pending gift card (typically upon checkout initiation or customer order placement)
   */
  async createGiftCard({
    initialAmount,
    purchasedBy = null,
    purchaseOrderId = null,
    recipientEmail = null,
    recipientName = null,
    senderName = null,
    personalMessage = null,
    connection = null
  }) {
    const conn = connection || await db.getConnection();
    const shouldManage = !connection;

    try {
      if (shouldManage) await conn.beginTransaction();

      let code;
      let attempts = 0;
      while (attempts < 5) {
        code = this.generateCode();
        const [exists] = await conn.query('SELECT id FROM gift_cards WHERE code = ?', [code]);
        if (exists.length === 0) break;
        attempts++;
      }

      if (attempts >= 5) throw new Error('Failed to generate unique gift card code');

      const amount = parseFloat(initialAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid gift card amount');
      }

      const [result] = await conn.query(
        `INSERT INTO gift_cards 
         (code, initial_amount, current_balance, currency, status, purchased_by, purchase_order_id, recipient_email, recipient_name, sender_name, personal_message)
         VALUES (?, ?, ?, 'INR', 'pending', ?, ?, ?, ?, ?, ?)`,
        [
          code,
          amount,
          amount,
          purchasedBy,
          purchaseOrderId,
          recipientEmail ? recipientEmail.trim().toLowerCase() : null,
          recipientName ? recipientName.trim() : null,
          senderName ? senderName.trim() : null,
          personalMessage || null
        ]
      );

      const giftCardId = result.insertId;

      if (shouldManage) await conn.commit();

      return {
        id: giftCardId,
        code,
        initialAmount: amount,
        currentBalance: amount,
        currency: 'INR',
        status: 'pending',
        recipientEmail,
        recipientName
      };
    } catch (error) {
      if (shouldManage) await conn.rollback();
      throw error;
    } finally {
      if (shouldManage) conn.release();
    }
  }

  /**
   * Activate a gift card after payment is confirmed
   */
  async activateGiftCard(giftCardId, externalConnection = null) {
    const conn = externalConnection || await db.getConnection();
    const shouldManage = !externalConnection;

    try {
      if (shouldManage) await conn.beginTransaction();

      const [cards] = await conn.query(
        'SELECT * FROM gift_cards WHERE id = ? FOR UPDATE',
        [giftCardId]
      );

      if (cards.length === 0) throw new Error('Gift card not found');
      const card = cards[0];

      if (card.status === 'active') {
        if (shouldManage) await conn.commit();
        return card; // Idempotent
      }

      // Expiration: 1 year from activation
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await conn.query(
        `UPDATE gift_cards SET 
           status = 'active',
           activated_at = NOW(),
           expires_at = ?,
           updated_at = NOW()
         WHERE id = ?`,
        [expiresAt, giftCardId]
      );

      // Record activation in ledger
      await conn.query(
        `INSERT INTO gift_card_transactions 
         (gift_card_id, type, amount, balance_after, reference_type, reference_id, description, performed_by)
         VALUES (?, 'activation', ?, ?, 'purchase_order', ?, 'Gift card activated on payment confirmation', ?)`,
        [giftCardId, card.initial_amount, card.initial_amount, card.purchase_order_id ? String(card.purchase_order_id) : null, card.purchased_by]
      );

      if (shouldManage) await conn.commit();

      // Notify purchaser
      if (card.purchased_by) {
        try {
          await notificationService.createNotification(
            card.purchased_by,
            card.purchase_order_id,
            'GIFT_CARD_ACTIVATED',
            'Gift Card Ready',
            `Your ₹${parseFloat(card.initial_amount).toLocaleString('en-IN')} Glacé Gift Card (${card.code}) is now active and ready to use.`,
            { giftCardId: card.id, code: card.code, amount: card.initial_amount }
          );
        } catch (nErr) {
          console.warn('Gift card notification failed:', nErr.message);
        }
      }

      return {
        ...card,
        status: 'active',
        expires_at: expiresAt
      };
    } catch (error) {
      if (shouldManage) await conn.rollback();
      throw error;
    } finally {
      if (shouldManage) conn.release();
    }
  }

  /**
   * Activate all pending gift cards associated with a given purchase order
   */
  async activateGiftCardsByOrderId(orderId, externalConnection = null) {
    const conn = externalConnection || await db.getConnection();
    const shouldManage = !externalConnection;

    try {
      if (shouldManage) await conn.beginTransaction();

      const [cards] = await conn.query(
        'SELECT id FROM gift_cards WHERE purchase_order_id = ? AND status = "pending" FOR UPDATE',
        [orderId]
      );

      for (const c of cards) {
        await this.activateGiftCard(c.id, conn);
      }

      if (shouldManage) await conn.commit();
    } catch (error) {
      if (shouldManage) await conn.rollback();
      throw error;
    } finally {
      if (shouldManage) conn.release();
    }
  }

  /**
   * Customer redeems / claims a gift card code to bind it to their account
   */
  async redeemToAccount(code, userId) {
    if (!code || !userId) throw new Error('Gift card code and user ID are required');
    const normalizedCode = code.trim().toUpperCase();

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [cards] = await conn.query(
        'SELECT * FROM gift_cards WHERE code = ? FOR UPDATE',
        [normalizedCode]
      );

      if (cards.length === 0) {
        throw new Error('Invalid gift card code. Please check and try again.');
      }

      const card = cards[0];

      if (card.status === 'suspended') {
        throw new Error('This gift card has been suspended. Please contact customer care.');
      }
      if (card.status === 'cancelled') {
        throw new Error('This gift card has been cancelled.');
      }
      if (card.status === 'pending') {
        throw new Error('This gift card is not yet activated.');
      }
      if (card.status === 'expired' || (card.expires_at && new Date(card.expires_at) <= new Date())) {
        throw new Error('This gift card has expired.');
      }
      if (parseFloat(card.current_balance) <= 0) {
        throw new Error('This gift card has no remaining balance.');
      }

      // Check if already bound to another customer
      if (card.redeemed_by && card.redeemed_by !== userId) {
        throw new Error('This gift card has already been claimed by another customer account.');
      }

      // Bind to user if not already bound
      if (!card.redeemed_by) {
        await conn.query(
          `UPDATE gift_cards SET redeemed_by = ?, redeemed_at = NOW(), updated_at = NOW() WHERE id = ?`,
          [userId, card.id]
        );
      }

      await conn.commit();

      return {
        id: card.id,
        code: card.code,
        initialAmount: parseFloat(card.initial_amount),
        currentBalance: parseFloat(card.current_balance),
        currency: card.currency,
        status: card.status,
        expiresAt: card.expires_at,
        senderName: card.sender_name,
        recipientName: card.recipient_name,
        personalMessage: card.personal_message,
        isAlreadyBound: card.redeemed_by === userId
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Validate gift card for checkout application (can be redeemed by user or valid unredeemed code)
   */
  async validateForCheckout(code, userId) {
    if (!code) throw new Error('Gift card code is required');
    const normalizedCode = code.trim().toUpperCase();

    const [cards] = await db.query(
      'SELECT * FROM gift_cards WHERE code = ?',
      [normalizedCode]
    );

    if (cards.length === 0) {
      throw new Error('Gift card not found');
    }

    const card = cards[0];

    if (card.status !== 'active') {
      throw new Error(`Gift card cannot be used (status: ${card.status})`);
    }

    if (card.expires_at && new Date(card.expires_at) <= new Date()) {
      throw new Error('This gift card has expired');
    }

    const currentBalance = parseFloat(card.current_balance);
    if (currentBalance <= 0) {
      throw new Error('This gift card has zero balance');
    }

    // Ownership check: if already claimed by someone else, reject
    if (card.redeemed_by && card.redeemed_by !== userId) {
      throw new Error('This gift card is registered to a different account');
    }

    return {
      id: card.id,
      code: card.code,
      currentBalance,
      currency: card.currency,
      status: card.status,
      expiresAt: card.expires_at
    };
  }

  /**
   * Atomic debit of gift card balance during order placement
   */
  async applyToOrder(giftCardId, orderId, debitAmount, userId, externalConnection) {
    if (!externalConnection) throw new Error('External MySQL connection required for atomic debit');
    const conn = externalConnection;

    const [cards] = await conn.query(
      'SELECT * FROM gift_cards WHERE id = ? FOR UPDATE',
      [giftCardId]
    );

    if (cards.length === 0) throw new Error('Gift card not found');
    const card = cards[0];

    if (card.status !== 'active') {
      throw new Error(`Gift card is not active (${card.status})`);
    }

    const available = parseFloat(card.current_balance);
    const amountToDebit = Math.min(available, parseFloat(debitAmount));

    if (amountToDebit <= 0) {
      throw new Error('Invalid gift card deduction amount');
    }

    const newBalance = Math.round((available - amountToDebit) * 100) / 100;
    const newStatus = newBalance === 0 ? 'exhausted' : 'active';

    // Update card balance
    await conn.query(
      `UPDATE gift_cards SET 
         current_balance = ?,
         status = ?,
         redeemed_by = COALESCE(redeemed_by, ?),
         redeemed_at = COALESCE(redeemed_at, NOW()),
         updated_at = NOW()
       WHERE id = ?`,
      [newBalance, newStatus, userId, giftCardId]
    );

    // Record ledger entry
    await conn.query(
      `INSERT INTO gift_card_transactions 
       (gift_card_id, type, amount, balance_after, reference_type, reference_id, description, performed_by)
       VALUES (?, 'redemption', ?, ?, 'order', ?, ?, ?)`,
      [
        giftCardId,
        -amountToDebit,
        newBalance,
        String(orderId),
        `Redeemed ₹${amountToDebit} on order #${orderId}`,
        userId
      ]
    );

    return {
      giftCardId,
      amountDebited: amountToDebit,
      remainingBalance: newBalance,
      newStatus
    };
  }

  /**
   * Restore gift card balance upon order cancellation or refund
   */
  async refundToCard(giftCardId, refundAmount, referenceId, performedBy = null, externalConnection = null) {
    const conn = externalConnection || await db.getConnection();
    const shouldManage = !externalConnection;

    try {
      if (shouldManage) await conn.beginTransaction();

      const [cards] = await conn.query(
        'SELECT * FROM gift_cards WHERE id = ? FOR UPDATE',
        [giftCardId]
      );

      if (cards.length === 0) throw new Error('Gift card not found');
      const card = cards[0];

      const currentBalance = parseFloat(card.current_balance);
      const amountToRestore = parseFloat(refundAmount);
      if (isNaN(amountToRestore) || amountToRestore <= 0) {
        throw new Error('Invalid refund amount to restore');
      }

      const initialAmount = parseFloat(card.initial_amount);
      const newBalance = Math.min(initialAmount, Math.round((currentBalance + amountToRestore) * 100) / 100);
      const newStatus = (card.status === 'exhausted' && newBalance > 0) ? 'active' : card.status;

      await conn.query(
        `UPDATE gift_cards SET 
           current_balance = ?,
           status = ?,
           updated_at = NOW()
         WHERE id = ?`,
        [newBalance, newStatus, giftCardId]
      );

      // Ledger entry
      await conn.query(
        `INSERT INTO gift_card_transactions 
         (gift_card_id, type, amount, balance_after, reference_type, reference_id, description, performed_by)
         VALUES (?, 'refund', ?, ?, 'refund', ?, ?, ?)`,
        [
          giftCardId,
          amountToRestore,
          newBalance,
          String(referenceId),
          `Refund/restoration of ₹${amountToRestore} from reference ${referenceId}`,
          performedBy
        ]
      );

      if (shouldManage) await conn.commit();

      return {
        giftCardId,
        restoredAmount: amountToRestore,
        newBalance,
        status: newStatus
      };
    } catch (error) {
      if (shouldManage) await conn.rollback();
      throw error;
    } finally {
      if (shouldManage) conn.release();
    }
  }

  /**
   * Get all gift cards associated with a customer
   */
  async getCustomerGiftCards(userId) {
    const [cards] = await db.query(
      `SELECT g.*, 
              o.order_number as purchase_order_number,
              (SELECT COUNT(*) FROM gift_card_transactions WHERE gift_card_id = g.id) as transaction_count
       FROM gift_cards g
       LEFT JOIN orders o ON g.purchase_order_id = o.id
       WHERE (g.redeemed_by = ? OR g.purchased_by = ?)
         AND g.status != 'cancelled'
       ORDER BY g.created_at DESC`,
      [userId, userId]
    );

    return cards.map(c => ({
      id: c.id,
      code: c.code,
      initialAmount: parseFloat(c.initial_amount),
      currentBalance: parseFloat(c.current_balance),
      currency: c.currency,
      status: c.status,
      purchasedBy: c.purchased_by,
      redeemedBy: c.redeemed_by,
      isOwner: c.redeemed_by === userId || c.purchased_by === userId,
      recipientEmail: c.recipient_email,
      recipientName: c.recipient_name,
      senderName: c.sender_name,
      personalMessage: c.personal_message,
      activatedAt: c.activated_at,
      expiresAt: c.expires_at,
      createdAt: c.created_at,
      purchaseOrderNumber: c.purchase_order_number,
      transactionCount: c.transaction_count
    }));
  }

  /**
   * Get transactions for a gift card with IDOR ownership validation
   */
  async getCardTransactions(cardId, userId) {
    const [cards] = await db.query('SELECT * FROM gift_cards WHERE id = ?', [cardId]);
    if (cards.length === 0) throw new Error('Gift card not found');
    const card = cards[0];

    if (card.redeemed_by !== userId && card.purchased_by !== userId) {
      throw new Error('Unauthorized access to this gift card');
    }

    const [txns] = await db.query(
      `SELECT * FROM gift_card_transactions WHERE gift_card_id = ? ORDER BY created_at DESC`,
      [cardId]
    );

    return {
      card: {
        id: card.id,
        code: card.code,
        initialAmount: parseFloat(card.initial_amount),
        currentBalance: parseFloat(card.current_balance),
        status: card.status,
        expiresAt: card.expires_at
      },
      transactions: txns.map(t => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        balanceAfter: parseFloat(t.balance_after),
        referenceType: t.reference_type,
        referenceId: t.reference_id,
        description: t.description,
        createdAt: t.created_at
      }))
    };
  }

  /**
   * Admin: List / search gift cards with filters and pagination
   */
  async adminListGiftCards({ page = 1, limit = 20, search = '', status = '' }) {
    const offset = (page - 1) * limit;
    const whereClauses = [];
    const params = [];

    if (status && status !== 'all') {
      whereClauses.push('g.status = ?');
      params.push(status);
    } else {
      // By default hide deleted/cancelled cards from normal view
      whereClauses.push("g.status != 'cancelled'");
    }

    if (search) {
      const s = `%${search.trim()}%`;
      whereClauses.push('(g.code LIKE ? OR g.recipient_email LIKE ? OR g.recipient_name LIKE ? OR u_buyer.email LIKE ? OR u_redeem.email LIKE ?)');
      params.push(s, s, s, s, s);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM gift_cards g
      LEFT JOIN users u_buyer ON g.purchased_by = u_buyer.id
      LEFT JOIN users u_redeem ON g.redeemed_by = u_redeem.id
      ${whereSql}
    `;

    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0]?.total || 0;

    const listQuery = `
      SELECT g.*,
             CONCAT(u_buyer.first_name, ' ', u_buyer.last_name) as buyer_name,
             u_buyer.email as buyer_email,
             CONCAT(u_redeem.first_name, ' ', u_redeem.last_name) as redeemer_name,
             u_redeem.email as redeemer_email,
             o.order_number as purchase_order_number
      FROM gift_cards g
      LEFT JOIN users u_buyer ON g.purchased_by = u_buyer.id
      LEFT JOIN users u_redeem ON g.redeemed_by = u_redeem.id
      LEFT JOIN orders o ON g.purchase_order_id = o.id
      ${whereSql}
      ORDER BY g.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await db.query(listQuery, queryParams);

    return {
      cards: rows.map(r => ({
        id: r.id,
        code: r.code,
        initialAmount: parseFloat(r.initial_amount),
        currentBalance: parseFloat(r.current_balance),
        currency: r.currency,
        status: r.status,
        buyerName: r.buyer_name,
        buyerEmail: r.buyer_email,
        redeemerName: r.redeemer_name,
        redeemerEmail: r.redeemer_email,
        recipientEmail: r.recipient_email,
        recipientName: r.recipient_name,
        senderName: r.sender_name,
        personalMessage: r.personal_message,
        activatedAt: r.activated_at,
        expiresAt: r.expires_at,
        createdAt: r.created_at,
        purchaseOrderNumber: r.purchase_order_number
      })),
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Admin: Get single gift card details + ledger
   */
  async adminGetGiftCard(cardId) {
    const [cards] = await db.query(
      `SELECT g.*,
             CONCAT(u_buyer.first_name, ' ', u_buyer.last_name) as buyer_name,
             u_buyer.email as buyer_email,
             CONCAT(u_redeem.first_name, ' ', u_redeem.last_name) as redeemer_name,
             u_redeem.email as redeemer_email,
             o.order_number as purchase_order_number
      FROM gift_cards g
      LEFT JOIN users u_buyer ON g.purchased_by = u_buyer.id
      LEFT JOIN users u_redeem ON g.redeemed_by = u_redeem.id
      LEFT JOIN orders o ON g.purchase_order_id = o.id
      WHERE g.id = ?`,
      [cardId]
    );

    if (cards.length === 0) throw new Error('Gift card not found');
    const card = cards[0];

    const [txns] = await db.query(
      `SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) as performed_by_name
       FROM gift_card_transactions t
       LEFT JOIN users u ON t.performed_by = u.id
       WHERE t.gift_card_id = ?
       ORDER BY t.created_at DESC`,
      [cardId]
    );

    return {
      card: {
        id: card.id,
        code: card.code,
        initialAmount: parseFloat(card.initial_amount),
        currentBalance: parseFloat(card.current_balance),
        currency: card.currency,
        status: card.status,
        buyerName: card.buyer_name,
        buyerEmail: card.buyer_email,
        redeemerName: card.redeemer_name,
        redeemerEmail: card.redeemer_email,
        recipientEmail: card.recipient_email,
        recipientName: card.recipient_name,
        senderName: card.sender_name,
        personalMessage: card.personal_message,
        activatedAt: card.activated_at,
        expiresAt: card.expires_at,
        createdAt: card.created_at,
        purchaseOrderNumber: card.purchase_order_number
      },
      transactions: txns.map(t => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        balanceAfter: parseFloat(t.balance_after),
        referenceType: t.reference_type,
        referenceId: t.reference_id,
        description: t.description,
        performedByName: t.performed_by_name,
        createdAt: t.created_at
      }))
    };
  }

  /**
   * Admin: Issue a new active gift card directly
   */
  async adminIssueGiftCard({
    amount,
    recipientEmail = null,
    recipientName = null,
    senderName = 'GLACÉ Customer Care',
    personalMessage = null,
    adminId
  }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      let code;
      let attempts = 0;
      while (attempts < 5) {
        code = this.generateCode();
        const [exists] = await conn.query('SELECT id FROM gift_cards WHERE code = ?', [code]);
        if (exists.length === 0) break;
        attempts++;
      }

      const initialAmount = parseFloat(amount);
      if (isNaN(initialAmount) || initialAmount <= 0) {
        throw new Error('Valid amount is required');
      }

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const [result] = await conn.query(
        `INSERT INTO gift_cards 
         (code, initial_amount, current_balance, currency, status, purchased_by, recipient_email, recipient_name, sender_name, personal_message, activated_at, expires_at)
         VALUES (?, ?, ?, 'INR', 'active', ?, ?, ?, ?, ?, NOW(), ?)`,
        [
          code,
          initialAmount,
          initialAmount,
          adminId,
          recipientEmail ? recipientEmail.trim().toLowerCase() : null,
          recipientName ? recipientName.trim() : null,
          senderName,
          personalMessage,
          expiresAt
        ]
      );

      const giftCardId = result.insertId;

      await conn.query(
        `INSERT INTO gift_card_transactions 
         (gift_card_id, type, amount, balance_after, reference_type, reference_id, description, performed_by)
         VALUES (?, 'activation', ?, ?, 'admin_issue', ?, 'Admin issued gift card', ?)`,
        [giftCardId, initialAmount, initialAmount, String(giftCardId), adminId]
      );

      // Audit log
      await conn.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description)
         VALUES (?, 'ISSUE_GIFT_CARD', 'gift_card', ?, ?)`,
        [adminId, String(giftCardId), `Issued ₹${initialAmount} gift card (${code}) to ${recipientEmail || 'Unassigned'}`]
      );

      await conn.commit();

      return {
        id: giftCardId,
        code,
        initialAmount,
        currentBalance: initialAmount,
        status: 'active',
        expiresAt,
        recipientEmail
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Admin: Suspend a gift card
   */
  async adminSuspendGiftCard(cardId, adminId, reason = 'Suspended by admin') {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [cards] = await conn.query('SELECT * FROM gift_cards WHERE id = ? FOR UPDATE', [cardId]);
      if (cards.length === 0) throw new Error('Gift card not found');
      const card = cards[0];

      if (card.status === 'suspended') {
        await conn.commit();
        return { success: true, message: 'Card is already suspended' };
      }

      await conn.query(
        'UPDATE gift_cards SET status = "suspended", updated_at = NOW() WHERE id = ?',
        [cardId]
      );

      await conn.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description)
         VALUES (?, 'SUSPEND_GIFT_CARD', 'gift_card', ?, ?)`,
        [adminId, String(cardId), `Suspended gift card #${cardId} (${card.code}). Reason: ${reason}`]
      );

      await conn.commit();
      return { success: true, status: 'suspended' };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Admin: Activate / Resume a gift card
   */
  async adminActivateGiftCard(cardId, adminId) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [cards] = await conn.query('SELECT * FROM gift_cards WHERE id = ? FOR UPDATE', [cardId]);
      if (cards.length === 0) throw new Error('Gift card not found');
      const card = cards[0];

      const newStatus = parseFloat(card.current_balance) === 0 ? 'exhausted' : 'active';

      await conn.query(
        'UPDATE gift_cards SET status = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, cardId]
      );

      await conn.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description)
         VALUES (?, 'ACTIVATE_GIFT_CARD', 'gift_card', ?, ?)`,
        [adminId, String(cardId), `Activated gift card #${cardId} (${card.code})`]
      );

      await conn.commit();
      return { success: true, status: newStatus };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Admin: Adjust balance up or down
   */
  async adminAdjustBalance(cardId, adjustmentAmount, reason, adminId) {
    const delta = parseFloat(adjustmentAmount);
    if (isNaN(delta) || delta === 0) {
      throw new Error('Invalid adjustment amount. Must be non-zero.');
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [cards] = await conn.query('SELECT * FROM gift_cards WHERE id = ? FOR UPDATE', [cardId]);
      if (cards.length === 0) throw new Error('Gift card not found');
      const card = cards[0];

      const currentBalance = parseFloat(card.current_balance);
      const newBalance = Math.round((currentBalance + delta) * 100) / 100;

      if (newBalance < 0) {
        throw new Error(`Cannot reduce balance below 0. Current balance is ₹${currentBalance}`);
      }

      const newStatus = newBalance === 0 ? 'exhausted' : (card.status === 'exhausted' ? 'active' : card.status);

      await conn.query(
        'UPDATE gift_cards SET current_balance = ?, status = ?, updated_at = NOW() WHERE id = ?',
        [newBalance, newStatus, cardId]
      );

      // Ledger entry
      await conn.query(
        `INSERT INTO gift_card_transactions 
         (gift_card_id, type, amount, balance_after, reference_type, reference_id, description, performed_by)
         VALUES (?, 'adjustment', ?, ?, 'admin_adjustment', ?, ?, ?)`,
        [
          cardId,
          delta,
          newBalance,
          String(adminId),
          reason || `Admin balance adjustment of ${delta > 0 ? '+' : ''}₹${delta}`,
          adminId
        ]
      );

      // Audit log
      await conn.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description)
         VALUES (?, 'ADJUST_GIFT_CARD_BALANCE', 'gift_card', ?, ?)`,
        [adminId, String(cardId), `Adjusted balance for card #${cardId} by ₹${delta} to ₹${newBalance}. Reason: ${reason}`]
      );

      await conn.commit();

      return {
        cardId,
        previousBalance: currentBalance,
        newBalance,
        delta,
        status: newStatus
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Admin: Delete / Revoke gift card
   * Sets status to 'cancelled', zeros out active balance, writes to ledger, and hides from customer wallet
   */
  async adminDeleteGiftCard(cardId, adminId, reason) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [cards] = await conn.query('SELECT * FROM gift_cards WHERE id = ? FOR UPDATE', [cardId]);
      if (cards.length === 0) {
        throw new Error('Gift card not found');
      }
      const card = cards[0];

      if (card.status === 'cancelled') {
        await conn.commit();
        return {
          success: true,
          giftCardId: card.id,
          code: card.code,
          status: 'cancelled',
          message: 'Gift card is already deleted/cancelled'
        };
      }

      const currentBalance = parseFloat(card.current_balance) || 0;

      // Update gift card to cancelled and zero balance
      await conn.query(
        `UPDATE gift_cards SET 
           current_balance = 0.00,
           status = 'cancelled',
           updated_at = NOW()
         WHERE id = ?`,
        [cardId]
      );

      // Record transaction in ledger for financial audit trail
      await conn.query(
        `INSERT INTO gift_card_transactions 
         (gift_card_id, type, amount, balance_after, reference_type, reference_id, description, performed_by)
         VALUES (?, 'adjustment', ?, 0.00, 'admin_delete', ?, ?, ?)`,
        [
          cardId,
          -currentBalance,
          String(adminId),
          reason || `Gift card deleted and revoked by admin. (Revoked balance: ₹${currentBalance})`,
          adminId
        ]
      );

      // Audit log entry
      try {
        await conn.query(
          `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description)
           VALUES (?, 'DELETE_GIFT_CARD', 'gift_card', ?, ?)`,
          [adminId, String(cardId), `Deleted gift card #${cardId} (${card.code}). Previous balance: ₹${currentBalance}`]
        );
      } catch (auditErr) {
        // Non-blocking if audit_logs table is not present
      }

      await conn.commit();

      return {
        success: true,
        giftCardId: card.id,
        code: card.code,
        status: 'cancelled',
        revokedBalance: currentBalance,
        message: 'Gift card deleted successfully'
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}

module.exports = new GiftCardService();
