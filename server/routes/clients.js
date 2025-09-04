const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/audit');

const router = express.Router();

// Get all clients
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(s.id) as site_count
      FROM clients c
      LEFT JOIN sites s ON c.id = s.client_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM clients');
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      clients: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get client by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        c.*,
        array_agg(
          json_build_object(
            'id', s.id,
            'name', s.name,
            'address', s.address,
            'contact_person', s.contact_person,
            'phone', s.phone
          )
        ) as sites
      FROM clients c
      LEFT JOIN sites s ON c.id = s.client_id
      WHERE c.id = $1
      GROUP BY c.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new client
router.post('/', authenticateToken, requireRole(['manager', 'admin']), [
  body('name').notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      contactPerson,
      email,
      phone,
      address
    } = req.body;

    const result = await pool.query(`
      INSERT INTO clients (name, contact_person, email, phone, address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, contactPerson, email, phone, address]);

    const client = result.rows[0];
    await createAuditLog(req, null, 'CLIENT_CREATED', `Client created: ${name}`, null, client);

    res.status(201).json({
      message: 'Client created successfully',
      client
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update client
router.put('/:id', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get current client for audit trail
    const currentClientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (currentClientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const currentClient = currentClientResult.rows[0];

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id') {
        updateFields.push(`${key} = $${++paramCount}`);
        values.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE clients SET ${updateFields.join(', ')} WHERE id = $${++paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    const updatedClient = result.rows[0];
    await createAuditLog(req, null, 'CLIENT_UPDATED', `Client updated: ${updatedClient.name}`, currentClient, updatedClient);

    res.json({
      message: 'Client updated successfully',
      client: updatedClient
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create site for client
router.post('/:id/sites', authenticateToken, requireRole(['manager', 'admin']), [
  body('name').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      name,
      address,
      contactPerson,
      phone
    } = req.body;

    const result = await pool.query(`
      INSERT INTO sites (client_id, name, address, contact_person, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, name, address, contactPerson, phone]);

    const site = result.rows[0];
    await createAuditLog(req, null, 'SITE_CREATED', `Site created: ${name}`, null, site);

    res.status(201).json({
      message: 'Site created successfully',
      site
    });
  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;