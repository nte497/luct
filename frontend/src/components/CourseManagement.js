import React, { useState, useEffect } from 'react';
//import './CourseManagement.css';

const API_BASE_URL = 'http://localhost:5000/api';

const CourseManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    faculty: '',
    department: '',
    credits: 4,
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch faculties on component mount
  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/faculties`);
      
      if (response.ok) {
        const data = await response.json();
        setFaculties(data);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
      setError('Error loading faculties. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async (facultyName) => {
    try {
      setIsLoadingDepartments(true);
      const response = await fetch(`${API_BASE_URL}/departments?faculty=${encodeURIComponent(facultyName)}`);
      
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Error loading departments for selected faculty.');
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'faculty') {
      setFormData(prev => ({
        ...prev,
        faculty: value,
        department: ''
      }));
      setDepartments([]);
      if (value) {
        fetchDepartments(value);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.code || !formData.name) {
      setError('Please fill all required fields: Code and Name');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_code: formData.code,
          course_name: formData.name,
          faculty: formData.faculty,
          department: formData.department,
          credits: parseInt(formData.credits),
          description: formData.description
        })
      });

      if (response.ok) {
        const newCourse = await response.json();
        setSuccess(`Course "${newCourse.course_name}" (${newCourse.course_code}) added successfully!`);
        
        // Reset form
        setFormData({
          code: '',
          name: '',
          faculty: '',
          department: '',
          credits: 4,
          description: ''
        });
        setDepartments([]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || `Failed to add course. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error adding course:', error);
      setError(error.message || 'Error adding course. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && faculties.length === 0) {
    return <div className="loading">Loading faculties and departments...</div>;
  }

  return (
    <div className="course-management">
      <div className="course-management-header">
        <h2>Add New Course</h2>
        <p>Create a new course for the learning management system</p>
      </div>
      
      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <strong>Success:</strong> {success}
        </div>
      )}
      
      <div className="form-container">
        <form onSubmit={handleSubmit} className="course-form">
          <div className="form-section" data-section="basic">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="code">Course Code *</label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., CS101"
                />
              </div>
              <div className="form-group">
                <label htmlFor="name">Course Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Introduction to Programming"
                />
              </div>
            </div>
          </div>

          <div className="form-section" data-section="faculty">
            <h3>Faculty & Department</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="faculty">Faculty</label>
                <select
                  id="faculty"
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleInputChange}
                >
                  <option value="">Select Faculty (Optional)</option>
                  {faculties.map(faculty => (
                    <option key={faculty.id} value={faculty.faculty_name}>
                      {faculty.faculty_name} ({faculty.faculty_code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group department-loading-container">
                <label htmlFor="department">Department</label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={!formData.faculty || isLoadingDepartments}
                >
                  <option value="">
                    {isLoadingDepartments ? 'Loading departments...' : 
                     formData.faculty ? 'Select Department (Optional)' : 'Select Faculty First'}
                  </option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.department_name}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
                {isLoadingDepartments && <div className="department-loading"></div>}
              </div>
            </div>
          </div>

          <div className="form-section" data-section="details">
            <h3>Course Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="credits">Credits</label>
                <input
                  type="number"
                  id="credits"
                  name="credits"
                  value={formData.credits}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Enter course description, learning objectives, and any other relevant information..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Adding Course...
                </>
              ) : (
                'Add Course'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseManagement;