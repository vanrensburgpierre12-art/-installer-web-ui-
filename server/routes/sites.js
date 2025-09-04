const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/audit');

const router = express.Router();

// Get all sites
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { clientId, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        s.*,
        c.name as client_name
      FROM sites s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (clientId) {
      query += ` AND s.client_id = $${++paramCount}`;
      queryParams.push(clientId);
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM sites s WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (clientId) {
      countQuery += ` AND s.client_id = $${++countParamCount}`;
      countParams.push(clientId);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      sites: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get sites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get site by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        s.*,
        c.name as client_name, c.contact_person as client_contact
      FROM sites s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get site error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new site
router.post('/', authenticateToken, requireRole(['manager', 'admin']), [
  body('clientId').isUUID(),
  body('name').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      clientId,
      name,
      address,
      contactPerson,
      phone
    } = req.body;

    const result = await pool.query(`
      INSERT INTO sites (client_id, name, address, contact_person, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [clientId, name, address, contactPerson, phone]);

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

// Update site
router.put('/:id', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get current site for audit trail
    const currentSiteResult = await pool.query('SELECT * FROM sites WHERE id = $1', [id]);
    if (currentSiteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const currentSite = currentSiteResult.rows[0];

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id') {
        const dbField = key === 'contactPerson' ? 'contact_person' : key;
        updateFields.push(`${dbField} = $${++paramCount}`);
        values.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE sites SET ${updateFields.join(', ')} WHERE id = $${++paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    const updatedSite = result.rows[0];
    await createAuditLog(req, null, 'SITE_UPDATED', `Site updated: ${updatedSite.name}`, currentSite, updatedSite);

    res.json({
      message: 'Site updated successfully',
      site: updatedSite
    });
  } catch (error) {
    console.error('Update site error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete site
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Get site for audit trail
    const siteResult = await pool.query('SELECT * FROM sites WHERE id = $1', [id]);
    if (siteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const site = siteResult.rows[0];

    // Check if site has vehicles or jobs
    const vehiclesResult = await pool.query('SELECT COUNT(*) FROM vehicles WHERE site_id = $1', [id]);
    const jobsResult = await pool.query('SELECT COUNT(*) FROM jobs WHERE site_id = $1', [id]);

    if (parseInt(vehiclesResult.rows[0].count) > 0 || parseInt(jobsResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete site with associated vehicles or jobs' 
      });
    }

    await pool.query('DELETE FROM sites WHERE id = $1', [id]);

    await createAuditLog(req, null, 'SITE_DELETED', `Site deleted: ${site.name}`, site, null);

    res.json({
      message: 'Site deleted successfully'
    });
  } catch (error) {
    console.error('Delete site error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;