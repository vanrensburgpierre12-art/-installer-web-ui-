const pool = require('../config/database');

const createAuditLog = async (req, jobId, action, description, oldValues = null, newValues = null) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (job_id, user_id, action, description, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        jobId,
        req.user?.id || null,
        action,
        description,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent')
      ]
    );
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

const auditMiddleware = (action, description) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const jobId = req.params.jobId || req.body.jobId || null;
        createAuditLog(req, jobId, action, description, null, req.body);
      }
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  createAuditLog,
  auditMiddleware
};