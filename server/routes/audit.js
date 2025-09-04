const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get audit logs for a specific job
router.get('/job/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Check if user has access to this job
    if (req.user.role === 'installer') {
      const jobCheck = await pool.query(
        'SELECT assigned_technician_id FROM jobs WHERE id = $1',
        [jobId]
      );
      if (jobCheck.rows.length === 0 || jobCheck.rows[0].assigned_technician_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to view audit logs for this job' });
      }
    }

    const result = await pool.query(`
      SELECT 
        al.*,
        u.username,
        u.first_name,
        u.last_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.job_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2 OFFSET $3
    `, [jobId, limit, offset]);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM audit_logs WHERE job_id = $1',
      [jobId]
    );
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      auditLogs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all audit logs (admin/manager only)
router.get('/', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      userId, 
      startDate, 
      endDate 
    } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        al.*,
        u.username,
        u.first_name,
        u.last_name,
        j.job_card_number
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN jobs j ON al.job_id = j.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (action) {
      query += ` AND al.action = $${++paramCount}`;
      queryParams.push(action);
    }

    if (userId) {
      query += ` AND al.user_id = $${++paramCount}`;
      queryParams.push(userId);
    }

    if (startDate) {
      query += ` AND al.created_at >= $${++paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ` AND al.created_at <= $${++paramCount}`;
      queryParams.push(endDate);
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM audit_logs al WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (action) {
      countQuery += ` AND al.action = $${++countParamCount}`;
      countParams.push(action);
    }

    if (userId) {
      countQuery += ` AND al.user_id = $${++countParamCount}`;
      countParams.push(userId);
    }

    if (startDate) {
      countQuery += ` AND al.created_at >= $${++countParamCount}`;
      countParams.push(startDate);
    }

    if (endDate) {
      countQuery += ` AND al.created_at <= $${++countParamCount}`;
      countParams.push(endDate);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      auditLogs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get all audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit log statistics
router.get('/stats', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const queryParams = [];
    let paramCount = 0;

    if (startDate && endDate) {
      dateFilter = `WHERE al.created_at >= $${++paramCount} AND al.created_at <= $${++paramCount}`;
      queryParams.push(startDate, endDate);
    }

    // Get action counts
    const actionStatsResult = await pool.query(`
      SELECT 
        al.action,
        COUNT(*) as count
      FROM audit_logs al
      ${dateFilter}
      GROUP BY al.action
      ORDER BY count DESC
    `, queryParams);

    // Get user activity
    const userStatsResult = await pool.query(`
      SELECT 
        u.username,
        u.first_name,
        u.last_name,
        COUNT(al.id) as activity_count
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${dateFilter}
      GROUP BY u.id, u.username, u.first_name, u.last_name
      ORDER BY activity_count DESC
      LIMIT 10
    `, queryParams);

    // Get daily activity
    const dailyStatsResult = await pool.query(`
      SELECT 
        DATE(al.created_at) as date,
        COUNT(*) as count
      FROM audit_logs al
      ${dateFilter}
      GROUP BY DATE(al.created_at)
      ORDER BY date DESC
      LIMIT 30
    `, queryParams);

    res.json({
      actionStats: actionStatsResult.rows,
      userStats: userStatsResult.rows,
      dailyStats: dailyStatsResult.rows
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;