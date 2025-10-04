const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Submit a rating
router.post('/', async (req, res) => {
  try {
    const { course_id, lecturer_id, student_id, rating_value, comment, rating_type, is_anonymous } = req.body;
    
    const result = await query(`
      INSERT INTO ratings (course_id, lecturer_id, student_id, rating_value, comment, rating_type, is_anonymous)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [course_id, lecturer_id, student_id, rating_value, comment, rating_type, is_anonymous]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ratings for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*, 
             u.first_name as student_first_name, u.last_name as student_last_name,
             c.name as course_name
      FROM ratings r
      LEFT JOIN users u ON r.student_id = u.id
      LEFT JOIN courses c ON r.course_id = c.id
      WHERE r.course_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.courseId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ratings for a lecturer
router.get('/lecturer/:lecturerId', async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*, 
             u.first_name as student_first_name, u.last_name as student_last_name,
             c.name as course_name, c.code as course_code
      FROM ratings r
      LEFT JOIN users u ON r.student_id = u.id
      LEFT JOIN courses c ON r.course_id = c.id
      WHERE r.lecturer_id = $1 AND r.rating_type = 'lecturer'
      ORDER BY r.created_at DESC
    `, [req.params.lecturerId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get average rating for a course
router.get('/course/:courseId/average', async (req, res) => {
  try {
    const result = await query(`
      SELECT AVG(rating_value) as average_rating, COUNT(*) as total_ratings
      FROM ratings 
      WHERE course_id = $1 AND rating_type = 'course'
    `, [req.params.courseId]);
    
    res.json({
      average_rating: parseFloat(result.rows[0].average_rating || 0),
      total_ratings: parseInt(result.rows[0].total_ratings || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get average rating for a lecturer
router.get('/lecturer/:lecturerId/average', async (req, res) => {
  try {
    const result = await query(`
      SELECT AVG(rating_value) as average_rating, COUNT(*) as total_ratings
      FROM ratings 
      WHERE lecturer_id = $1 AND rating_type = 'lecturer'
    `, [req.params.lecturerId]);
    
    res.json({
      average_rating: parseFloat(result.rows[0].average_rating || 0),
      total_ratings: parseInt(result.rows[0].total_ratings || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});