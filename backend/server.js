const express = require('express');
const cors = require('cors');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Serve static files from frontend public folder
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Test database connection on startup
const testDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully!');
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// ==================== EXPORT ROUTES ====================

// Test Excel export with logo
app.get('/api/export/test', async (req, res) => {
  try {
    console.log('🧪 Testing Excel export with logo...');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test');
    
    // Try to add logo
    try {
      const logoPath = path.join(__dirname, '../frontend/public/images/Limkokwing_Lesotho_Logo.png');
      
      if (fs.existsSync(logoPath)) {
        const logo = workbook.addImage({
          filename: logoPath,
          extension: 'png',
        });
        
        // Add logo to top left
        worksheet.addImage(logo, {
          tl: { col: 0, row: 0 },
          br: { col: 2, row: 4 }
        });
        
        // Move data rows down to make space for logo
        worksheet.addRow([]);
        worksheet.addRow([]);
        worksheet.addRow([]);
        worksheet.addRow([]);
        worksheet.addRow([]);
        
        console.log('✅ Logo added successfully');
      } else {
        console.log('⚠️ Logo not found at:', logoPath);
      }
    } catch (logoError) {
      console.log('⚠️ Could not add logo:', logoError.message);
    }
    
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Value', key: 'value', width: 15 }
    ];
    
    worksheet.addRows([
      { id: 1, name: 'Test 1', value: 'Success' },
      { id: 2, name: 'Test 2', value: 'Working' }
    ]);
    
    // Style headers (starting from row 6 to account for logo)
    const headerRow = worksheet.getRow(6);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="LUCT_Test_Export.xlsx"');
    
    await workbook.xlsx.write(res);
    console.log('✅ Test export with logo successful');
    res.end();
    
  } catch (error) {
    console.error('❌ Test export failed:', error);
    res.status(500).json({ 
      error: 'Test export failed', 
      details: error.message 
    });
  }
});

// Export all courses to Excel with logo
app.get('/api/export/courses', async (req, res) => {
  try {
    console.log('📊 Exporting courses to Excel...');
    
    let result;
    try {
      result = await pool.query(`
        SELECT 
          id,
          code as "course_code",
          name as "course_name", 
          faculty,
          department,
          credits,
          description,
          status,
          created_at
        FROM courses 
        ORDER BY code
      `);
      console.log(`✅ Found ${result.rows.length} courses to export`);
    } catch (dbError) {
      console.error('❌ Database error in courses export:', dbError);
      return res.status(500).json({ 
        error: 'Database error', 
        details: dbError.message
      });
    }

    if (!result.rows || result.rows.length === 0) {
      console.log('⚠️ No courses found to export');
      return res.status(404).json({ error: 'No courses found to export' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Courses');

    // Add logo
    try {
      const logoPath = path.join(__dirname, '../frontend/public/images/Limkokwing_Lesotho_Logo.png');
      
      if (fs.existsSync(logoPath)) {
        const logo = workbook.addImage({
          filename: logoPath,
          extension: 'png',
        });
        
        // Add logo to top left
        worksheet.addImage(logo, {
          tl: { col: 0, row: 0 },
          br: { col: 2, row: 4 }
        });
        
        console.log('✅ Logo added to courses export');
      } else {
        console.log('⚠️ Logo not found at:', logoPath);
      }
    } catch (logoError) {
      console.log('⚠️ Could not add logo to courses:', logoError.message);
    }

    // Add title
    worksheet.mergeCells('A6:I6');
    const titleRow = worksheet.getCell('A6');
    titleRow.value = 'LIMKOKWING UNIVERSITY OF CREATIVE TECHNOLOGY - COURSES';
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: 'center' };

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Course Code', key: 'course_code', width: 15 },
      { header: 'Course Name', key: 'course_name', width: 30 },
      { header: 'Faculty', key: 'faculty', width: 25 },
      { header: 'Department', key: 'department', width: 25 },
      { header: 'Credits', key: 'credits', width: 10 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created Date', key: 'created_at', width: 15 }
    ];

    // Start data from row 8 to account for logo and title
    worksheet.getRow(8).font = { bold: true };
    worksheet.getRow(8).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    try {
      // Add rows starting from row 9
      result.rows.forEach((row, index) => {
        worksheet.addRow(row);
      });
      console.log(`✅ Added ${result.rows.length} courses to Excel`);
    } catch (excelError) {
      console.error('❌ Excel data error:', excelError);
      return res.status(500).json({ 
        error: 'Excel data error', 
        details: excelError.message 
      });
    }

    if (worksheet.getColumn('created_at')) {
      worksheet.getColumn('created_at').numFmt = 'yyyy-mm-dd hh:mm:ss';
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="LUCT_Courses_Export.xlsx"');

    try {
      await workbook.xlsx.write(res);
      console.log('✅ Courses exported successfully');
      res.end();
    } catch (writeError) {
      console.error('❌ Excel write error:', writeError);
      res.status(500).json({ 
        error: 'Failed to generate Excel file', 
        details: writeError.message 
      });
    }

  } catch (error) {
    console.error('❌ General error exporting courses:', error);
    res.status(500).json({ 
      error: 'Failed to export courses', 
      details: error.message
    });
  }
});

// Export all users to Excel with logo
app.get('/api/export/users', async (req, res) => {
  try {
    console.log('📊 Exporting users to Excel...');
    
    let result;
    try {
      result = await pool.query(`
        SELECT 
          id,
          first_name,
          last_name,
          email,
          role,
          faculty,
          department,
          created_at
        FROM users 
        ORDER BY role, first_name
      `);
      console.log(`✅ Found ${result.rows.length} users to export`);
    } catch (dbError) {
      console.error('❌ Database error in users export:', dbError);
      return res.status(500).json({ 
        error: 'Database error', 
        details: dbError.message
      });
    }

    if (!result.rows || result.rows.length === 0) {
      console.log('⚠️ No users found to export');
      return res.status(404).json({ error: 'No users found to export' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    // Add logo
    try {
      const logoPath = path.join(__dirname, '../frontend/public/images/Limkokwing_Lesotho_Logo.png');
      
      if (fs.existsSync(logoPath)) {
        const logo = workbook.addImage({
          filename: logoPath,
          extension: 'png',
        });
        
        // Add logo to top left
        worksheet.addImage(logo, {
          tl: { col: 0, row: 0 },
          br: { col: 2, row: 4 }
        });
        
        console.log('✅ Logo added to users export');
      } else {
        console.log('⚠️ Logo not found at:', logoPath);
      }
    } catch (logoError) {
      console.log('⚠️ Could not add logo to users:', logoError.message);
    }

    // Add title
    worksheet.mergeCells('A6:H6');
    const titleRow = worksheet.getCell('A6');
    titleRow.value = 'LIMKOKWING UNIVERSITY OF CREATIVE TECHNOLOGY - USERS';
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: 'center' };

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'First Name', key: 'first_name', width: 15 },
      { header: 'Last Name', key: 'last_name', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Role', key: 'role', width: 20 },
      { header: 'Faculty', key: 'faculty', width: 25 },
      { header: 'Department', key: 'department', width: 25 },
      { header: 'Created Date', key: 'created_at', width: 15 }
    ];

    // Start data from row 8
    worksheet.getRow(8).font = { bold: true };
    worksheet.getRow(8).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    try {
      result.rows.forEach((row, index) => {
        worksheet.addRow(row);
      });
      console.log(`✅ Added ${result.rows.length} users to Excel`);
    } catch (excelError) {
      console.error('❌ Excel data error:', excelError);
      return res.status(500).json({ 
        error: 'Excel data error', 
        details: excelError.message 
      });
    }

    if (worksheet.getColumn('created_at')) {
      worksheet.getColumn('created_at').numFmt = 'yyyy-mm-dd hh:mm:ss';
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="LUCT_Users_Export.xlsx"');

    try {
      await workbook.xlsx.write(res);
      console.log('✅ Users exported successfully');
      res.end();
    } catch (writeError) {
      console.error('❌ Excel write error:', writeError);
      res.status(500).json({ 
        error: 'Failed to generate Excel file', 
        details: writeError.message 
      });
    }

  } catch (error) {
    console.error('❌ Error exporting users:', error);
    res.status(500).json({ 
      error: 'Failed to export users', 
      details: error.message 
    });
  }
});

// Export all classes to Excel with logo
app.get('/api/export/classes', async (req, res) => {
  try {
    console.log('📊 Exporting classes to Excel...');
    
    let result;
    try {
      result = await pool.query(`
        SELECT 
          c.id,
          c.name as class_name,
          co.code as course_code,
          co.name as course_name,
          CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
          c.schedule_day,
          c.schedule_time,
          c.venue,
          c.academic_year,
          c.semester,
          CONCAT(ab.first_name, ' ', ab.last_name) as assigned_by_name,
          c.created_at
        FROM classes c
        LEFT JOIN courses co ON c.course_id = co.id
        LEFT JOIN users u ON c.lecturer_id = u.id
        LEFT JOIN users ab ON c.assigned_by = ab.id
        ORDER BY c.name
      `);
      console.log(`✅ Found ${result.rows.length} classes to export`);
    } catch (dbError) {
      console.error('❌ Database error in classes export:', dbError);
      return res.status(500).json({ 
        error: 'Database error', 
        details: dbError.message
      });
    }

    if (!result.rows || result.rows.length === 0) {
      console.log('⚠️ No classes found to export');
      return res.status(404).json({ error: 'No classes found to export' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Classes');

    // Add logo
    try {
      const logoPath = path.join(__dirname, '../frontend/public/images/Limkokwing_Lesotho_Logo.png');
      
      if (fs.existsSync(logoPath)) {
        const logo = workbook.addImage({
          filename: logoPath,
          extension: 'png',
        });
        
        // Add logo to top left
        worksheet.addImage(logo, {
          tl: { col: 0, row: 0 },
          br: { col: 2, row: 4 }
        });
        
        console.log('✅ Logo added to classes export');
      } else {
        console.log('⚠️ Logo not found at:', logoPath);
      }
    } catch (logoError) {
      console.log('⚠️ Could not add logo to classes:', logoError.message);
    }

    // Add title
    worksheet.mergeCells('A6:L6');
    const titleRow = worksheet.getCell('A6');
    titleRow.value = 'LIMKOKWING UNIVERSITY OF CREATIVE TECHNOLOGY - CLASSES';
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: 'center' };

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Class Name', key: 'class_name', width: 20 },
      { header: 'Course Code', key: 'course_code', width: 15 },
      { header: 'Course Name', key: 'course_name', width: 25 },
      { header: 'Lecturer', key: 'lecturer_name', width: 25 },
      { header: 'Schedule Day', key: 'schedule_day', width: 15 },
      { header: 'Schedule Time', key: 'schedule_time', width: 15 },
      { header: 'Venue', key: 'venue', width: 15 },
      { header: 'Academic Year', key: 'academic_year', width: 15 },
      { header: 'Semester', key: 'semester', width: 15 },
      { header: 'Assigned By', key: 'assigned_by_name', width: 20 },
      { header: 'Created Date', key: 'created_at', width: 15 }
    ];

    // Start data from row 8
    worksheet.getRow(8).font = { bold: true };
    worksheet.getRow(8).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    try {
      result.rows.forEach((row, index) => {
        worksheet.addRow(row);
      });
      console.log(`✅ Added ${result.rows.length} classes to Excel`);
    } catch (excelError) {
      console.error('❌ Excel data error:', excelError);
      return res.status(500).json({ 
        error: 'Excel data error', 
        details: excelError.message 
      });
    }

    if (worksheet.getColumn('created_at')) {
      worksheet.getColumn('created_at').numFmt = 'yyyy-mm-dd hh:mm:ss';
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="LUCT_Classes_Export.xlsx"');

    try {
      await workbook.xlsx.write(res);
      console.log('✅ Classes exported successfully');
      res.end();
    } catch (writeError) {
      console.error('❌ Excel write error:', writeError);
      res.status(500).json({ 
        error: 'Failed to generate Excel file', 
        details: writeError.message 
      });
    }

  } catch (error) {
    console.error('❌ Error exporting classes:', error);
    res.status(500).json({ 
      error: 'Failed to export classes', 
      details: error.message 
    });
  }
});

// Export all reports to Excel with logo - UPDATED WITH principal_lecturer_id
app.get('/api/export/reports', async (req, res) => {
  try {
    console.log('📊 Exporting reports to Excel...');
    
    let result;
    try {
      result = await pool.query(`
        SELECT 
          r.id,
          r.date_of_lecture,
          r.week_of_reporting,
          r.topic_taught,
          r.teaching_methods,
          r.actual_students_present,
          r.challenges_encountered,
          r.status,
          r.created_at,
          r.updated_at,
          r.feedback_id,
          r.principal_lecturer_id,
          CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
          CONCAT(pl.first_name, ' ', pl.last_name) as principal_lecturer_name,
          c.name as class_name,
          co.name as course_name
        FROM reports r
        LEFT JOIN users u ON r.lecturer_id = u.id
        LEFT JOIN users pl ON r.principal_lecturer_id = pl.id
        LEFT JOIN classes c ON r.class_id = c.id
        LEFT JOIN courses co ON r.course_id = co.id
        ORDER BY r.created_at DESC
      `);
      console.log(`✅ Found ${result.rows.length} reports to export`);
    } catch (dbError) {
      console.error('❌ Database error in reports export:', dbError);
      return res.status(500).json({ 
        error: 'Database error', 
        details: dbError.message
      });
    }

    if (!result.rows || result.rows.length === 0) {
      console.log('⚠️ No reports found to export');
      return res.status(404).json({ error: 'No reports found to export' });
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lecture Reports');

    // Add logo
    try {
      const logoPath = path.join(__dirname, '../frontend/public/images/Limkokwing_Lesotho_Logo.png');
      
      if (fs.existsSync(logoPath)) {
        const logo = workbook.addImage({
          filename: logoPath,
          extension: 'png',
        });
        
        // Add logo to top left
        worksheet.addImage(logo, {
          tl: { col: 0, row: 0 },
          br: { col: 2, row: 4 }
        });
        
        console.log('✅ Logo added to reports export');
      } else {
        console.log('⚠️ Logo not found at:', logoPath);
      }
    } catch (logoError) {
      console.log('⚠️ Could not add logo to reports:', logoError.message);
    }

    // Add title
    worksheet.mergeCells('A6:P6');
    const titleRow = worksheet.getCell('A6');
    titleRow.value = 'LIMKOKWING UNIVERSITY OF CREATIVE TECHNOLOGY - LECTURE REPORTS';
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: 'center' };

    // Use only columns that exist in your actual table
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Lecturer', key: 'lecturer_name', width: 25 },
      { header: 'Principal Lecturer', key: 'principal_lecturer_name', width: 25 },
      { header: 'Class', key: 'class_name', width: 20 },
      { header: 'Course', key: 'course_name', width: 25 },
      { header: 'Date of Lecture', key: 'date_of_lecture', width: 15 },
      { header: 'Week', key: 'week_of_reporting', width: 10 },
      { header: 'Topic Taught', key: 'topic_taught', width: 30 },
      { header: 'Teaching Methods', key: 'teaching_methods', width: 25 },
      { header: 'Students Present', key: 'actual_students_present', width: 15 },
      { header: 'Challenges', key: 'challenges_encountered', width: 30 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Feedback ID', key: 'feedback_id', width: 12 },
      { header: 'Principal Lecturer ID', key: 'principal_lecturer_id', width: 15 },
      { header: 'Created At', key: 'created_at', width: 18 },
      { header: 'Updated At', key: 'updated_at', width: 18 }
    ];

    // Start data from row 8
    worksheet.getRow(8).font = { bold: true };
    worksheet.getRow(8).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    // Add data
    try {
      result.rows.forEach((row, index) => {
        worksheet.addRow(row);
      });
      console.log(`✅ Added ${result.rows.length} reports to Excel`);
    } catch (excelError) {
      console.error('❌ Excel data error:', excelError);
      return res.status(500).json({ 
        error: 'Excel data error', 
        details: excelError.message 
      });
    }

    // Format date columns
    ['date_of_lecture', 'created_at', 'updated_at'].forEach(col => {
      if (worksheet.getColumn(col)) {
        worksheet.getColumn(col).numFmt = 'yyyy-mm-dd';
      }
    });

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="LUCT_Reports_Export.xlsx"');

    // Write to response
    try {
      await workbook.xlsx.write(res);
      console.log('✅ Reports exported successfully');
      res.end();
    } catch (writeError) {
      console.error('❌ Excel write error:', writeError);
      res.status(500).json({ 
        error: 'Failed to generate Excel file', 
        details: writeError.message 
      });
    }

  } catch (error) {
    console.error('❌ General error exporting reports:', error);
    res.status(500).json({ 
      error: 'Failed to export reports', 
      details: error.message
    });
  }
});

// Export all student reports to Excel with logo
app.get('/api/export/student-reports', async (req, res) => {
  try {
    console.log('📊 Exporting student reports to Excel...');
    
    let result;
    try {
      result = await pool.query(`
        SELECT 
          sr.id,
          CONCAT(s.first_name, ' ', s.last_name) as student_name,
          CONCAT(l.first_name, ' ', l.last_name) as lecturer_name,
          c.name as course_name,
          sr.issue_type,
          sr.urgency_level,
          sr.description,
          sr.date_occurred,
          sr.principal_response,
          sr.action_taken,
          sr.status,
          CONCAT(pl.first_name, ' ', pl.last_name) as principal_name,
          sr.responded_at,
          sr.created_at
        FROM student_reports sr
        LEFT JOIN users s ON sr.student_id = s.id
        LEFT JOIN users l ON sr.lecturer_id = l.id
        LEFT JOIN users pl ON sr.principal_lecturer_id = pl.id
        LEFT JOIN courses c ON sr.course_id = c.id
        ORDER BY sr.created_at DESC
      `);
      console.log(`✅ Found ${result.rows.length} student reports to export`);
    } catch (dbError) {
      console.error('❌ Database error in student reports export:', dbError);
      return res.status(500).json({ 
        error: 'Database error', 
        details: dbError.message
      });
    }

    if (!result.rows || result.rows.length === 0) {
      console.log('⚠️ No student reports found to export');
      return res.status(404).json({ error: 'No student reports found to export' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Student Reports');

    // Add logo
    try {
      const logoPath = path.join(__dirname, '../frontend/public/images/Limkokwing_Lesotho_Logo.png');
      
      if (fs.existsSync(logoPath)) {
        const logo = workbook.addImage({
          filename: logoPath,
          extension: 'png',
        });
        
        // Add logo to top left
        worksheet.addImage(logo, {
          tl: { col: 0, row: 0 },
          br: { col: 2, row: 4 }
        });
        
        console.log('✅ Logo added to student reports export');
      } else {
        console.log('⚠️ Logo not found at:', logoPath);
      }
    } catch (logoError) {
      console.log('⚠️ Could not add logo to student reports:', logoError.message);
    }

    // Add title
    worksheet.mergeCells('A6:N6');
    const titleRow = worksheet.getCell('A6');
    titleRow.value = 'LIMKOKWING UNIVERSITY OF CREATIVE TECHNOLOGY - STUDENT REPORTS';
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: 'center' };

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Student', key: 'student_name', width: 25 },
      { header: 'Lecturer', key: 'lecturer_name', width: 25 },
      { header: 'Course', key: 'course_name', width: 25 },
      { header: 'Issue Type', key: 'issue_type', width: 20 },
      { header: 'Urgency Level', key: 'urgency_level', width: 15 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Date Occurred', key: 'date_occurred', width: 15 },
      { header: 'Principal Response', key: 'principal_response', width: 30 },
      { header: 'Action Taken', key: 'action_taken', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Principal', key: 'principal_name', width: 25 },
      { header: 'Responded At', key: 'responded_at', width: 15 },
      { header: 'Created Date', key: 'created_at', width: 15 }
    ];

    // Start data from row 8
    worksheet.getRow(8).font = { bold: true };
    worksheet.getRow(8).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    try {
      result.rows.forEach((row, index) => {
        worksheet.addRow(row);
      });
      console.log(`✅ Added ${result.rows.length} student reports to Excel`);
    } catch (excelError) {
      console.error('❌ Excel data error:', excelError);
      return res.status(500).json({ 
        error: 'Excel data error', 
        details: excelError.message 
      });
    }

    // Format date columns
    ['date_occurred', 'responded_at', 'created_at'].forEach(col => {
      if (worksheet.getColumn(col)) {
        worksheet.getColumn(col).numFmt = 'yyyy-mm-dd';
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="LUCT_Student_Reports_Export.xlsx"');

    try {
      await workbook.xlsx.write(res);
      console.log('✅ Student reports exported successfully');
      res.end();
    } catch (writeError) {
      console.error('❌ Excel write error:', writeError);
      res.status(500).json({ 
        error: 'Failed to generate Excel file', 
        details: writeError.message 
      });
    }

  } catch (error) {
    console.error('❌ Error exporting student reports:', error);
    res.status(500).json({ 
      error: 'Failed to export student reports', 
      details: error.message 
    });
  }
});

// Export everything to a single Excel file with multiple sheets and logos
app.get('/api/export/all', async (req, res) => {
  try {
    console.log('📊 Exporting all data to Excel...');
    
    const workbook = new ExcelJS.Workbook();

    // Function to add logo and title to a worksheet
    const addLogoAndTitle = (worksheet, title) => {
      try {
        const logoPath = path.join(__dirname, '../frontend/public/images/Limkokwing_Lesotho_Logo.png');
        
        if (fs.existsSync(logoPath)) {
          const logo = workbook.addImage({
            filename: logoPath,
            extension: 'png',
          });
          
          worksheet.addImage(logo, {
            tl: { col: 0, row: 0 },
            br: { col: 2, row: 4 }
          });
        }
      } catch (logoError) {
        console.log('⚠️ Could not add logo:', logoError.message);
      }

      // Add title based on sheet name
      const mergeRange = title === 'Courses' ? 'A6:I6' : 
                        title === 'Users' ? 'A6:H6' :
                        title === 'Classes' ? 'A6:K6' :
                        title === 'Lecture Reports' ? 'A6:L6' : 'A6:M6';
      
      worksheet.mergeCells(mergeRange);
      const titleRow = worksheet.getCell('A6');
      titleRow.value = `LIMKOKWING UNIVERSITY OF CREATIVE TECHNOLOGY - ${title.toUpperCase()}`;
      titleRow.font = { bold: true, size: 16 };
      titleRow.alignment = { horizontal: 'center' };
    };

    // Export Courses
    try {
      const coursesResult = await pool.query(`
        SELECT id, code, name, faculty, department, credits, description, status, created_at 
        FROM courses ORDER BY code
      `);
      const coursesSheet = workbook.addWorksheet('Courses');
      addLogoAndTitle(coursesSheet, 'Courses');
      
      coursesSheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Course Code', key: 'code', width: 15 },
        { header: 'Course Name', key: 'name', width: 30 },
        { header: 'Faculty', key: 'faculty', width: 25 },
        { header: 'Department', key: 'department', width: 25 },
        { header: 'Credits', key: 'credits', width: 10 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Created Date', key: 'created_at', width: 15 }
      ];
      
      // Start data from row 8
      coursesSheet.getRow(8).font = { bold: true };
      coursesSheet.getRow(8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
      
      coursesResult.rows.forEach(row => coursesSheet.addRow(row));
      console.log(`✅ Added ${coursesResult.rows.length} courses to all export`);
    } catch (error) {
      console.error('❌ Error exporting courses in all export:', error);
    }

    // Export Users
    try {
      const usersResult = await pool.query(`
        SELECT id, first_name, last_name, email, role, faculty, department, created_at 
        FROM users ORDER BY role, first_name
      `);
      const usersSheet = workbook.addWorksheet('Users');
      addLogoAndTitle(usersSheet, 'Users');
      
      usersSheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'First Name', key: 'first_name', width: 15 },
        { header: 'Last Name', key: 'last_name', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Role', key: 'role', width: 20 },
        { header: 'Faculty', key: 'faculty', width: 25 },
        { header: 'Department', key: 'department', width: 25 },
        { header: 'Created Date', key: 'created_at', width: 15 }
      ];
      
      usersSheet.getRow(8).font = { bold: true };
      usersSheet.getRow(8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
      
      usersResult.rows.forEach(row => usersSheet.addRow(row));
      console.log(`✅ Added ${usersResult.rows.length} users to all export`);
    } catch (error) {
      console.error('❌ Error exporting users in all export:', error);
    }

    // Export Classes
    try {
      const classesResult = await pool.query(`
        SELECT 
          c.id,
          c.name as class_name,
          co.code as course_code,
          co.name as course_name,
          CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
          c.schedule_day,
          c.schedule_time,
          c.venue,
          c.academic_year,
          c.semester,
          c.created_at
        FROM classes c
        LEFT JOIN courses co ON c.course_id = co.id
        LEFT JOIN users u ON c.lecturer_id = u.id
        ORDER BY c.name
      `);
      const classesSheet = workbook.addWorksheet('Classes');
      addLogoAndTitle(classesSheet, 'Classes');
      
      classesSheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Class Name', key: 'class_name', width: 20 },
        { header: 'Course Code', key: 'course_code', width: 15 },
        { header: 'Course Name', key: 'course_name', width: 25 },
        { header: 'Lecturer', key: 'lecturer_name', width: 25 },
        { header: 'Schedule Day', key: 'schedule_day', width: 15 },
        { header: 'Schedule Time', key: 'schedule_time', width: 15 },
        { header: 'Venue', key: 'venue', width: 15 },
        { header: 'Academic Year', key: 'academic_year', width: 15 },
        { header: 'Semester', key: 'semester', width: 15 },
        { header: 'Created Date', key: 'created_at', width: 15 }
      ];
      
      classesSheet.getRow(8).font = { bold: true };
      classesSheet.getRow(8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
      
      classesResult.rows.forEach(row => classesSheet.addRow(row));
      console.log(`✅ Added ${classesResult.rows.length} classes to all export`);
    } catch (error) {
      console.error('❌ Error exporting classes in all export:', error);
    }

    // Export Reports - UPDATED WITH principal_lecturer_id
    try {
      const reportsResult = await pool.query(`
        SELECT 
          r.id,
          CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
          CONCAT(pl.first_name, ' ', pl.last_name) as principal_lecturer_name,
          c.name as class_name,
          co.name as course_name,
          r.date_of_lecture,
          r.week_of_reporting,
          r.topic_taught,
          r.teaching_methods,
          r.actual_students_present,
          r.challenges_encountered,
          r.status,
          r.created_at
        FROM reports r
        LEFT JOIN users u ON r.lecturer_id = u.id
        LEFT JOIN users pl ON r.principal_lecturer_id = pl.id
        LEFT JOIN classes c ON r.class_id = c.id
        LEFT JOIN courses co ON r.course_id = co.id
        ORDER BY r.created_at DESC
      `);
      const reportsSheet = workbook.addWorksheet('Lecture Reports');
      addLogoAndTitle(reportsSheet, 'Lecture Reports');
      
      reportsSheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Lecturer', key: 'lecturer_name', width: 25 },
        { header: 'Principal Lecturer', key: 'principal_lecturer_name', width: 25 },
        { header: 'Class', key: 'class_name', width: 20 },
        { header: 'Course', key: 'course_name', width: 25 },
        { header: 'Date of Lecture', key: 'date_of_lecture', width: 15 },
        { header: 'Week', key: 'week_of_reporting', width: 10 },
        { header: 'Topic Taught', key: 'topic_taught', width: 30 },
        { header: 'Teaching Methods', key: 'teaching_methods', width: 25 },
        { header: 'Students Present', key: 'actual_students_present', width: 15 },
        { header: 'Challenges', key: 'challenges_encountered', width: 30 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Report Date', key: 'created_at', width: 15 }
      ];
      
      reportsSheet.getRow(8).font = { bold: true };
      reportsSheet.getRow(8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
      
      reportsResult.rows.forEach(row => reportsSheet.addRow(row));
      console.log(`✅ Added ${reportsResult.rows.length} reports to all export`);
    } catch (error) {
      console.error('❌ Error exporting reports in all export:', error);
    }

    // Format date columns in all sheets
    workbook.worksheets.forEach(worksheet => {
      if (worksheet.getColumn('created_at')) {
        worksheet.getColumn('created_at').numFmt = 'yyyy-mm-dd hh:mm:ss';
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="LUCT_Full_Export.xlsx"');

    await workbook.xlsx.write(res);
    console.log('✅ All data exported successfully');
    
    res.end();

  } catch (error) {
    console.error('❌ Error exporting all data:', error);
    res.status(500).json({ 
      error: 'Failed to export data', 
      details: error.message 
    });
  }
});

// [The rest of your existing routes remain the same...]
// Database check route, Principal Reports routes, Course Management routes, etc.
// ... (all your other existing routes continue here)

// Start server
const startServer = async () => {
  const isConnected = await testDatabaseConnection();
  
  if (isConnected) {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API: http://localhost:${PORT}`);
      console.log('✅ Server started successfully!');
      console.log('📊 Excel Export Routes Available:');
      console.log('   - /api/export/test');
      console.log('   - /api/export/courses');
      console.log('   - /api/export/users');
      console.log('   - /api/export/classes');
      console.log('   - /api/export/reports');
      console.log('   - /api/export/student-reports');
      console.log('   - /api/export/all');
    });
  } else {
    console.log('❌ Server cannot start due to database connection issues');
    process.exit(1);
  }
};

// Start the server
startServer();