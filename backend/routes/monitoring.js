const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Get all monitoring data for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const result = await query(`
      SELECT m.*, c.name as course_name, c.code as course_code,
             u.first_name as lecturer_first_name, u.last_name as lecturer_last_name
      FROM monitoring m
      LEFT JOIN courses c ON m.course_id = c.id
      LEFT JOIN users u ON m.lecturer_id = u.id
      WHERE m.student_id = $1
      ORDER BY m.monitoring_date DESC
    `, [req.params.studentId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monitoring data for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const result = await query(`
      SELECT m.*, u.first_name as student_first_name, u.last_name as student_last_name
      FROM monitoring m
      LEFT JOIN users u ON m.student_id = u.id
      WHERE m.course_id = $1
      ORDER BY m.monitoring_date DESC
    `, [req.params.courseId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new monitoring record
router.post('/', async (req, res) => {
  try {
    const { student_id, course_id, lecturer_id, attendance_percentage, performance_rating, notes } = req.body;
    
    const result = await query(`
      INSERT INTO monitoring (student_id, course_id, lecturer_id, attendance_percentage, performance_rating, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [student_id, course_id, lecturer_id, attendance_percentage, performance_rating, notes]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update monitoring record
router.put('/:id', async (req, res) => {
  try {
    const { attendance_percentage, performance_rating, overall_grade, notes } = req.body;
    
    const result = await query(`
      UPDATE monitoring 
      SET attendance_percentage = $1, performance_rating = $2, overall_grade = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 
      RETURNING *
    `, [attendance_percentage, performance_rating, overall_grade, notes, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Monitoring record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monitoring statistics
router.get('/stats/student/:studentId', async (req, res) => {
  try {
    const avgAttendance = await query(`
      SELECT AVG(attendance_percentage) as avg_attendance 
      FROM monitoring 
      WHERE student_id = $1
    `, [req.params.studentId]);
    
    const performanceStats = await query(`
      SELECT performance_rating, COUNT(*) as count 
      FROM monitoring 
      WHERE student_id = $1 
      GROUP BY performance_rating
    `, [req.params.studentId]);
    
    res.json({
      avg_attendance: parseFloat(avgAttendance.rows[0].avg_attendance || 0),
      performance_stats: performanceStats.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});