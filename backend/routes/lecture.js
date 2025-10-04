const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Get all lectures for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const result = await query(`
      SELECT l.*, 
             u.first_name as lecturer_first_name, u.last_name as lecturer_last_name,
             c.name as course_name, c.code as course_code,
             cls.name as class_name
      FROM lectures l
      LEFT JOIN users u ON l.lecturer_id = u.id
      LEFT JOIN courses c ON l.course_id = c.id
      LEFT JOIN classes cls ON l.class_id = cls.id
      WHERE l.course_id = $1
      ORDER BY l.lecture_date DESC, l.start_time DESC
    `, [req.params.courseId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lectures for a lecturer
router.get('/lecturer/:lecturerId', async (req, res) => {
  try {
    const result = await query(`
      SELECT l.*, c.name as course_name, c.code as course_code, cls.name as class_name
      FROM lectures l
      LEFT JOIN courses c ON l.course_id = c.id
      LEFT JOIN classes cls ON l.class_id = cls.id
      WHERE l.lecturer_id = $1
      ORDER BY l.lecture_date DESC
    `, [req.params.lecturerId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new lecture
router.post('/', async (req, res) => {
  try {
    const { course_id, lecturer_id, class_id, lecture_title, lecture_date, start_time, end_time, venue, lecture_type } = req.body;
    
    const result = await query(`
      INSERT INTO lectures (course_id, lecturer_id, class_id, lecture_title, lecture_date, start_time, end_time, venue, lecture_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [course_id, lecturer_id, class_id, lecture_title, lecture_date, start_time, end_time, venue, lecture_type]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update lecture attendance
router.put('/:id/attendance', async (req, res) => {
  try {
    const { total_students_present, attendance_taken } = req.body;
    
    const result = await query(`
      UPDATE lectures 
      SET total_students_present = $1, attendance_taken = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 
      RETURNING *
    `, [total_students_present, attendance_taken, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming lectures
router.get('/upcoming/:lecturerId', async (req, res) => {
  try {
    const result = await query(`
      SELECT l.*, c.name as course_name, cls.name as class_name
      FROM lectures l
      LEFT JOIN courses c ON l.course_id = c.id
      LEFT JOIN classes cls ON l.class_id = cls.id
      WHERE l.lecturer_id = $1 AND l.lecture_date >= CURRENT_DATE
      ORDER BY l.lecture_date ASC, l.start_time ASC
      LIMIT 10
    `, [req.params.lecturerId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});