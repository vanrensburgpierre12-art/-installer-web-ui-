const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/audit');

const router = express.Router();

// Get all vehicles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { clientId, siteId, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        v.*,
        c.name as client_name,
        s.name as site_name
      FROM vehicles v
      LEFT JOIN clients c ON v.client_id = c.id
      LEFT JOIN sites s ON v.site_id = s.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (clientId) {
      query += ` AND v.client_id = $${++paramCount}`;
      queryParams.push(clientId);
    }

    if (siteId) {
      query += ` AND v.site_id = $${++paramCount}`;
      queryParams.push(siteId);
    }

    query += ` ORDER BY v.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM vehicles v WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (clientId) {
      countQuery += ` AND v.client_id = $${++countParamCount}`;
      countParams.push(clientId);
    }

    if (siteId) {
      countQuery += ` AND v.site_id = $${++countParamCount}`;
      countParams.push(siteId);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      vehicles: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vehicle by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        v.*,
        c.name as client_name, c.contact_person as client_contact,
        s.name as site_name, s.address as site_address
      FROM vehicles v
      LEFT JOIN clients c ON v.client_id = c.id
      LEFT JOIN sites s ON v.site_id = s.id
      WHERE v.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new vehicle
router.post('/', authenticateToken, requireRole(['manager', 'admin']), [
  body('clientId').isUUID(),
  body('siteId').isUUID(),
  body('make').notEmpty().trim(),
  body('model').notEmpty().trim(),
  body('fleetNumber').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      clientId,
      siteId,
      make,
      model,
      color,
      fleetNumber,
      registration,
      kmOrHours,
      year
    } = req.body;

    const result = await pool.query(`
      INSERT INTO vehicles (
        client_id, site_id, make, model, color, fleet_number, 
        registration, km_or_hours, year
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [clientId, siteId, make, model, color, fleetNumber, registration, kmOrHours, year]);

    const vehicle = result.rows[0];
    await createAuditLog(req, null, 'VEHICLE_CREATED', `Vehicle created: ${fleetNumber}`, null, vehicle);

    res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update vehicle
router.put('/:id', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get current vehicle for audit trail
    const currentVehicleResult = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (currentVehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const currentVehicle = currentVehicleResult.rows[0];

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

    const query = `UPDATE vehicles SET ${updateFields.join(', ')} WHERE id = $${++paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    const updatedVehicle = result.rows[0];
    await createAuditLog(req, null, 'VEHICLE_UPDATED', `Vehicle updated: ${updatedVehicle.fleet_number}`, currentVehicle, updatedVehicle);

    res.json({
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vehicle pre-inspection
router.post('/:id/pre-inspection', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const inspectionData = req.body;

    // Check if job exists
    const jobResult = await pool.query('SELECT id FROM jobs WHERE vehicle_id = $1', [id]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'No job found for this vehicle' });
    }

    const jobId = jobResult.rows[0].id;

    // Check if pre-inspection already exists
    const existingResult = await pool.query(
      'SELECT id FROM vehicle_pre_inspections WHERE job_id = $1',
      [jobId]
    );

    let result;
    if (existingResult.rows.length > 0) {
      // Update existing inspection
      const updateFields = [];
      const values = [];
      let paramCount = 0;

      Object.keys(inspectionData).forEach(key => {
        if (inspectionData[key] !== undefined) {
          updateFields.push(`${key} = $${++paramCount}`);
          values.push(inspectionData[key]);
        }
      });

      if (updateFields.length > 0) {
        updateFields.push(`inspected_by = $${++paramCount}`);
        updateFields.push(`inspection_date = CURRENT_TIMESTAMP`);
        values.push(req.user.id);
        values.push(jobId);

        const query = `UPDATE vehicle_pre_inspections SET ${updateFields.join(', ')} WHERE job_id = $${++paramCount} RETURNING *`;
        result = await pool.query(query, values);
      } else {
        result = existingResult;
      }
    } else {
      // Create new inspection
      const insertFields = ['job_id', 'inspected_by'];
      const insertValues = [jobId, req.user.id];
      const insertPlaceholders = ['$1', '$2'];
      let paramCount = 2;

      Object.keys(inspectionData).forEach(key => {
        if (inspectionData[key] !== undefined) {
          insertFields.push(key);
          insertValues.push(inspectionData[key]);
          insertPlaceholders.push(`$${++paramCount}`);
        }
      });

      const query = `
        INSERT INTO vehicle_pre_inspections (${insertFields.join(', ')})
        VALUES (${insertPlaceholders.join(', ')})
        RETURNING *
      `;
      result = await pool.query(query, insertValues);
    }

    const inspection = result.rows[0];
    await createAuditLog(req, jobId, 'PRE_INSPECTION_COMPLETED', `Pre-inspection completed for vehicle`, null, inspection);

    res.json({
      message: 'Pre-inspection saved successfully',
      inspection
    });
  } catch (error) {
    console.error('Pre-inspection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vehicle post-inspection
router.post('/:id/post-inspection', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const inspectionData = req.body;

    // Check if job exists
    const jobResult = await pool.query('SELECT id FROM jobs WHERE vehicle_id = $1', [id]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'No job found for this vehicle' });
    }

    const jobId = jobResult.rows[0].id;

    // Check if post-inspection already exists
    const existingResult = await pool.query(
      'SELECT id FROM vehicle_post_inspections WHERE job_id = $1',
      [jobId]
    );

    let result;
    if (existingResult.rows.length > 0) {
      // Update existing inspection
      const updateFields = [];
      const values = [];
      let paramCount = 0;

      Object.keys(inspectionData).forEach(key => {
        if (inspectionData[key] !== undefined) {
          updateFields.push(`${key} = $${++paramCount}`);
          values.push(inspectionData[key]);
        }
      });

      if (updateFields.length > 0) {
        updateFields.push(`inspected_by = $${++paramCount}`);
        updateFields.push(`inspection_date = CURRENT_TIMESTAMP`);
        values.push(req.user.id);
        values.push(jobId);

        const query = `UPDATE vehicle_post_inspections SET ${updateFields.join(', ')} WHERE job_id = $${++paramCount} RETURNING *`;
        result = await pool.query(query, values);
      } else {
        result = existingResult;
      }
    } else {
      // Create new inspection
      const insertFields = ['job_id', 'inspected_by'];
      const insertValues = [jobId, req.user.id];
      const insertPlaceholders = ['$1', '$2'];
      let paramCount = 2;

      Object.keys(inspectionData).forEach(key => {
        if (inspectionData[key] !== undefined) {
          insertFields.push(key);
          insertValues.push(inspectionData[key]);
          insertPlaceholders.push(`$${++paramCount}`);
        }
      });

      const query = `
        INSERT INTO vehicle_post_inspections (${insertFields.join(', ')})
        VALUES (${insertPlaceholders.join(', ')})
        RETURNING *
      `;
      result = await pool.query(query, insertValues);
    }

    const inspection = result.rows[0];
    await createAuditLog(req, jobId, 'POST_INSPECTION_COMPLETED', `Post-inspection completed for vehicle`, null, inspection);

    res.json({
      message: 'Post-inspection saved successfully',
      inspection
    });
  } catch (error) {
    console.error('Post-inspection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;