import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

const StudentReportForm = ({ currentUser, onBackToDashboard, onSubmitReport, lecturers }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    lecturer_name: '',
    course_name: '',
    issue_type: 'attendance',
    description: '',
    date_occurred: '',
    urgency_level: 'medium'
  });

  const [courses, setCourses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState(null);

  const issueTypes = [
    { value: 'attendance', label: 'Attendance Issue' },
    { value: 'teaching', label: 'Teaching Quality' },
    { value: 'behavior', label: 'Professional Behavior' },
    { value: 'resources', label: 'Learning Resources' },
    { value: 'grading', label: 'Grading Concerns' },
    { value: 'communication', label: 'Communication Issues' },
    { value: 'other', label: 'Other Issue' }
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  // Initialize form with user info + fetch courses
  useEffect(() => {
    if (currentUser) {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        student_id: currentUser.id?.toString() || '',
        date_occurred: today
      }));
      fetchAvailableCourses();
    }
  }, [currentUser]);

  const fetchAvailableCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      const coursesData = await response.json();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setIsError(false);

    // Validate required fields
    if (!formData.lecturer_name || !formData.course_name || !formData.issue_type || !formData.description) {
      setMessage('Please fill in all required fields (*)');
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const reportData = {
        student_id: parseInt(currentUser.id), // Ensure it's a number
        lecturer_name: formData.lecturer_name,
        course_name: formData.course_name,
        issue_type: formData.issue_type,
        description: formData.description,
        date_occurred: formData.date_occurred,
        urgency_level: formData.urgency_level
      };

      console.log('📤 Sending student report data:', reportData);

      // Make sure this is the correct endpoint
      const response = await fetch(`${API_BASE_URL}/student-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to submit report');
      }

      setMessage('✅ Report submitted successfully to Principal Lecturer! They will review and respond.');
      setIsError(false);

      // Reset form
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        student_id: currentUser.id?.toString() || '',
        lecturer_name: '',
        course_name: '',
        issue_type: 'attendance',
        description: '',
        date_occurred: today,
        urgency_level: 'medium'
      });
      setSelectedLecturer(null);

      if (onSubmitReport) onSubmitReport(result.report);

    } catch (error) {
      console.error('Report submission error:', error);
      setMessage(error.message || 'Error submitting report. Please try again.');
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'lecturer_name') {
      const lecturer = lecturers.find(
        l => `${l.first_name} ${l.last_name}` === value
      );
      setSelectedLecturer(lecturer || null);
    }
  };

  const handleClearForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      student_id: currentUser.id?.toString() || '',
      lecturer_name: '',
      course_name: '',
      issue_type: 'attendance',
      description: '',
      date_occurred: today,
      urgency_level: 'medium'
    });
    setSelectedLecturer(null);
    setMessage('');
    setIsError(false);
  };

  return (
    <div className="report-form-container">
      <div className="form-header">
        <button onClick={onBackToDashboard} className="back-btn">← Back to Dashboard</button>
        <h2>Report Lecturer to Principal</h2>
        <p>Your report will be confidential and only visible to Principal Lecturer</p>
      </div>

      {message && (
        <div className={`message ${isError ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-section">
          <h3>Your Information</h3>
          <div className="student-info">
            <p><strong>Name:</strong> {currentUser?.first_name} {currentUser?.last_name}</p>
            <p><strong>Student ID:</strong> {currentUser?.id}</p>
            <p><strong>Role:</strong> {currentUser?.role}</p>
          </div>
        </div>

        <div className="form-section">
          <h3>Report Details</h3>
          <div className="form-row">
            {/* Lecturer dropdown */}
            <div className="form-group">
              <label htmlFor="lecturer_name">Select Lecturer *</label>
              <select
                id="lecturer_name"
                name="lecturer_name"
                value={formData.lecturer_name}
                onChange={handleInputChange}
                required
              >
                <option value="">Choose a lecturer</option>
                {lecturers.map(lecturer => (
                  <option key={lecturer.id} value={`${lecturer.first_name} ${lecturer.last_name}`}>
                    {lecturer.first_name} {lecturer.last_name} - {lecturer.department}
                  </option>
                ))}
              </select>
              {selectedLecturer && (
                <div className="lecturer-details">
                  <p><strong>Department:</strong> {selectedLecturer.department}</p>
                  <p><strong>Email:</strong> {selectedLecturer.email}</p>
                </div>
              )}
            </div>

            {/* Course dropdown */}
            <div className="form-group">
              <label htmlFor="course_name">Related Course *</label>
              <select
                id="course_name"
                name="course_name"
                value={formData.course_name}
                onChange={handleInputChange}
                required
              >
                <option value="">Select course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.name}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Issue + Urgency + Date */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="issue_type">Issue Type *</label>
              <select
                id="issue_type"
                name="issue_type"
                value={formData.issue_type}
                onChange={handleInputChange}
                required
              >
                {issueTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="urgency_level">Urgency Level</label>
              <select
                id="urgency_level"
                name="urgency_level"
                value={formData.urgency_level}
                onChange={handleInputChange}
              >
                {urgencyLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date_occurred">Date of Incident *</label>
              <input
                type="date"
                id="date_occurred"
                name="date_occurred"
                value={formData.date_occurred}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Report Content</h3>
          <div className="form-group">
            <label htmlFor="description">Detailed Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Please describe the issue in detail..."
              required
              rows={6}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleClearForm} className="clear-btn" disabled={isSubmitting}>
            Clear Form
          </button>
          <button type="button" onClick={onBackToDashboard} className="cancel-btn" disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? 'Submitting...' : 'Submit Report to Principal Lecturer'}
          </button>
        </div>
      </form>

      <div className="form-footer">
        <div className="confidentiality-notice">
          <h4>Confidentiality Notice</h4>
          <p>
            All reports are treated with strict confidentiality. Your report will be reviewed by the 
            Principal Lecturer who will take appropriate action. Retaliation against students for 
            reporting concerns is strictly prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentReportForm;