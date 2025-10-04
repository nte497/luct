const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Get all student reports (for principal lecturer)
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT sr.*, 
             s.first_name as student_first_name, s.last_name as student_last_name,
             l.first_name as lecturer_first_name, l.last_name as lecturer_last_name,
             c.name as course_name, c.code as course_code
      FROM student_reports sr
      LEFT JOIN users s ON sr.student_id = s.id
      LEFT JOIN users l ON sr.lecturer_id = l.id
      LEFT JOIN courses c ON sr.course_id = c.id
      ORDER BY sr.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new student report
router.post('/', async (req, res) => {
  try {
    const { student_id, lecturer_id, course_id, report_type, week_of_reporting, date_of_incident, message, is_anonymous } = req.body;
    
    const result = await query(`
      INSERT INTO student_reports (student_id, lecturer_id, course_id, report_type, week_of_reporting, date_of_incident, message, is_anonymous)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [student_id, lecturer_id, course_id, report_type, week_of_reporting, date_of_incident, message, is_anonymous]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update report status (principal action)
router.put('/:id', async (req, res) => {
  try {
    const { status, principal_feedback, action_taken } = req.body;
    
    const result = await query(`
      UPDATE student_reports 
      SET status = $1, principal_feedback = $2, action_taken = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 
      RETURNING *
    `, [status, principal_feedback, action_taken, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student report not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});