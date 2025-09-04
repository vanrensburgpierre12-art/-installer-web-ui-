const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/audit');

const router = express.Router();

// Get all users
router.get('/', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT 
        id, username, email, first_name, last_name, role, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        id, username, email, first_name, last_name, role, is_active, created_at, updated_at
      FROM users
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), [
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['installer', 'manager', 'admin']),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Get current user for audit trail
    const currentUserResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = currentUserResult.rows[0];

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id') {
        const dbField = key === 'firstName' ? 'first_name' : 
                       key === 'lastName' ? 'last_name' : 
                       key === 'isActive' ? 'is_active' : key;
        
        updateFields.push(`${dbField} = $${++paramCount}`);
        values.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${++paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    const updatedUser = result.rows[0];
    await createAuditLog(req, null, 'USER_UPDATED', `User updated: ${updatedUser.username}`, currentUser, updatedUser);

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deactivate user
router.post('/:id/deactivate', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    await createAuditLog(req, null, 'USER_DEACTIVATED', `User deactivated: ${user.username}`, null, user);

    res.json({
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reactivate user
router.post('/:id/reactivate', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE users 
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    await createAuditLog(req, null, 'USER_REACTIVATED', `User reactivated: ${user.username}`, null, user);

    res.json({
      message: 'User reactivated successfully',
      user
    });
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;