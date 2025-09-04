const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/audit');

const router = express.Router();

// Get all jobs with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, jobType, technicianId, clientId, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        j.*,
        c.name as client_name,
        s.name as site_name,
        v.make, v.model, v.fleet_number,
        u.first_name as technician_first_name,
        u.last_name as technician_last_name
      FROM jobs j
      LEFT JOIN clients c ON j.client_id = c.id
      LEFT JOIN sites s ON j.site_id = s.id
      LEFT JOIN vehicles v ON j.vehicle_id = v.id
      LEFT JOIN users u ON j.assigned_technician_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (status) {
      query += ` AND j.status = $${++paramCount}`;
      queryParams.push(status);
    }

    if (jobType) {
      query += ` AND j.job_type = $${++paramCount}`;
      queryParams.push(jobType);
    }

    if (technicianId) {
      query += ` AND j.assigned_technician_id = $${++paramCount}`;
      queryParams.push(technicianId);
    }

    if (clientId) {
      query += ` AND j.client_id = $${++paramCount}`;
      queryParams.push(clientId);
    }

    // Role-based filtering
    if (req.user.role === 'installer') {
      query += ` AND j.assigned_technician_id = $${++paramCount}`;
      queryParams.push(req.user.id);
    }

    query += ` ORDER BY j.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM jobs j WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (status) {
      countQuery += ` AND j.status = $${++countParamCount}`;
      countParams.push(status);
    }

    if (jobType) {
      countQuery += ` AND j.job_type = $${++countParamCount}`;
      countParams.push(jobType);
    }

    if (technicianId) {
      countQuery += ` AND j.assigned_technician_id = $${++countParamCount}`;
      countParams.push(technicianId);
    }

    if (clientId) {
      countQuery += ` AND j.client_id = $${++countParamCount}`;
      countParams.push(clientId);
    }

    if (req.user.role === 'installer') {
      countQuery += ` AND j.assigned_technician_id = $${++countParamCount}`;
      countParams.push(req.user.id);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      jobs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        j.*,
        c.name as client_name, c.contact_person as client_contact,
        s.name as site_name, s.address as site_address,
        v.make, v.model, v.color, v.fleet_number, v.registration, v.km_or_hours,
        u.first_name as technician_first_name,
        u.last_name as technician_last_name
      FROM jobs j
      LEFT JOIN clients c ON j.client_id = c.id
      LEFT JOIN sites s ON j.site_id = s.id
      LEFT JOIN vehicles v ON j.vehicle_id = v.id
      LEFT JOIN users u ON j.assigned_technician_id = u.id
      WHERE j.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.rows[0];

    // Get job images
    const imagesResult = await pool.query(
      'SELECT * FROM job_images WHERE job_id = $1 ORDER BY uploaded_at',
      [id]
    );

    // Get job tasks
    const tasksResult = await pool.query(
      'SELECT * FROM job_tasks WHERE job_id = $1 ORDER BY created_at',
      [id]
    );

    // Get pre-inspection
    const preInspectionResult = await pool.query(
      'SELECT * FROM vehicle_pre_inspections WHERE job_id = $1',
      [id]
    );

    // Get post-inspection
    const postInspectionResult = await pool.query(
      'SELECT * FROM vehicle_post_inspections WHERE job_id = $1',
      [id]
    );

    // Get sign-offs
    const signOffsResult = await pool.query(
      'SELECT * FROM job_sign_offs WHERE job_id = $1 ORDER BY signed_at',
      [id]
    );

    res.json({
      ...job,
      images: imagesResult.rows,
      tasks: tasksResult.rows,
      preInspection: preInspectionResult.rows[0] || null,
      postInspection: postInspectionResult.rows[0] || null,
      signOffs: signOffsResult.rows
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new job
router.post('/', authenticateToken, requireRole(['manager', 'admin']), [
  body('clientId').isUUID(),
  body('siteId').isUUID(),
  body('vehicleId').isUUID(),
  body('jobType').isIn(['repair', 'install', 'maintenance', 'upgrade', 'removal', 'health_check', 're_installation']),
  body('workType').isIn(['new_installation', 'upgrade_remove_old', 'removals', 're_installation', 'health_check', 'repair']),
  body('scheduledDate').isISO8601().toDate(),
  body('scheduledTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      clientId,
      siteId,
      vehicleId,
      assignedTechnicianId,
      jobType,
      workType,
      productType,
      description,
      scheduledDate,
      scheduledTime
    } = req.body;

    // Generate job card number
    const jobCardNumber = `JC${Date.now()}`;

    const result = await pool.query(`
      INSERT INTO jobs (
        job_card_number, client_id, site_id, vehicle_id, assigned_technician_id,
        job_type, work_type, product_type, description, scheduled_date, scheduled_time, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      jobCardNumber, clientId, siteId, vehicleId, assignedTechnicianId,
      jobType, workType, productType, description, scheduledDate, scheduledTime, req.user.id
    ]);

    const job = result.rows[0];

    await createAuditLog(req, job.id, 'JOB_CREATED', `Job created: ${jobCardNumber}`, null, job);

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update job
router.put('/:id', authenticateToken, [
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled', 'requires_approval', 'approved']),
  body('startTime').optional().isISO8601().toDate(),
  body('finishTime').optional().isISO8601().toDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Get current job for audit trail
    const currentJobResult = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    if (currentJobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const currentJob = currentJobResult.rows[0];

    // Check permissions
    if (req.user.role === 'installer' && currentJob.assigned_technician_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }

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

    const query = `UPDATE jobs SET ${updateFields.join(', ')} WHERE id = $${++paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    const updatedJob = result.rows[0];

    await createAuditLog(req, id, 'JOB_UPDATED', `Job updated: ${currentJob.job_card_number}`, currentJob, updatedJob);

    res.json({
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start job
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE jobs 
      SET status = 'in_progress', start_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND assigned_technician_id = $2
      RETURNING *
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found or not assigned to you' });
    }

    const job = result.rows[0];
    await createAuditLog(req, id, 'JOB_STARTED', `Job started: ${job.job_card_number}`, null, job);

    res.json({
      message: 'Job started successfully',
      job
    });
  } catch (error) {
    console.error('Start job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete job
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE jobs 
      SET status = 'requires_approval', finish_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND assigned_technician_id = $2
      RETURNING *
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found or not assigned to you' });
    }

    const job = result.rows[0];
    await createAuditLog(req, id, 'JOB_COMPLETED', `Job completed: ${job.job_card_number}`, null, job);

    res.json({
      message: 'Job completed successfully',
      job
    });
  } catch (error) {
    console.error('Complete job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add job task
router.post('/:id/tasks', authenticateToken, [
  body('taskDescription').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { taskDescription } = req.body;

    const result = await pool.query(`
      INSERT INTO job_tasks (job_id, task_description)
      VALUES ($1, $2)
      RETURNING *
    `, [id, taskDescription]);

    const task = result.rows[0];
    await createAuditLog(req, id, 'TASK_ADDED', `Task added: ${taskDescription}`, null, task);

    res.status(201).json({
      message: 'Task added successfully',
      task
    });
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete task
router.put('/:id/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const { id, taskId } = req.params;

    const result = await pool.query(`
      UPDATE job_tasks 
      SET completed = true, completed_by = $1, completed_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND job_id = $3
      RETURNING *
    `, [req.user.id, taskId, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = result.rows[0];
    await createAuditLog(req, id, 'TASK_COMPLETED', `Task completed: ${task.task_description}`, null, task);

    res.json({
      message: 'Task completed successfully',
      task
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;