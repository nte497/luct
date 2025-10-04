import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

const LecturerReportingForm = ({ currentUser, onBackToDashboard, onSubmitReport, fetchLecturerClasses }) => {
  const [formData, setFormData] = useState({
    class_id: '',
    lecturer_id: '',
    week_of_reporting: '',
    date_of_lecture: '',
    actual_students_present: '',
    topic_taught: '',
    learning_outcomes: '',
    recommendations: '',
    teaching_methods: '',
    challenges_encountered: ''
  });

  const [classes, setClasses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch classes when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (currentUser?.id) {
        try {
          setIsLoading(true);
          console.log(`🔄 Fetching classes for lecturer ID: ${currentUser.id}`);
          
          // Use the passed fetch function from App.js
          const userClasses = await fetchLecturerClasses(currentUser.id);
          setClasses(userClasses);
          
          console.log(`✅ Loaded ${userClasses.length} classes for lecturer`);
          
        } catch (error) {
          console.error('❌ Error fetching classes:', error);
          setMessage(`Error loading classes: ${error.message}`);
          setIsError(true);
        } finally {
          setIsLoading(false);
        }

        // Prefill lecturer data
        setFormData(prev => ({
          ...prev,
          lecturer_id: currentUser.id.toString(),
          lecturer_name: `${currentUser.first_name} ${currentUser.last_name}`,
          faculty: currentUser.faculty || 'Faculty of Science'
        }));
      }
    };

    fetchData();
  }, [currentUser, fetchLecturerClasses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClassSelect = (e) => {
    const selectedClassId = e.target.value;
    const selectedClass = classes.find(cls => cls.id.toString() === selectedClassId);
    
    console.log('📚 Selected class:', selectedClass);
    
    setFormData(prev => ({
      ...prev,
      class_id: selectedClassId,
      course_id: selectedClass ? selectedClass.course_id.toString() : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setIsError(false);

    try {
      // Validate required fields
      if (!formData.class_id || !formData.week_of_reporting || !formData.date_of_lecture || 
          !formData.actual_students_present || !formData.topic_taught || !formData.learning_outcomes) {
        throw new Error('Please fill in all required fields (*)');
      }

      const selectedClass = classes.find(cls => cls.id.toString() === formData.class_id);
      if (!selectedClass) {
        throw new Error('Please select a valid class');
      }

      // Prepare report data according to backend expectations
      const reportData = {
        lecturer_id: parseInt(formData.lecturer_id),
        class_id: parseInt(formData.class_id),
        course_id: parseInt(selectedClass.course_id),
        week_of_reporting: formData.week_of_reporting,
        date_of_lecture: formData.date_of_lecture,
        actual_students_present: parseInt(formData.actual_students_present) || 0,
        topic_taught: formData.topic_taught,
        teaching_methods: formData.teaching_methods || 'Lecture, Discussion',
        challenges_encountered: formData.challenges_encountered || 'None',
        learning_outcomes: formData.learning_outcomes,
        recommendations: formData.recommendations || ''
      };

      console.log('📝 Submitting report data:', reportData);

      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        const newReport = await response.json();
        setMessage('Report submitted successfully!');
        
        // Reset form but keep lecturer info
        setFormData({
          class_id: '',
          lecturer_id: currentUser?.id.toString() || '',
          lecturer_name: `${currentUser?.first_name} ${currentUser?.last_name}`,
          faculty: currentUser?.faculty || 'Faculty of Science',
          week_of_reporting: '',
          date_of_lecture: '',
          actual_students_present: '',
          topic_taught: '',
          learning_outcomes: '',
          recommendations: '',
          teaching_methods: '',
          challenges_encountered: ''
        });

        if (onSubmitReport) {
          onSubmitReport(newReport);
        }

        // Auto-clear success message after 3 seconds
        setTimeout(() => {
          setMessage('');
        }, 3000);

      } else {
        const errorData = await response.json();
        console.error('❌ Server response error:', errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to submit report');
      }
    } catch (error) {
      console.error('❌ Error submitting report:', error);
      setMessage(error.message || 'Error submitting report. Please try again.');
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      class_id: '',
      lecturer_id: currentUser?.id.toString() || '',
      lecturer_name: `${currentUser?.first_name} ${currentUser?.last_name}`,
      faculty: currentUser?.faculty || 'Faculty of Science',
      week_of_reporting: '',
      date_of_lecture: '',
      actual_students_present: '',
      topic_taught: '',
      learning_outcomes: '',
      recommendations: '',
      teaching_methods: '',
      challenges_encountered: ''
    });
    setMessage('');
    setIsError(false);
  };

  const getSelectedClass = () => {
    return classes.find(cls => cls.id.toString() === formData.class_id);
  };

  const selectedClass = getSelectedClass();

  if (isLoading) {
    return (
      <div className="reporting-form-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reporting-form-container">
      <div className="form-header">
        <button onClick={onBackToDashboard} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>Lecturer Reporting Form</h1>
        <p>Complete the form to submit your class report</p>
      </div>

      {message && (
        <div className={`message ${isError ? 'error' : 'success'}`}>
          {message}
          <button 
            onClick={() => setMessage('')} 
            className="close-message"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="reporting-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lecturer_name">Lecturer's Name *</label>
              <input
                type="text"
                id="lecturer_name"
                value={formData.lecturer_name || `${currentUser?.first_name} ${currentUser?.last_name}`}
                readOnly
                className="read-only"
              />
            </div>

            <div className="form-group">
              <label htmlFor="faculty">Faculty *</label>
              <input
                type="text"
                id="faculty"
                value={formData.faculty || currentUser?.faculty || ''}
                readOnly
                className="read-only"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="class_id">Class *</label>
              <select
                id="class_id"
                name="class_id"
                value={formData.class_id}
                onChange={handleClassSelect}
                required
                disabled={classes.length === 0}
              >
                <option value="">{classes.length === 0 ? 'No classes available' : 'Select Class'}</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.course_name} ({cls.course_code})
                  </option>
                ))}
              </select>
              {classes.length === 0 && (
                <p className="field-note error">
                  No classes assigned to you. Please contact the Program Leader.
                </p>
              )}
            </div>

            {selectedClass && (
              <div className="form-group">
                <label>Course Code & Name</label>
                <input
                  type="text"
                  value={`${selectedClass.course_code} - ${selectedClass.course_name}`}
                  readOnly
                  className="read-only"
                />
              </div>
            )}
          </div>

          {selectedClass && (
            <div className="form-row">
              <div className="form-group">
                <label>Schedule</label>
                <input
                  type="text"
                  value={`${selectedClass.schedule_day} at ${selectedClass.schedule_time}`}
                  readOnly
                  className="read-only"
                />
              </div>
              
              <div className="form-group">
                <label>Venue</label>
                <input
                  type="text"
                  value={selectedClass.venue}
                  readOnly
                  className="read-only"
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="week_of_reporting">Week of Reporting *</label>
              <input
                type="week"
                id="week_of_reporting"
                name="week_of_reporting"
                value={formData.week_of_reporting}
                onChange={handleInputChange}
                required
              />
              <p className="field-note">Format: YYYY-W## (e.g., 2024-W01)</p>
            </div>

            <div className="form-group">
              <label htmlFor="date_of_lecture">Date of Lecture *</label>
              <input
                type="date"
                id="date_of_lecture"
                name="date_of_lecture"
                value={formData.date_of_lecture}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Attendance Information</h2>
          <div className="form-group">
            <label htmlFor="actual_students_present">Actual Number of Students Present *</label>
            <input
              type="number"
              id="actual_students_present"
              name="actual_students_present"
              value={formData.actual_students_present}
              onChange={handleInputChange}
              required
              min="0"
              max="500"
              placeholder="Enter number of students present"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Teaching Details</h2>
          
          <div className="form-group">
            <label htmlFor="topic_taught">Topic Taught *</label>
            <textarea
              id="topic_taught"
              name="topic_taught"
              value={formData.topic_taught}
              onChange={handleInputChange}
              required
              rows="3"
              placeholder="Enter the specific topic covered in this lecture..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="learning_outcomes">Learning Outcomes Achieved *</label>
            <textarea
              id="learning_outcomes"
              name="learning_outcomes"
              value={formData.learning_outcomes}
              onChange={handleInputChange}
              required
              rows="3"
              placeholder="Describe what students should be able to do after this lecture..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="teaching_methods">Teaching Methods Used</label>
            <textarea
              id="teaching_methods"
              name="teaching_methods"
              value={formData.teaching_methods}
              onChange={handleInputChange}
              rows="2"
              placeholder="e.g., Lecture, Group Discussion, Demonstration, Case Study..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="challenges_encountered">Challenges Encountered</label>
            <textarea
              id="challenges_encountered"
              name="challenges_encountered"
              value={formData.challenges_encountered}
              onChange={handleInputChange}
              rows="2"
              placeholder="Any difficulties or challenges faced during the lecture..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="recommendations">Lecturer's Recommendations</label>
            <textarea
              id="recommendations"
              name="recommendations"
              value={formData.recommendations}
              onChange={handleInputChange}
              rows="3"
              placeholder="Any recommendations for improvement or follow-up actions..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleClearForm} 
            className="clear-btn"
            disabled={isSubmitting}
          >
            Clear Form
          </button>
          <button 
            type="button" 
            onClick={onBackToDashboard} 
            className="cancel-btn"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting || classes.length === 0}
            className="submit-btn"
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </button>
        </div>
      </form>

      <div className="form-footer">
        <p className="form-note">
          <strong>Note:</strong> Fields marked with * are required. This report will be submitted to the Program Leader for review.
        </p>
        
        {classes.length === 0 && (
          <div className="warning-box">
            <h4>⚠️ No Classes Assigned</h4>
            <p>You don't have any classes assigned to you. Please contact the Program Leader or Faculty Manager to get classes assigned.</p>
          </div>
        )}
        
        <div className="debug-info">
          <details>
            <summary>Debug Information</summary>
            <p><strong>Lecturer ID:</strong> {currentUser?.id}</p>
            <p><strong>Classes Loaded:</strong> {classes.length}</p>
            <p><strong>Selected Class ID:</strong> {formData.class_id || 'None'}</p>
            <p><strong>Selected Course ID:</strong> {formData.course_id || 'None'}</p>
          </details>
        </div>
      </div>
    </div>
  );
};

export default LecturerReportingForm;