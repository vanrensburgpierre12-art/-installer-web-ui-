const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireManager } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/audit');

const router = express.Router();

// Get job sign-offs
router.get('/job/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await pool.query(
      'SELECT * FROM job_sign_offs WHERE job_id = $1 ORDER BY signed_at',
      [jobId]
    );

    res.json({
      signOffs: result.rows
    });
  } catch (error) {
    console.error('Get sign-offs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create technician sign-off
router.post('/technician', authenticateToken, [
  body('jobId').isUUID(),
  body('signerName').notEmpty().trim(),
  body('signerSurname').notEmpty().trim(),
  body('signatureData').notEmpty(),
  body('jobCompleted').isBoolean(),
  body('termsAccepted').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      jobId,
      signerName,
      signerSurname,
      signatureData,
      jobCompleted,
      termsAccepted
    } = req.body;

    // Check if job exists and is assigned to technician
    const jobResult = await pool.query(
      'SELECT assigned_technician_id FROM jobs WHERE id = $1',
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (req.user.role === 'installer' && jobResult.rows[0].assigned_technician_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to sign off this job' });
    }

    // Check if technician sign-off already exists
    const existingResult = await pool.query(
      'SELECT id FROM job_sign_offs WHERE job_id = $1 AND sign_off_type = $2',
      [jobId, 'technician']
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Technician sign-off already exists for this job' });
    }

    const result = await pool.query(`
      INSERT INTO job_sign_offs (
        job_id, sign_off_type, signer_name, signer_surname, 
        signature_data, job_completed, terms_accepted, signed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      jobId, 'technician', signerName, signerSurname,
      signatureData, jobCompleted, termsAccepted, req.user.id
    ]);

    const signOff = result.rows[0];

    // Update job status if completed
    if (jobCompleted) {
      await pool.query(
        'UPDATE jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['requires_approval', jobId]
      );
    }

    await createAuditLog(req, jobId, 'TECHNICIAN_SIGN_OFF', `Technician sign-off completed`, null, signOff);

    res.status(201).json({
      message: 'Technician sign-off completed successfully',
      signOff
    });
  } catch (error) {
    console.error('Technician sign-off error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create manager sign-off
router.post('/manager', authenticateToken, requireManager, [
  body('jobId').isUUID(),
  body('signerName').notEmpty().trim(),
  body('signerSurname').notEmpty().trim(),
  body('signatureData').notEmpty(),
  body('signOffType').isIn(['construction_manager', 'project_manager'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      jobId,
      signerName,
      signerSurname,
      signatureData,
      signOffType
    } = req.body;

    // Check if job exists
    const jobResult = await pool.query('SELECT id FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if this type of sign-off already exists
    const existingResult = await pool.query(
      'SELECT id FROM job_sign_offs WHERE job_id = $1 AND sign_off_type = $2',
      [jobId, signOffType]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: `${signOffType} sign-off already exists for this job` });
    }

    const result = await pool.query(`
      INSERT INTO job_sign_offs (
        job_id, sign_off_type, signer_name, signer_surname, 
        signature_data, signed_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      jobId, signOffType, signerName, signerSurname,
      signatureData, req.user.id
    ]);

    const signOff = result.rows[0];

    // Check if all required sign-offs are complete
    const allSignOffsResult = await pool.query(
      'SELECT sign_off_type FROM job_sign_offs WHERE job_id = $1',
      [jobId]
    );

    const completedSignOffs = allSignOffsResult.rows.map(row => row.sign_off_type);
    const requiredSignOffs = ['technician', 'construction_manager', 'project_manager'];

    const allRequiredCompleted = requiredSignOffs.every(type => completedSignOffs.includes(type));

    if (allRequiredCompleted) {
      await pool.query(
        'UPDATE jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['approved', jobId]
      );
    }

    await createAuditLog(req, jobId, 'MANAGER_SIGN_OFF', `${signOffType} sign-off completed`, null, signOff);

    res.status(201).json({
      message: 'Manager sign-off completed successfully',
      signOff
    });
  } catch (error) {
    console.error('Manager sign-off error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve job (manager only)
router.post('/approve/:jobId', authenticateToken, requireManager, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if job exists
    const jobResult = await pool.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobResult.rows[0];

    if (job.status !== 'requires_approval') {
      return res.status(400).json({ error: 'Job is not in a state that requires approval' });
    }

    // Update job status
    await pool.query(
      'UPDATE jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['approved', jobId]
    );

    await createAuditLog(req, jobId, 'JOB_APPROVED', `Job approved: ${job.job_card_number}`, job, { status: 'approved' });

    res.json({
      message: 'Job approved successfully'
    });
  } catch (error) {
    console.error('Approve job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject job (manager only)
router.post('/reject/:jobId', authenticateToken, requireManager, [
  body('reason').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobId } = req.params;
    const { reason } = req.body;

    // Check if job exists
    const jobResult = await pool.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobResult.rows[0];

    if (job.status !== 'requires_approval') {
      return res.status(400).json({ error: 'Job is not in a state that can be rejected' });
    }

    // Update job status
    await pool.query(
      'UPDATE jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['in_progress', jobId]
    );

    await createAuditLog(req, jobId, 'JOB_REJECTED', `Job rejected: ${job.job_card_number}. Reason: ${reason}`, job, { status: 'in_progress', rejectionReason: reason });

    res.json({
      message: 'Job rejected successfully'
    });
  } catch (error) {
    console.error('Reject job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;