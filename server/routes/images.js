const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/audit');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Upload job images
router.post('/job/:jobId', authenticateToken, upload.array('images', 4), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { imageType } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    // Validate job exists
    const jobResult = await pool.query('SELECT id FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check permissions
    if (req.user.role === 'installer') {
      const jobCheck = await pool.query(
        'SELECT assigned_technician_id FROM jobs WHERE id = $1',
        [jobId]
      );
      if (jobCheck.rows[0].assigned_technician_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to upload images for this job' });
      }
    }

    const uploadedImages = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      // Determine image type based on position or explicit type
      let finalImageType = imageType;
      if (!finalImageType) {
        const imageTypes = ['device_serial', 'tablet_serial', 'connection_1', 'connection_2', 'connection_3'];
        finalImageType = imageTypes[i] || `connection_${i + 1}`;
      }

      const result = await pool.query(`
        INSERT INTO job_images (job_id, image_type, file_path, file_name, file_size, mime_type, uploaded_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        jobId,
        finalImageType,
        file.path,
        file.originalname,
        file.size,
        file.mimetype,
        req.user.id
      ]);

      uploadedImages.push(result.rows[0]);
    }

    await createAuditLog(req, jobId, 'IMAGES_UPLOADED', `Images uploaded: ${req.files.length} files`, null, { count: req.files.length });

    res.status(201).json({
      message: 'Images uploaded successfully',
      images: uploadedImages
    });
  } catch (error) {
    console.error('Upload images error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job images
router.get('/job/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await pool.query(
      'SELECT * FROM job_images WHERE job_id = $1 ORDER BY uploaded_at',
      [jobId]
    );

    res.json({
      images: result.rows
    });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete image
router.delete('/:imageId', authenticateToken, async (req, res) => {
  try {
    const { imageId } = req.params;

    // Get image details
    const imageResult = await pool.query(
      'SELECT * FROM job_images WHERE id = $1',
      [imageId]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const image = imageResult.rows[0];

    // Check permissions
    if (req.user.role === 'installer') {
      const jobCheck = await pool.query(
        'SELECT assigned_technician_id FROM jobs WHERE id = $1',
        [image.job_id]
      );
      if (jobCheck.rows[0].assigned_technician_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this image' });
      }
    }

    // Delete file from filesystem
    if (fs.existsSync(image.file_path)) {
      fs.unlinkSync(image.file_path);
    }

    // Delete from database
    await pool.query('DELETE FROM job_images WHERE id = $1', [imageId]);

    await createAuditLog(req, image.job_id, 'IMAGE_DELETED', `Image deleted: ${image.file_name}`, image, null);

    res.json({
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve images
router.get('/serve/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Serve image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;