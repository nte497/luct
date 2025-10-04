import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

const RoleDashboard = ({ 
  onRoleSelect, 
  isLoggedIn, 
  currentUser, 
  onLogout, 
  onNavigateToReporting, 
  onNavigateToStudentReport, 
  onNavigateToPrincipalReporting,
  reports, 
  onPrincipalResponse, 
  onLeaderResponse, 
  lecturers = [] 
}) => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [userClasses, setUserClasses] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allClasses, setAllClasses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [showAssignClassModal, setShowAssignClassModal] = useState(false);
  const [newClassForm, setNewClassForm] = useState({
    name: '',
    course_id: '',
    lecturer_id: '',
    schedule_day: 'Monday',
    schedule_time: '08:00',
    venue: '',
    academic_year: '2024/2025',
    semester: 'Semester 1'
  });

  // Course Management States
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courseFormData, setCourseFormData] = useState({
    code: '',
    name: '',
    faculty: '',
    department: '',
    credits: 4,
    description: ''
  });
  const [isCourseLoading, setIsCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState('');
  const [courseSuccess, setCourseSuccess] = useState('');
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  // Principal Reports State
  const [principalReports, setPrincipalReports] = useState([]);

  // Export loading states
  const [exportLoading, setExportLoading] = useState({
    courses: false,
    users: false,
    classes: false,
    reports: false,
    studentReports: false,
    all: false
  });

  // Fetch data based on user role
  useEffect(() => {
    const fetchUserData = async () => {
      if (isLoggedIn && currentUser) {
        setIsLoading(true);
        try {
          // Fetch user classes if lecturer
          if (currentUser.role === 'lecturer') {
            await fetchUserClasses();
          }
          // Fetch all reports if principal, leader, or faculty manager
          if (currentUser.role === 'program_leader' || currentUser.role === 'principal_lecturer' || currentUser.role === 'faculty_manager') {
            await fetchAllReports();
          }
          // Fetch all classes and courses for program leader
          if (currentUser.role === 'program_leader') {
            await fetchAllClasses();
            await fetchAllCourses();
            await fetchPrincipalReports();
          }
          // Fetch faculties for course management
          if (currentUser.role === 'program_leader') {
            await fetchFaculties();
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [isLoggedIn, currentUser]);

  // ==================== EXPORT FUNCTIONS ====================

  const handleExport = async (exportType) => {
    setExportLoading(prev => ({ ...prev, [exportType]: true }));
    
    try {
      console.log(`📤 Starting export for: ${exportType}`);
      
      const response = await fetch(`${API_BASE_URL}/export/${exportType}`);
      
      console.log(`📊 Export response status: ${response.status}`);
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Export failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }

      // Check if response is actually Excel data
      const contentType = response.headers.get('content-type');
      console.log(`📄 Content-Type: ${contentType}`);
      
      // Get the blob data
      const blob = await response.blob();
      console.log(`📦 Blob size: ${blob.size} bytes`);
      
      if (blob.size === 0) {
        throw new Error('Exported file is empty - no data available');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Set filename based on export type
      const filenames = {
        courses: 'LUCT_Courses_Export.xlsx',
        users: 'LUCT_Users_Export.xlsx',
        classes: 'LUCT_Classes_Export.xlsx',
        reports: 'LUCT_Reports_Export.xlsx',
        'student-reports': 'LUCT_Student_Reports_Export.xlsx',
        all: 'LUCT_Full_Export.xlsx'
      };
      
      a.download = filenames[exportType];
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log(`✅ ${exportType} exported successfully`);
      alert(`${exportType.replace('-', ' ')} exported successfully!`);
      
    } catch (error) {
      console.error(`❌ Error exporting ${exportType}:`, error);
      alert(`Failed to export ${exportType.replace('-', ' ')}: ${error.message}`);
    } finally {
      setExportLoading(prev => ({ ...prev, [exportType]: false }));
    }
  };

  const fetchAllReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports`);
      if (response.ok) {
        const reportsData = await response.json();
        setAllReports(reportsData);
      }
    } catch (error) {
      console.error('Error fetching all reports:', error);
    }
  };

  const fetchUserClasses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/classes/lecturer/${currentUser.id}`);
      if (response.ok) {
        const classes = await response.json();
        setUserClasses(classes);
      }
    } catch (error) {
      console.error('Error fetching user classes:', error);
    }
  };

  const fetchAllClasses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/classes`);
      if (response.ok) {
        const classesData = await response.json();
        setAllClasses(classesData);
      }
    } catch (error) {
      console.error('Error fetching all classes:', error);
    }
  };

  const fetchAllCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`);
      if (response.ok) {
        const coursesData = await response.json();
        setAllCourses(coursesData);
      }
    } catch (error) {
      console.error('Error fetching all courses:', error);
    }
  };

  const fetchPrincipalReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/principal-reports`);
      if (response.ok) {
        const reportsData = await response.json();
        setPrincipalReports(reportsData);
      }
    } catch (error) {
      console.error('Error fetching principal reports:', error);
    }
  };

  const fetchFaculties = async () => {
    try {
      setIsCourseLoading(true);
      const response = await fetch(`${API_BASE_URL}/faculties`);
      
      if (response.ok) {
        const data = await response.json();
        setFaculties(data);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
      setCourseError('Error loading faculties. Please check if the server is running.');
    } finally {
      setIsCourseLoading(false);
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
      setCourseError('Error loading departments for selected faculty.');
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  // Class assignment functions
  const handleAssignClass = async (e) => {
    e.preventDefault();
    try {
      if (!newClassForm.name || !newClassForm.course_id || !newClassForm.lecturer_id || !newClassForm.venue) {
        alert('Please fill in all required fields');
        return;
      }

      const classData = {
        name: newClassForm.name,
        course_id: parseInt(newClassForm.course_id),
        lecturer_id: parseInt(newClassForm.lecturer_id),
        schedule_day: newClassForm.schedule_day,
        schedule_time: newClassForm.schedule_time,
        venue: newClassForm.venue,
        academic_year: newClassForm.academic_year,
        semester: newClassForm.semester,
        assigned_by: currentUser.id
      };

      const response = await fetch(`${API_BASE_URL}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classData)
      });

      if (response.ok) {
        const newClass = await response.json();
        setAllClasses(prev => [...prev, newClass]);
        setShowAssignClassModal(false);
        setNewClassForm({
          name: '',
          course_id: '',
          lecturer_id: '',
          schedule_day: 'Monday',
          schedule_time: '08:00',
          venue: '',
          academic_year: '2024/2025',
          semester: 'Semester 1'
        });
        alert('Class assigned successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign class');
      }
    } catch (error) {
      console.error('Error assigning class:', error);
      alert(error.message || 'Error assigning class');
    }
  };

  const handleReassignClass = async (classId, newLecturerId) => {
    if (!newLecturerId) {
      alert('Please select a lecturer');
      return;
    }

    try {
      const classToUpdate = allClasses.find(cls => cls.id === classId);
      const updatedClassData = {
        name: classToUpdate.name,
        course_id: classToUpdate.course_id,
        lecturer_id: parseInt(newLecturerId),
        schedule_day: classToUpdate.schedule_day,
        schedule_time: classToUpdate.schedule_time,
        venue: classToUpdate.venue,
        academic_year: classToUpdate.academic_year,
        semester: classToUpdate.semester,
        assigned_by: currentUser.id
      };

      const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedClassData)
      });

      if (response.ok) {
        const updatedClass = await response.json();
        setAllClasses(prev => prev.map(cls => 
          cls.id === classId ? { ...cls, ...updatedClass } : cls
        ));
        alert('Class reassigned successfully!');
      } else {
        throw new Error('Failed to reassign class');
      }
    } catch (error) {
      console.error('Error reassigning class:', error);
      alert('Error reassigning class');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setAllClasses(prev => prev.filter(cls => cls.id !== classId));
          alert('Class deleted successfully!');
        } else {
          throw new Error('Failed to delete class');
        }
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Error deleting class');
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewClassForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Course Management Functions
  const handleCourseInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'faculty') {
      setCourseFormData(prev => ({
        ...prev,
        faculty: value,
        department: ''
      }));
      setDepartments([]);
      if (value) {
        fetchDepartments(value);
      }
    } else {
      setCourseFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setCourseError('');
    setCourseSuccess('');

    if (!courseFormData.code || !courseFormData.name) {
      setCourseError('Please fill all required fields: Code and Name');
      return;
    }

    setIsCourseLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_code: courseFormData.code,
          course_name: courseFormData.name,
          faculty: courseFormData.faculty,
          department: courseFormData.department,
          credits: parseInt(courseFormData.credits),
          description: courseFormData.description
        })
      });

      if (response.ok) {
        const newCourse = await response.json();
        setCourseSuccess(`Course "${newCourse.course_name}" (${newCourse.course_code}) added successfully!`);
        setAllCourses(prev => [...prev, newCourse]);
        
        // Reset form
        setCourseFormData({
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
      setCourseError(error.message || 'Error adding course. Please try again.');
    } finally {
      setIsCourseLoading(false);
    }
  };

  // Role definitions
  const roles = [
    { id: 'student', title: 'Student', description: 'Access your courses, assignments, and grades', icon: '🎓' },
    { id: 'lecturer', title: 'Lecturer', description: 'Manage courses, grade assignments, and submit reports', icon: '👨‍🏫' },
    { id: 'principal_lecturer', title: 'Principal Lecturer', description: 'Oversee curriculum and faculty management', icon: '👨‍💼' },
    { id: 'program_leader', title: 'Program Leader', description: 'Manage programs and track student progress', icon: '👩‍💻' },
    { id: 'faculty_manager', title: 'Faculty Manager', description: 'Manage faculty operations and strategic planning', icon: '🏢' }
  ];

  if (!isLoggedIn) {
    return (
      <div className="role-dashboard">
        <div className="dashboard-container">
          <div className="login-header">
            <div className="logo-container">
              <img 
                src="/images/Limkokwing_Lesotho_Logo.png" 
                alt="Limkokwing Lesotho Logo" 
                className="university-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="university-title">
                <h1> Welcome To Limkokwing Reporting System</h1>
                
              </div>
            </div>
          </div>
          <p className="role-select-subtitle">Select your role to continue</p>
          <div className="roles-grid">
            {roles.map(role => (
              <div 
                key={role.id} 
                className="role-card"
                onClick={() => onRoleSelect(role)}
              >
                <div className="role-icon">{role.icon}</div>
                <h2>{role.title}</h2>
                <p>{role.description}</p>
                <div className="click-hint">Click to login →</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="role-dashboard">
        <div className="dashboard-container">
          <div className="loading-state">
            <p>Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="role-dashboard">
        <div className="dashboard-container">
          <div className="loading-state">
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard
  const StudentDashboard = () => {
    const [studentReports, setStudentReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(true);

    useEffect(() => {
      const fetchStudentReports = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/student-reports/student/${currentUser.id}`);
          if (response.ok) {
            const reportsData = await response.json();
            setStudentReports(reportsData);
          }
        } catch (error) {
          console.error('Error fetching student reports:', error);
        } finally {
          setReportsLoading(false);
        }
      };

      fetchStudentReports();
    }, [currentUser.id]);

    const renderModuleContent = () => {
      switch(activeModule) {
        case 'reports':
          return (
            <div className="module-content">
              <div className="module-header">
                <h3>My Reports to Principal Lecturer</h3>
                <button onClick={onNavigateToStudentReport} className="btn-primary">
                  Submit New Report
                </button>
              </div>
              
              {reportsLoading ? (
                <div className="loading-state">
                  <p>Loading your reports...</p>
                </div>
              ) : studentReports.length === 0 ? (
                <div className="empty-state">
                  <p>You haven't submitted any reports to the Principal Lecturer yet.</p>
                  <button onClick={onNavigateToStudentReport} className="btn-primary">
                    Submit Your First Report
                  </button>
                </div>
              ) : (
                <div className="reports-list">
                  {studentReports.map(report => (
                    <div key={report.id} className="report-card">
                      <div className="report-header">
                        <span className="report-type">Student Report</span>
                        <span className="report-date">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                        <span className={`status-badge ${report.status}`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="report-content">
                        <p><strong>Lecturer:</strong> {report.lecturer_name}</p>
                        <p><strong>Course:</strong> {report.course_name}</p>
                        <p><strong>Issue Type:</strong> {report.issue_type}</p>
                        <p><strong>Urgency:</strong> 
                          <span className={`urgency-badge ${report.urgency_level}`}>
                            {report.urgency_level}
                          </span>
                        </p>
                        <p><strong>Description:</strong> {report.description}</p>
                        
                        {report.principal_response && (
                          <div className="response-section">
                            <h4>Principal Lecturer's Response:</h4>
                            <div className="response-content">
                              <p><strong>Response:</strong> {report.principal_response}</p>
                              {report.action_taken && (
                                <p><strong>Action Taken:</strong> {report.action_taken}</p>
                              )}
                              <p><strong>Responded On:</strong> {new Date(report.responded_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );

        default:
          return (
            <div className="module-content">
              <h3>Student Dashboard</h3>
              <div className="quick-stats">
                <div className="stat-card">
                  <div className="stat-number">5</div>
                  <div className="stat-label">Current Courses</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{studentReports.length}</div>
                  <div className="stat-label">Reports Submitted</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {studentReports.filter(r => r.principal_response).length}
                  </div>
                  <div className="stat-label">Responses Received</div>
                </div>
              </div>

              {studentReports.filter(r => r.principal_response).length > 0 && (
                <div className="recent-responses">
                  <h4>Recent Responses from Principal Lecturer</h4>
                  <div className="responses-list">
                    {studentReports
                      .filter(r => r.principal_response)
                      .slice(0, 3)
                      .map(report => (
                        <div key={report.id} className="response-card">
                          <p><strong>Regarding:</strong> {report.lecturer_name} - {report.course_name}</p>
                          <p>{report.principal_response.substring(0, 100)}...</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          );
      }
    };

    return (
      <div className="student-dashboard">
        <div className="dashboard-header-modular">
          <div className="header-with-logo">
            <img 
              src="/images/Limkokwing_Lesotho_Logo.png" 
              alt="Limkokwing Lesotho Logo" 
              className="dashboard-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="header-text">
              <h2>Student Portal</h2>
              <p>Welcome, {currentUser.first_name} {currentUser.last_name}</p>
            </div>
          </div>
        </div>

        <div className="modules-nav">
          <button
            className={`module-tab ${activeModule === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveModule('dashboard')}
          >
            <span className="module-icon">📊</span>
            <span className="module-name">Dashboard</span>
          </button>
          <button
            className={`module-tab ${activeModule === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveModule('reports')}
          >
            <span className="module-icon">📝</span>
            <span className="module-name">My Reports</span>
          </button>
        </div>

        {renderModuleContent()}
      </div>
    );
  };

  // Lecturer Dashboard
  const LecturerDashboard = () => {
    const [lecturerReports, setLecturerReports] = useState([]);
    const [classRatings, setClassRatings] = useState({});
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [selectedClassForRating, setSelectedClassForRating] = useState(null);
    const [ratingForm, setRatingForm] = useState({
      rating: 5,
      comments: '',
      date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
      const fetchLecturerData = async () => {
        try {
          const [reportsResponse, ratingsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/reports/lecturer/${currentUser.id}`),
            fetch(`${API_BASE_URL}/class-ratings/lecturer/${currentUser.id}`)
          ]);

          if (reportsResponse.ok) {
            const reportsData = await reportsResponse.json();
            setLecturerReports(reportsData);
          }

          if (ratingsResponse.ok) {
            const ratingsData = await ratingsResponse.json();
            const ratingsObj = {};
            ratingsData.forEach(rating => {
              ratingsObj[rating.class_id] = rating;
            });
            setClassRatings(ratingsObj);
          }
        } catch (error) {
          console.error('Error fetching lecturer data:', error);
        }
      };

      fetchLecturerData();
    }, [currentUser.id]);

    const handleRateClass = (classItem) => {
      setSelectedClassForRating(classItem);
      if (classRatings[classItem.id]) {
        const existingRating = classRatings[classItem.id];
        setRatingForm({
          rating: existingRating.rating,
          comments: existingRating.comments || '',
          date: existingRating.rating_date || new Date().toISOString().split('T')[0]
        });
      } else {
        setRatingForm({
          rating: 5,
          comments: '',
          date: new Date().toISOString().split('T')[0]
        });
      }
      setShowRatingModal(true);
    };

    const submitClassRating = async () => {
      try {
        const ratingData = {
          class_id: selectedClassForRating.id,
          lecturer_id: currentUser.id,
          rating: parseInt(ratingForm.rating),
          comments: ratingForm.comments,
          rating_date: ratingForm.date
        };

        const response = await fetch(`${API_BASE_URL}/class-ratings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ratingData)
        });

        const responseData = await response.json();
        
        if (response.ok) {
          const newRating = responseData.rating;
          setClassRatings(prev => ({
            ...prev,
            [selectedClassForRating.id]: newRating
          }));
          setShowRatingModal(false);
          alert('Class rating submitted successfully!');
        } else {
          throw new Error(responseData.error || 'Failed to submit rating');
        }
      } catch (error) {
        console.error('Error submitting class rating:', error);
        alert(`Error submitting rating: ${error.message}`);
      }
    };

    const renderModuleContent = () => {
      switch(activeModule) {
        case 'reports':
          return (
            <div className="module-content">
              <div className="module-header">
                <h3>My Lecture Reports</h3>
                <div className="module-actions">
                  <button onClick={onNavigateToReporting} className="btn-primary">
                    Submit New Report
                  </button>
                  {lecturerReports.length > 0 && (
                    <button 
                      onClick={() => handleExport('reports')}
                      className="btn-export"
                      disabled={exportLoading.reports}
                    >
                      {exportLoading.reports ? '⏳ Exporting...' : '📊 Export My Reports'}
                    </button>
                  )}
                </div>
              </div>
              
              {lecturerReports.length === 0 ? (
                <div className="empty-state">
                  <p>You haven't submitted any lecture reports yet.</p>
                  <button onClick={onNavigateToReporting} className="btn-primary">
                    Submit Your First Report
                  </button>
                </div>
              ) : (
                <div className="reports-list">
                  {lecturerReports.map(report => (
                    <div key={report.id} className="report-card">
                      <div className="report-header">
                        <span className="report-type">Lecture Report</span>
                        <span className="report-date">
                          {new Date(report.date_of_lecture).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="report-content">
                        <p><strong>Class:</strong> {report.class_name}</p>
                        <p><strong>Course:</strong> {report.course_name}</p>
                        <p><strong>Students Present:</strong> {report.actual_students_present}</p>
                        <p><strong>Topic:</strong> {report.topic_taught}</p>
                        <p><strong>Week:</strong> {report.week_of_reporting}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );

        case 'classes':
          return (
            <div className="module-content">
              <div className="module-header">
                <h3>My Assigned Classes & Courses</h3>
                <p className="module-subtitle">These are the classes and courses assigned to you by the Program Leader</p>
              </div>
              
              {userClasses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏫</div>
                  <h4>No Classes Assigned</h4>
                  <p>You haven't been assigned any classes yet. Please contact the Program Leader.</p>
                </div>
              ) : (
                <div className="classes-grid">
                  {userClasses.map(classItem => (
                    <div key={classItem.id} className="class-card">
                      <div className="class-card-header">
                        <h4>{classItem.name}</h4>
                        {classRatings[classItem.id] && (
                          <div className="class-rating-badge">
                            ⭐ {classRatings[classItem.id].rating}/5
                          </div>
                        )}
                      </div>
                      <p>{classItem.course_name}</p>
                      <div className="class-details">
                        <span>Schedule: {classItem.schedule_day} {classItem.schedule_time}</span>
                        <span>Venue: {classItem.venue}</span>
                        <span>Assigned by: {classItem.assigned_by_name || 'Program Leader'}</span>
                      </div>
                      <div className="class-actions">
                        <button 
                          onClick={() => handleRateClass(classItem)}
                          className="btn-primary btn-small"
                        >
                          {classRatings[classItem.id] ? 'Update Rating' : 'Rate Class'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );

        default:
          return (
            <div className="module-content">
              <h3>Lecturer Dashboard</h3>
              <div className="quick-stats">
                <div className="stat-card">
                  <div className="stat-number">{userClasses.length}</div>
                  <div className="stat-label">Active Classes</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{lecturerReports.length}</div>
                  <div className="stat-label">Reports Submitted</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {Object.keys(classRatings).length}
                  </div>
                  <div className="stat-label">Classes Rated</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {Object.values(classRatings).length > 0 
                      ? (Object.values(classRatings).reduce((sum, rating) => sum + rating.rating, 0) / Object.values(classRatings).length).toFixed(1)
                      : '0.0'
                    }
                  </div>
                  <div className="stat-label">Average Rating</div>
                </div>
              </div>

              {userClasses.length > 0 && (
                <div className="recent-activity">
                  <h4>Your Classes</h4>
                  <div className="activity-list">
                    {userClasses.slice(0, 3).map(classItem => (
                      <div key={classItem.id} className="activity-item">
                        <span className="activity-text">
                          {classItem.name} - {classItem.course_name}
                        </span>
                        <span className="activity-meta">
                          {classItem.schedule_day} {classItem.schedule_time}
                        </span>
                        <button 
                          onClick={() => handleRateClass(classItem)}
                          className="btn-primary btn-small"
                        >
                          Rate
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
      }
    };

    return (
      <div className="lecturer-dashboard">
        <div className="dashboard-header-modular">
          <div className="header-with-logo">
            <img 
              src="/images/Limkokwing_Lesotho_Logo.png" 
              alt="Limkokwing Lesotho Logo" 
              className="dashboard-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="header-text">
              <h2>Lecturer Portal</h2>
              <p>Welcome, {currentUser.first_name} {currentUser.last_name}</p>
            </div>
          </div>
        </div>

        <div className="modules-nav">
          <button
            className={`module-tab ${activeModule === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveModule('dashboard')}
          >
            <span className="module-icon">📊</span>
            <span className="module-name">Dashboard</span>
          </button>
          <button
            className={`module-tab ${activeModule === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveModule('classes')}
          >
            <span className="module-icon">🏫</span>
            <span className="module-name">My Classes</span>
          </button>
          <button
            className={`module-tab ${activeModule === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveModule('reports')}
          >
            <span className="module-icon">📝</span>
            <span className="module-name">My Reports</span>
          </button>
        </div>

        {renderModuleContent()}

        {/* Class Rating Modal */}
        {showRatingModal && selectedClassForRating && (
          <div className="modal-overlay" onClick={() => setShowRatingModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Rate Class: {selectedClassForRating.name}</h3>
                <button 
                  onClick={() => setShowRatingModal(false)}
                  className="close-btn"
                >
                  ×
                </button>
              </div>
              <div className="modal-form">
                <div className="form-group">
                  <label>Rating (1-5 Stars)</label>
                  <select
                    value={ratingForm.rating}
                    onChange={(e) => setRatingForm(prev => ({...prev, rating: e.target.value}))}
                  >
                    <option value="1">1 ⭐ - Poor</option>
                    <option value="2">2 ⭐⭐ - Fair</option>
                    <option value="3">3 ⭐⭐⭐ - Good</option>
                    <option value="4">4 ⭐⭐⭐⭐ - Very Good</option>
                    <option value="5">5 ⭐⭐⭐⭐⭐ - Excellent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Comments (Optional)</label>
                  <textarea
                    value={ratingForm.comments}
                    onChange={(e) => setRatingForm(prev => ({...prev, comments: e.target.value}))}
                    rows="3"
                    placeholder="Any comments about this class..."
                  />
                </div>
                <div className="form-group">
                  <label>Rating Date</label>
                  <input
                    type="date"
                    value={ratingForm.date}
                    onChange={(e) => setRatingForm(prev => ({...prev, date: e.target.value}))}
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    onClick={() => setShowRatingModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={submitClassRating}
                    className="btn-primary"
                  >
                    Submit Rating
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Principal Lecturer Dashboard
  const PrincipalDashboard = () => {
    const [principalReports, setPrincipalReports] = useState([]);
    const [studentReports, setStudentReports] = useState([]);
    const [principalCourses, setPrincipalCourses] = useState([]);
    const [principalLecturers, setPrincipalLecturers] = useState([]);
    const [principalClasses, setPrincipalClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({
      report_type: 'academic_performance',
      academic_period: '2024/2025 Semester 1',
      summary: '',
      key_findings: '',
      recommendations: '',
      follow_up_actions: '',
      status: 'draft'
    });

    const [lecturerFeedbackForm, setLecturerFeedbackForm] = useState({
      reportId: '',
      feedback: '',
      rating: 5,
      principal_lecturer_id: ''
    });

    const [studentResponseForm, setStudentResponseForm] = useState({
      reportId: '',
      response: '',
      action_taken: '',
      status: 'resolved'
    });

    useEffect(() => {
      const fetchPrincipalData = async () => {
        if (currentUser?.role === 'principal_lecturer') {
          setIsLoading(true);
          try {
            await Promise.all([
              fetchPrincipalReportsData(),
              fetchStudentReports(),
              fetchPrincipalCourses(),
              fetchPrincipalLecturers(),
              fetchPrincipalClasses()
            ]);
          } catch (error) {
            console.error('Error fetching principal data:', error);
          } finally {
            setIsLoading(false);
          }
        }
      };

      fetchPrincipalData();
    }, [currentUser]);

    const fetchPrincipalReportsData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/reports`);
        if (response.ok) {
          const reportsData = await response.json();
          setPrincipalReports(reportsData);
        }
      } catch (error) {
        console.error('Error fetching principal reports:', error);
      }
    };

    const fetchStudentReports = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/student-reports`);
        if (response.ok) {
          const reportsData = await response.json();
          setStudentReports(reportsData);
        }
      } catch (error) {
        console.error('Error fetching student reports:', error);
      }
    };

    const fetchPrincipalCourses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/courses`);
        if (response.ok) {
          const coursesData = await response.json();
          setPrincipalCourses(coursesData);
        }
      } catch (error) {
        console.error('Error fetching principal courses:', error);
      }
    };

    const fetchPrincipalLecturers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/lecturers`);
        if (response.ok) {
          const lecturersData = await response.json();
          setPrincipalLecturers(lecturersData);
        }
      } catch (error) {
        console.error('Error fetching principal lecturers:', error);
      }
    };

    const fetchPrincipalClasses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/classes`);
        if (response.ok) {
          const classesData = await response.json();
          setPrincipalClasses(classesData);
        }
      } catch (error) {
        console.error('Error fetching principal classes:', error);
      }
    };

    const handleSubmitFeedback = async (reportId) => {
      try {
        if (!lecturerFeedbackForm.feedback || !lecturerFeedbackForm.principal_lecturer_id) {
          alert('Please fill in feedback and select your identity');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/reports/${reportId}/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedback: lecturerFeedbackForm.feedback,
            principal_lecturer_id: parseInt(lecturerFeedbackForm.principal_lecturer_id),
            rating: parseInt(lecturerFeedbackForm.rating)
          })
        });

        if (response.ok) {
          const result = await response.json();
          alert('Feedback submitted successfully!');
          setLecturerFeedbackForm({
            reportId: '',
            feedback: '',
            rating: 5,
            principal_lecturer_id: ''
          });
          fetchPrincipalReportsData();
        } else {
          throw new Error('Failed to submit feedback');
        }
      } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Error submitting feedback');
      }
    };

    const handleStudentReportResponse = async (reportId) => {
      try {
        if (!studentResponseForm.response) {
          alert('Please provide a response to the student');
          return;
        }

        const responseData = {
          principal_lecturer_id: parseInt(currentUser?.id || ''),
          response: studentResponseForm.response,
          action_taken: studentResponseForm.action_taken,
          status: studentResponseForm.status,
          responded_at: new Date().toISOString()
        };

        const response = await fetch(`${API_BASE_URL}/student-reports/${reportId}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(responseData)
        });

        if (response.ok) {
          const result = await response.json();
          alert('Response submitted successfully! Student and lecturer will be notified.');
          fetchStudentReports();
          setStudentResponseForm({
            reportId: '',
            response: '',
            action_taken: '',
            status: 'resolved'
          });
        } else {
          throw new Error('Failed to submit response');
        }
      } catch (error) {
        console.error('Error responding to student report:', error);
        alert('Error submitting response');
      }
    };

    const submitPrincipalReport = async () => {
      try {
        const reportData = {
          ...reportForm,
          principal_lecturer_id: currentUser.id,
          created_at: new Date().toISOString()
        };

        const response = await fetch(`${API_BASE_URL}/principal-reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reportData)
        });

        if (response.ok) {
          const newReport = await response.json();
          alert('Report submitted successfully to Program Leader!');
          setShowReportModal(false);
          setReportForm({
            report_type: 'academic_performance',
            academic_period: '2024/2025 Semester 1',
            summary: '',
            key_findings: '',
            recommendations: '',
            follow_up_actions: '',
            status: 'draft'
          });
        } else {
          throw new Error('Failed to submit report');
        }
      } catch (error) {
        console.error('Error submitting principal report:', error);
        alert('Error submitting report');
      }
    };

    const renderModuleContent = () => {
      if (isLoading) {
        return (
          <div className="loading-state">
            <p>Loading Principal Dashboard...</p>
          </div>
        );
      }

      switch(activeModule) {
        case 'courses':
          return (
            <div className="module-content">
              <div className="module-header">
                <h3>All Courses</h3>
                <div className="module-actions">
                  <button 
                    onClick={() => handleExport('courses')}
                    className="btn-export"
                    disabled={exportLoading.courses}
                  >
                    {exportLoading.courses ? '⏳ Exporting...' : '📊 Export Courses'}
                  </button>
                </div>
              </div>
              
              {principalCourses.length === 0 ? (
                <div className="empty-state">
                  <p>No courses found.</p>
                </div>
              ) : (
                <div className="courses-list">
                  <div className="table-container">
                    <table className="courses-table">
                      <thead>
                        <tr>
                          <th>Course Code</th>
                          <th>Course Name</th>
                          <th>Faculty</th>
                          <th>Department</th>
                          <th>Credits</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {principalCourses.map(course => (
                          <tr key={course.id}>
                            <td><strong>{course.course_code}</strong></td>
                            <td>{course.course_name}</td>
                            <td>{course.faculty || 'N/A'}</td>
                            <td>{course.department || 'N/A'}</td>
                            <td>{course.credits || 'N/A'}</td>
                            <td className="course-description">
                              {course.description || 'No description available'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );

        case 'reporting':
          return (
            <div className="module-content">
              <div className="module-header">
                <h3>Report to Program Leader</h3>
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="btn-primary"
                >
                  Create New Report
                </button>
              </div>
              
              <div className="reporting-info">
                <h4>Reporting Guidelines</h4>
                <p>Use this section to submit formal reports to the Program Leader regarding:</p>
                <ul>
                  <li>Academic performance overview</li>
                  <li>Faculty development needs</li>
                  <li>Curriculum review findings</li>
                  <li>Student performance trends</li>
                  <li>Resource requirements</li>
                </ul>
              </div>
            </div>
          );

        case 'student-reports':
          return (
            <div className="module-content">
              <div className="module-header">
                <h3>Student Reports & Concerns</h3>
                <div className="module-actions">
                  <button 
                    onClick={() => handleExport('student-reports')}
                    className="btn-export"
                    disabled={exportLoading.studentReports}
                  >
                    {exportLoading.studentReports ? '⏳ Exporting...' : '📊 Export Student Reports'}
                  </button>
                </div>
              </div>
              
              <div className="reports-feedback">
                {studentReports.length === 0 ? (
                  <div className="empty-state">
                    <p>No student reports available for review.</p>
                  </div>
                ) : (
                  <div className="reports-list">
                    {studentReports.map(report => (
                      <div key={report.id} className="report-card">
                        <div className="report-header">
                          <span className="report-type">Student Report</span>
                          <span className="report-date">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                          <span className={`status-badge ${report.status}`}>
                            {report.status}
                          </span>
                          <span className={`urgency-badge ${report.urgency_level}`}>
                            {report.urgency_level}
                          </span>
                        </div>
                        <div className="report-content">
                          <p><strong>Student:</strong> {report.student_name}</p>
                          <p><strong>Lecturer:</strong> {report.lecturer_name}</p>
                          <p><strong>Course:</strong> {report.course_name}</p>
                          <p><strong>Issue Type:</strong> {report.issue_type}</p>
                          <p><strong>Description:</strong> {report.description}</p>
                          <p><strong>Date Occurred:</strong> {new Date(report.date_occurred).toLocaleDateString()}</p>
                        </div>
                        
                        {report.principal_response ? (
                          <div className="existing-feedback">
                            <h4>Your Response:</h4>
                            <p><strong>Response:</strong> {report.principal_response}</p>
                            {report.action_taken && (
                              <p><strong>Action Taken:</strong> {report.action_taken}</p>
                            )}
                            <p><strong>Status:</strong> {report.status}</p>
                            <p><strong>Responded On:</strong> {new Date(report.responded_at).toLocaleDateString()}</p>
                          </div>
                        ) : (
                          <div className="feedback-form">
                            <h4>Respond to Student:</h4>
                            <div className="form-group">
                              <label>Your Response to Student *:</label>
                              <textarea
                                value={studentResponseForm.reportId === report.id ? studentResponseForm.response : ''}
                                onChange={(e) => setStudentResponseForm(prev => ({
                                  ...prev,
                                  reportId: report.id,
                                  response: e.target.value
                                }))}
                                rows="3"
                                placeholder="Enter your response to the student..."
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Action Taken (Optional):</label>
                              <textarea
                                value={studentResponseForm.reportId === report.id ? studentResponseForm.action_taken : ''}
                                onChange={(e) => setStudentResponseForm(prev => ({
                                  ...prev,
                                  reportId: report.id,
                                  action_taken: e.target.value
                                }))}
                                rows="2"
                                placeholder="Describe any actions taken..."
                              />
                            </div>
                            <div className="form-group">
                              <label>Status:</label>
                              <select
                                value={studentResponseForm.reportId === report.id ? studentResponseForm.status : 'resolved'}
                                onChange={(e) => setStudentResponseForm(prev => ({
                                  ...prev,
                                  reportId: report.id,
                                  status: e.target.value
                                }))}
                              >
                                <option value="resolved">Resolved</option>
                                <option value="in_progress">In Progress</option>
                                <option value="pending">Pending</option>
                              </select>
                            </div>
                            <button 
                              onClick={() => handleStudentReportResponse(report.id)}
                              className="btn-primary"
                            >
                              Submit Response
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );

        case 'reports':
          return (
            <div className="module-content">
              <div className="module-header">
                <h3>Lecture Reports & Feedback</h3>
                <div className="module-actions">
                  <button 
                    onClick={() => handleExport('reports')}
                    className="btn-export"
                    disabled={exportLoading.reports}
                  >
                    {exportLoading.reports ? '⏳ Exporting...' : '📊 Export Lecture Reports'}
                  </button>
                </div>
              </div>
              
              <div className="reports-feedback">
                {principalReports.length === 0 ? (
                  <div className="empty-state">
                    <p>No reports available for review.</p>
                  </div>
                ) : (
                  <div className="reports-list">
                    {principalReports.map(report => (
                      <div key={report.id} className="report-card">
                        <div className="report-header">
                          <span className="report-type">Lecture Report</span>
                          <span className="report-date">
                            {new Date(report.date_of_lecture).toLocaleDateString()}
                          </span>
                          <span className={`status-badge ${report.status}`}>
                            {report.status}
                          </span>
                        </div>
                        <div className="report-content">
                          <p><strong>Lecturer:</strong> {report.lecturer_first_name} {report.lecturer_last_name}</p>
                          <p><strong>Course:</strong> {report.course_name} ({report.course_code})</p>
                          <p><strong>Class:</strong> {report.class_name}</p>
                          <p><strong>Topic Taught:</strong> {report.topic_taught}</p>
                          <p><strong>Students Present:</strong> {report.actual_students_present}</p>
                          <p><strong>Teaching Methods:</strong> {report.teaching_methods}</p>
                          <p><strong>Challenges:</strong> {report.challenges_encountered}</p>
                        </div>
                        
                        {report.feedback_text ? (
                          <div className="existing-feedback">
                            <h4>Your Feedback:</h4>
                            <p><strong>Rating:</strong> {report.feedback_rating}/5</p>
                            <p><strong>Comments:</strong> {report.feedback_text}</p>
                            <p><strong>Date:</strong> {new Date(report.feedback_date).toLocaleDateString()}</p>
                          </div>
                        ) : (
                          <div className="feedback-form">
                            <h4>Provide Feedback:</h4>
                            <div className="form-group">
                              <label>Your Rating (1-5):</label>
                              <select
                                value={lecturerFeedbackForm.reportId === report.id ? lecturerFeedbackForm.rating : 5}
                                onChange={(e) => setLecturerFeedbackForm(prev => ({
                                  ...prev,
                                  reportId: report.id,
                                  rating: e.target.value
                                }))}
                              >
                                {[1, 2, 3, 4, 5].map(num => (
                                  <option key={num} value={num}>{num}</option>
                                ))}
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Your Feedback:</label>
                              <textarea
                                value={lecturerFeedbackForm.reportId === report.id ? lecturerFeedbackForm.feedback : ''}
                                onChange={(e) => setLecturerFeedbackForm(prev => ({
                                  ...prev,
                                  reportId: report.id,
                                  feedback: e.target.value
                                }))}
                                rows="3"
                                placeholder="Enter your feedback comments..."
                              />
                            </div>
                            <div className="form-group">
                              <label>Your Identity:</label>
                              <select
                                value={lecturerFeedbackForm.reportId === report.id ? lecturerFeedbackForm.principal_lecturer_id : ''}
                                onChange={(e) => setLecturerFeedbackForm(prev => ({
                                  ...prev,
                                  reportId: report.id,
                                  principal_lecturer_id: e.target.value
                                }))}
                              >
                                <option value="">Select your identity</option>
                                <option value={currentUser?.id || ''}>
                                  {currentUser?.first_name} {currentUser?.last_name}
                                </option>
                              </select>
                            </div>
                            <button 
                              onClick={() => handleSubmitFeedback(report.id)}
                              className="btn-primary"
                            >
                              Submit Feedback
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );

        case 'monitoring':
          return (
            <div className="module-content">
              <div className="module-header">
                <h3>Monitoring & Analytics</h3>
                <div className="module-actions">
                  <button 
                    onClick={() => handleExport('all')}
                    className="btn-export"
                    disabled={exportLoading.all}
                  >
                    {exportLoading.all ? '⏳ Exporting...' : '📊 Export All Data'}
                  </button>
                </div>
              </div>
              
              <div className="monitoring-stats">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">{principalReports.length}</div>
                    <div className="stat-label">Total Lecture Reports</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{studentReports.length}</div>
                    <div className="stat-label">Student Reports</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">
                      {studentReports.filter(r => !r.principal_response).length}
                    </div>
                    <div className="stat-label">Pending Student Responses</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{principalLecturers.length}</div>
                    <div className="stat-label">Active Lecturers</div>
                  </div>
                </div>
                
                <div className="recent-activity">
                  <h4>Recent Student Reports Needing Attention</h4>
                  <div className="activity-list">
                    {studentReports
                      .filter(r => !r.principal_response)
                      .slice(0, 5)
                      .map(report => (
                        <div key={report.id} className="activity-item">
                          <span className="activity-text">
                            {report.student_name} reported {report.lecturer_name}
                          </span>
                          <span className="activity-date">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                          <button 
                            onClick={() => setActiveModule('student-reports')}
                            className="btn-primary btn-small"
                          >
                            Respond
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          );

        default:
          return (
            <div className="module-content">
              <h3>Principal Lecturer Dashboard</h3>
              <div className="quick-stats">
                <div className="stat-card">
                  <div className="stat-number">{principalReports.length}</div>
                  <div className="stat-label">Lecture Reports</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{studentReports.length}</div>
                  <div className="stat-label">Student Reports</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {studentReports.filter(r => !r.principal_response).length}
                  </div>
                  <div className="stat-label">Pending Responses</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{principalLecturers.length}</div>
                  <div className="stat-label">Lecturers</div>
                </div>
              </div>

              <div className="export-options">
                <h4>Data Export</h4>
                <div className="export-buttons">
                  <button 
                    onClick={() => handleExport('courses')}
                    className="btn-export"
                    disabled={exportLoading.courses}
                  >
                    {exportLoading.courses ? '⏳ Exporting...' : '📚 Export Courses'}
                  </button>
                  <button 
                    onClick={() => handleExport('reports')}
                    className="btn-export"
                    disabled={exportLoading.reports}
                  >
                    {exportLoading.reports ? '⏳ Exporting...' : '📋 Export Lecture Reports'}
                  </button>
                  <button 
                    onClick={() => handleExport('student-reports')}
                    className="btn-export"
                    disabled={exportLoading.studentReports}
                  >
                    {exportLoading.studentReports ? '⏳ Exporting...' : '📝 Export Student Reports'}
                  </button>
                  <button 
                    onClick={() => handleExport('all')}
                    className="btn-export"
                    disabled={exportLoading.all}
                  >
                    {exportLoading.all ? '⏳ Exporting...' : '📊 Export All Data'}
                  </button>
                </div>
              </div>

              <div className="recent-activity">
                <h4>Quick Actions</h4>
                <div className="quick-actions-grid">
                  <button 
                    onClick={() => setActiveModule('reporting')}
                    className="quick-action-btn"
                  >
                    <span className="action-icon">📤</span>
                    <span className="action-text">Report to Program Leader</span>
                  </button>
                  <button 
                    onClick={() => setActiveModule('student-reports')}
                    className="quick-action-btn"
                  >
                    <span className="action-icon">📝</span>
                    <span className="action-text">Respond to Student Reports</span>
                  </button>
                  <button 
                    onClick={() => setActiveModule('reports')}
                    className="quick-action-btn"
                  >
                    <span className="action-icon">📋</span>
                    <span className="action-text">Review Lecture Reports</span>
                  </button>
                  <button 
                    onClick={() => setActiveModule('courses')}
                    className="quick-action-btn"
                  >
                    <span className="action-icon">📚</span>
                    <span className="action-text">View All Courses</span>
                  </button>
                </div>
              </div>
            </div>
          );
      }
    };

    return (
      <div className="principal-dashboard">
        <div className="dashboard-header-modular">
          <div className="header-with-logo">
            <img 
              src="/images/Limkokwing_Lesotho_Logo.png" 
              alt="Limkokwing Lesotho Logo" 
              className="dashboard-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="header-text">
              <h2>Principal Lecturer Portal</h2>
              <p>Welcome, {currentUser?.first_name} {currentUser?.last_name}</p>
            </div>
          </div>
        </div>

        <div className="modules-nav">
          <button
            className={`module-tab ${activeModule === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveModule('dashboard')}
          >
            <span className="module-icon">📊</span>
            <span className="module-name">Dashboard</span>
          </button>
          <button
            className={`module-tab ${activeModule === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveModule('courses')}
          >
            <span className="module-icon">📚</span>
            <span className="module-name">View Courses</span>
          </button>
          <button
            className={`module-tab ${activeModule === 'reporting' ? 'active' : ''}`}
            onClick={() => setActiveModule('reporting')}
          >
            <span className="module-icon">📤</span>
            <span className="module-name">Report to Leader</span>
          </button>
          <button
            className={`module-tab ${activeModule === 'student-reports' ? 'active' : ''}`}
            onClick={() => setActiveModule('student-reports')}
          >
            <span className="module-icon">📝</span>
            <span className="module-name">Student Reports</span>
          </button>
          <button
            className={`module-tab ${activeModule === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveModule('reports')}
          >
            <span className="module-icon">📋</span>
            <span className="module-name">Lecture Reports</span>
          </button>
          <button
            className={`module-tab ${activeModule === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveModule('monitoring')}
          >
            <span className="module-icon">👁️</span>
            <span className="module-name">Monitoring</span>
          </button>
        </div>

        {renderModuleContent()}

        {/* Principal Report Modal */}
        {showReportModal && (
          <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
            <div className="modal large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Submit Report to Program Leader</h3>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="close-btn"
                >
                  ×
                </button>
              </div>
              <div className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Report Type *</label>
                    <select
                      value={reportForm.report_type}
                      onChange={(e) => setReportForm(prev => ({...prev, report_type: e.target.value}))}
                    >
                      <option value="academic_performance">Academic Performance</option>
                      <option value="faculty_development">Faculty Development</option>
                      <option value="curriculum_review">Curriculum Review</option>
                      <option value="student_trends">Student Performance Trends</option>
                      <option value="resource_requirements">Resource Requirements</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Academic Period *</label>
                    <input
                      type="text"
                      value={reportForm.academic_period}
                      onChange={(e) => setReportForm(prev => ({...prev, academic_period: e.target.value}))}
                      placeholder="e.g., 2024/2025 Semester 1"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Executive Summary *</label>
                  <textarea
                    value={reportForm.summary}
                    onChange={(e) => setReportForm(prev => ({...prev, summary: e.target.value}))}
                    rows="3"
                    placeholder="Provide a brief overview of the report..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Key Findings *</label>
                  <textarea
                    value={reportForm.key_findings}
                    onChange={(e) => setReportForm(prev => ({...prev, key_findings: e.target.value}))}
                    rows="4"
                    placeholder="Detail the main findings and observations..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Recommendations *</label>
                  <textarea
                    value={reportForm.recommendations}
                    onChange={(e) => setReportForm(prev => ({...prev, recommendations: e.target.value}))}
                    rows="4"
                    placeholder="Provide specific recommendations for action..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Follow-up Actions (Optional)</label>
                  <textarea
                    value={reportForm.follow_up_actions}
                    onChange={(e) => setReportForm(prev => ({...prev, follow_up_actions: e.target.value}))}
                    rows="3"
                    placeholder="Any planned follow-up actions..."
                  />
                </div>

                <div className="modal-actions">
                  <button 
                    onClick={() => setShowReportModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={submitPrincipalReport}
                    className="btn-primary"
                  >
                    Submit to Program Leader
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Program Leader Dashboard
  const ProgramLeaderDashboard = () => {
    const [programStats, setProgramStats] = useState({
      totalLecturers: 0,
      totalCourses: 0,
      totalClasses: 0,
      pendingReports: 0
    });

    useEffect(() => {
      const fetchProgramData = async () => {
        try {
          setProgramStats({
            totalLecturers: lecturers.length,
            totalCourses: allCourses.length,
            totalClasses: allClasses.length,
            pendingReports: allReports.filter(r => r.status === 'submitted').length
          });
        } catch (error) {
          console.error('Error fetching program data:', error);
        }
      };

      fetchProgramData();
    }, [lecturers, allReports, allCourses, allClasses]);

    const renderModuleContent = () => {
      switch(activeModule) {
        case 'view-courses':
          return (
            <div className="module-content">
              <div className="module-header">
                <h3>All Courses</h3>
                <div className="module-actions">
                  <button 
                    onClick={() => handleExport('courses')}
                    className="btn-export"
                    disabled={exportLoading.courses}
                  >
                    {exportLoading.courses ? '⏳ Exporting...' : '📊 Export Courses'}
                  </button>
                </div>
              </div>
              
              {allCourses.length === 0 ? (
                <div className="empty-state">
                  <p>No courses found.</p>
                </div>
              ) : (
                <div className="courses-list">
                  <div className="table-container">
                    <table className="courses-table">
                      <thead>
                        <tr>
                          <th>Course Code</th>
                          <th>Course Name</th>
                          <th>Faculty</th>
                          <th>Department</th>
                          <th>Credits</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allCourses.map(course => (
                          <tr key={course.id}>
                            <td><strong>{course.course_code}</strong></td>
                            <td>{course.course_name}</td>
                            <td>{course.faculty || 'N/A'}</td>
                            <td>{course.department || 'N/A'}</td>
                            <td>{course.credits || 'N/A'}</td>
                            <td className="course-description">
                              {course.description || 'No description available'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );

        case 'principal-reports':
          return (
            <div className="module-content">
              <div className="module-header">
                <h3>Principal Lecturer Reports</h3>
                <div className="module-actions">
                  <button 
                    onClick={() => handleExport('reports')}
                    className="btn-export"
                    disabled={exportLoading.reports}
                  >
                    {exportLoading.reports ? '⏳ Exporting...' : '📊 Export Reports'}
                  </button>
                </div>
              </div>
              
              {principalReports.length === 0 ? (
                <div className="empty-state">
                  <p>No principal reports available.</p>
                </div>
              ) : (
                <div className="reports-list">
                  {principalReports.map(report => (
                    <div key={report.id} className="report-card">
                      <div className="report-header">
                        <span className="report-type">Principal Report</span>
                        <span className="report-date">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                        <span className={`status-badge ${report.status}`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="report-content">
                        <p><strong>Principal Lecturer:</strong> {report.principal_name}</p>
                        <p><strong>Report Type:</strong> {report.report_type}</p>
                        <p><strong>Academic Period:</strong> {report.academic_period}</p>
                        <p><strong>Summary:</strong> {report.summary}</p>
                        <p><strong>Key Findings:</strong> {report.key_findings}</p>
                        <p><strong>Recommendations:</strong> {report.recommendations}</p>
                        
                        {report.follow_up_actions && (
                          <div className="response-section">
                            <h4>Follow-up Actions:</h4>
                            <p>{report.follow_up_actions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );

        case 'courses':
          return (
            <div className="module-content">
              <div className="module-header">
                <h3>Course Management</h3>
                <p>Create and manage courses for your programs</p>
              </div>
              
              {courseError && (
                <div className="alert alert-error">
                  <strong>Error:</strong> {courseError}
                </div>
              )}
              {courseSuccess && (
                <div className="alert alert-success">
                  <strong>Success:</strong> {courseSuccess}
                </div>
              )}
              
              <div className="course-form-container">
                <form onSubmit={handleCourseSubmit} className="course-form">
                  <div className="course-form-section">
                    <h3>Basic Information</h3>
                    <div className="course-form-row">
                      <div className="course-form-group">
                        <label htmlFor="code">Course Code *</label>
                        <input
                          type="text"
                          id="code"
                          name="code"
                          value={courseFormData.code}
                          onChange={handleCourseInputChange}
                          required
                          placeholder="e.g., CS101"
                        />
                      </div>
                      <div className="course-form-group">
                        <label htmlFor="name">Course Name *</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={courseFormData.name}
                          onChange={handleCourseInputChange}
                          required
                          placeholder="e.g., Introduction to Programming"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="course-form-section">
                    <h3>Faculty & Department</h3>
                    <div className="course-form-row">
                      <div className="course-form-group">
                        <label htmlFor="faculty">Faculty</label>
                        <select
                          id="faculty"
                          name="faculty"
                          value={courseFormData.faculty}
                          onChange={handleCourseInputChange}
                        >
                          <option value="">Select Faculty (Optional)</option>
                          {faculties.map(faculty => (
                            <option key={faculty.id} value={faculty.faculty_name}>
                              {faculty.faculty_name} ({faculty.faculty_code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="course-form-group course-department-loading-container">
                        <label htmlFor="department">Department</label>
                        <select
                          id="department"
                          name="department"
                          value={courseFormData.department}
                          onChange={handleCourseInputChange}
                          disabled={!courseFormData.faculty || isLoadingDepartments}
                        >
                          <option value="">
                            {isLoadingDepartments ? 'Loading departments...' : 
                             courseFormData.faculty ? 'Select Department (Optional)' : 'Select Faculty First'}
                          </option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.department_name}>
                              {dept.department_name}
                            </option>
                          ))}
                        </select>
                        {isLoadingDepartments && <div className="course-department-loading"></div>}
                      </div>
                    </div>
                  </div>

                  <div className="course-form-section">
                    <h3>Course Details</h3>
                    <div className="course-form-row">
                      <div className="course-form-group">
                        <label htmlFor="credits">Credits</label>
                        <input
                          type="number"
                          id="credits"
                          name="credits"
                          value={courseFormData.credits}
                          onChange={handleCourseInputChange}
                          min="1"
                          max="10"
                        />
                      </div>
                    </div>
                    <div className="course-form-group">
                      <label htmlFor="description">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={courseFormData.description}
                        onChange={handleCourseInputChange}
                        rows="4"
                        placeholder="Enter course description, learning objectives, and any other relevant information..."
                      />
                    </div>
                  </div>

                  <div className="course-form-actions">
                    <button 
                      type="submit" 
                      disabled={isCourseLoading}
                      className="course-btn course-btn-primary"
                    >
                      {isCourseLoading ? (
                        <>
                          <span className="course-spinner"></span>
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

        case 'classes':
          return (
            <div className="module-content">
              <div className="module-header">
                <h3>Class Assignment</h3>
                <div className="module-actions">
                  <button 
                    onClick={() => setShowAssignClassModal(true)} 
                    className="btn-primary"
                  >
                    Assign New Class
                  </button>
                  <button 
                    onClick={() => handleExport('classes')}
                    className="btn-export"
                    disabled={exportLoading.classes}
                  >
                    {exportLoading.classes ? '⏳ Exporting...' : '📊 Export Classes'}
                  </button>
                </div>
              </div>
              
              <div className="classes-management">
                <h4>All Classes</h4>
                {allClasses.length === 0 ? (
                  <div className="empty-state">
                    <p>No classes found.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="classes-table">
                      <thead>
                        <tr>
                          <th>Class Name</th>
                          <th>Course</th>
                          <th>Lecturer</th>
                          <th>Assigned By</th>
                          <th>Schedule</th>
                          <th>Venue</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allClasses.map(classItem => (
                          <tr key={classItem.id}>
                            <td>{classItem.name}</td>
                            <td>{classItem.course_name}</td>
                            <td>
                              {classItem.lecturer_name ? (
                                <div className="lecturer-assignment">
                                  <div className="current-lecturer">{classItem.lecturer_name}</div>
                                  <select
                                    value={classItem.lecturer_id || ''}
                                    onChange={(e) => handleReassignClass(classItem.id, e.target.value)}
                                    className="reassign-select"
                                  >
                                    <option value={classItem.lecturer_id}>Keep current</option>
                                    <option value="">Unassign</option>
                                    {lecturers.filter(l => l.id !== classItem.lecturer_id).map(lecturer => (
                                      <option key={lecturer.id} value={lecturer.id}>
                                        {lecturer.first_name} {lecturer.last_name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <select
                                  value=""
                                  onChange={(e) => handleReassignClass(classItem.id, e.target.value)}
                                  className="reassign-select"
                                >
                                  <option value="">Assign Lecturer</option>
                                  {lecturers.map(lecturer => (
                                    <option key={lecturer.id} value={lecturer.id}>
                                      {lecturer.first_name} {lecturer.last_name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td>{classItem.assigned_by_name || 'You'}</td>
                            <td>{classItem.schedule_day} {classItem.schedule_time}</td>
                            <td>{classItem.venue}</td>
                            <td>
                              <button 
                                onClick={() => handleDeleteClass(classItem.id)}
                                className="btn-danger btn-small"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );

        default:
          return (
            <div className="module-content">
              <h3>Program Leader Dashboard</h3>
              <div className="quick-stats">
                <div className="stat-card">
                  <div className="stat-number">{programStats.totalLecturers}</div>
                  <div className="stat-label">Total Lecturers</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{programStats.totalCourses}</div>
                  <div className="stat-label">Courses Offered</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{programStats.totalClasses}</div>
                  <div className="stat-label">Active Classes</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{principalReports.length}</div>
                  <div className="stat-label">Principal Reports</div>
                </div>
              </div>
              
              <div className="export-options">
                <h4>Data Export</h4>
                <div className="export-buttons">
                  <button 
                    onClick={() => handleExport('courses')}
                    className="btn-export"
                    disabled={exportLoading.courses}
                  >
                    {exportLoading.courses ? '⏳ Exporting...' : '📚 Export Courses'}
                  </button>
                  <button 
                    onClick={() => handleExport('classes')}
                    className="btn-export"
                    disabled={exportLoading.classes}
                  >
                    {exportLoading.classes ? '⏳ Exporting...' : '🏫 Export Classes'}
                  </button>
                  <button 
                    onClick={() => handleExport('reports')}
                    className="btn-export"
                    disabled={exportLoading.reports}
                  >
                    {exportLoading.reports ? '⏳ Exporting...' : '📋 Export Reports'}
                  </button>
                  <button 
                    onClick={() => handleExport('users')}
                    className="btn-export"
                    disabled={exportLoading.users}
                  >
                    {exportLoading.users ? '⏳ Exporting...' : '👥 Export Users'}
                  </button>
                  <button 
                    onClick={() => handleExport('all')}
                    className="btn-export"
                    disabled={exportLoading.all}
                  >
                    {exportLoading.all ? '⏳ Exporting...' : '📊 Export All Data'}
                  </button>
                </div>
              </div>

              <div className="recent-activity">
                <h4>Recent Principal Reports</h4>
                {principalReports.length === 0 ? (
                  <div className="empty-state">
                    <p>No principal reports received yet.</p>
                  </div>
                ) : (
                  <div className="reports-preview">
                    {principalReports.slice(0, 3).map(report => (
                      <div key={report.id} className="report-preview-card">
                        <h5>{report.report_type} - {report.academic_period}</h5>
                        <p>{report.summary.substring(0, 100)}...</p>
                        <span className="report-date">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                <button 
                  onClick={() => setActiveModule('principal-reports')}
                  className="btn-primary"
                >
                  View All Principal Reports
                </button>
              </div>

              <div className="program-overview">
                <h4>Program Overview</h4>
                <div className="program-summary">
                  <p><strong>Unassigned Classes:</strong> {allClasses.filter(cls => !cls.lecturer_id).length}</p>
                  <p><strong>Lecturers with Maximum Load:</strong> {
                    lecturers.filter(lecturer => 
                      allClasses.filter(cls => cls.lecturer_id === lecturer.id).length >= 3
                    ).length
                  }</p>
                  <button 
                    onClick={() => setActiveModule('view-courses')}
                    className="btn-primary"
                  >
                    View All Courses
                  </button>
                  <button 
                    onClick={() => setActiveModule('classes')}
                    className="btn-primary"
                  >
                    Manage Class Assignments
                  </button>
                </div>
              </div>
            </div>
          );
      }
    };

    return (
      <div className="program-leader-dashboard">
        <div className="dashboard-header-modular">
          <div className="header-with-logo">
            <img 
              src="/images/Limkokwing_Lesotho_Logo.png" 
              alt="Limkokwing Lesotho Logo" 
              className="dashboard-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="header-text">
              <h2>Program Leader Portal</h2>
              <p>Welcome, {currentUser.first_name} {currentUser.last_name}</p>
            </div>
          </div>
        </div>

        <div className="modules-nav">
          <button
            className={`module-tab ${activeModule === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveModule('dashboard')}
          >
            <span className="module-icon">📊</span>
            <span className="module-name">Dashboard</span>
          </button>
          <button
            className={`module-tab ${activeModule === 'view-courses' ? 'active' : ''}`}
            onClick={() => setActiveModule('view-courses')}
          >
            <span className="module-icon">📚</span>
            <span className="module-name">View Courses</span>
          </button>
          <button
            className={`module-tab ${activeModule === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveModule('courses')}
          >
            <span className="module-icon">➕</span>
            <span className="module-name">Add Course</span>
          </button>
          <button
            className={`module-tab ${activeModule === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveModule('classes')}
          >
            <span className="module-icon">🏫</span>
            <span className="module-name">Class Assignment</span>
          </button>
          <button
            className={`module-tab ${activeModule === 'principal-reports' ? 'active' : ''}`}
            onClick={() => setActiveModule('principal-reports')}
          >
            <span className="module-icon">📋</span>
            <span className="module-name">Principal Reports</span>
          </button>
        </div>

        {renderModuleContent()}
      </div>
    );
  };

  // Faculty Manager Dashboard
  const FacultyManagerDashboard = () => {
    const [facultyStats, setFacultyStats] = useState({
      totalLecturers: 0,
      totalPrograms: 0,
      totalCourses: 0,
      pendingApprovals: 0
    });

    useEffect(() => {
      const fetchFacultyData = async () => {
        try {
          setFacultyStats({
            totalLecturers: lecturers.length,
            totalPrograms: 8,
            totalCourses: allCourses.length,
            pendingApprovals: allReports.filter(r => r.status === 'submitted').length
          });
        } catch (error) {
          console.error('Error fetching faculty data:', error);
        }
      };

      fetchFacultyData();
    }, [lecturers, allReports, allCourses]);

    const renderModuleContent = () => {
      switch(activeModule) {
        case 'faculty':
          return (
            <div className="module-content">
              <div className="module-header">
                <h3>Faculty Management</h3>
                <div className="module-actions">
                  <button 
                    onClick={() => handleExport('users')}
                    className="btn-export"
                    disabled={exportLoading.users}
                  >
                    {exportLoading.users ? '⏳ Exporting...' : '📊 Export Users'}
                  </button>
                  <button 
                    onClick={() => handleExport('all')}
                    className="btn-export"
                    disabled={exportLoading.all}
                  >
                    {exportLoading.all ? '⏳ Exporting...' : '📊 Export All Data'}
                  </button>
                </div>
              </div>
              
              <div className="faculty-list">
                <h4>Faculty Members</h4>
                {lecturers.length === 0 ? (
                  <div className="empty-state">
                    <p>No faculty members found.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="faculty-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Assigned Classes</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lecturers.map(lecturer => {
                          const assignedClasses = allClasses.filter(cls => cls.lecturer_id === lecturer.id);
                          return (
                            <tr key={lecturer.id}>
                              <td>{lecturer.first_name} {lecturer.last_name}</td>
                              <td>{lecturer.email}</td>
                              <td>{lecturer.department || 'Not assigned'}</td>
                              <td>
                                {assignedClasses.length > 0 ? (
                                  <span className="class-count">{assignedClasses.length} classes</span>
                                ) : (
                                  <span className="no-classes">No classes assigned</span>
                                )}
                              </td>
                              <td>
                                <span className="status-badge active">Active</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );

        default:
          return (
            <div className="module-content">
              <h3>Faculty Manager Dashboard</h3>
              <div className="quick-stats">
                <div className="stat-card">
                  <div className="stat-number">{facultyStats.totalLecturers}</div>
                  <div className="stat-label">Total Lecturers</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{facultyStats.totalPrograms}</div>
                  <div className="stat-label">Active Programs</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{facultyStats.totalCourses}</div>
                  <div className="stat-label">Courses Offered</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{allClasses.length}</div>
                  <div className="stat-label">Active Classes</div>
                </div>
              </div>
              
              <div className="export-options">
                <h4>Data Export</h4>
                <div className="export-buttons">
                  <button 
                    onClick={() => handleExport('users')}
                    className="btn-export"
                    disabled={exportLoading.users}
                  >
                    {exportLoading.users ? '⏳ Exporting...' : '👥 Export Users'}
                  </button>
                  <button 
                    onClick={() => handleExport('courses')}
                    className="btn-export"
                    disabled={exportLoading.courses}
                  >
                    {exportLoading.courses ? '⏳ Exporting...' : '📚 Export Courses'}
                  </button>
                  <button 
                    onClick={() => handleExport('classes')}
                    className="btn-export"
                    disabled={exportLoading.classes}
                  >
                    {exportLoading.classes ? '⏳ Exporting...' : '🏫 Export Classes'}
                  </button>
                  <button 
                    onClick={() => handleExport('all')}
                    className="btn-export"
                    disabled={exportLoading.all}
                  >
                    {exportLoading.all ? '⏳ Exporting...' : '📊 Export All Data'}
                  </button>
                </div>
              </div>

              <div className="recent-activity">
                <h4>Faculty Overview</h4>
                <div className="faculty-summary">
                  <p>As Faculty Manager, you oversee faculty operations and strategic planning.</p>
                  <p>Course management and class assignment are now handled by Program Leaders.</p>
                </div>
              </div>
            </div>
          );
      }
    };

    return (
      <div className="faculty-manager-dashboard">
        <div className="dashboard-header-modular">
          <div className="header-with-logo">
            <img 
              src="/images/Limkokwing_Lesotho_Logo.png" 
              alt="Limkokwing Lesotho Logo" 
              className="dashboard-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="header-text">
              <h2>Faculty Manager Portal</h2>
              <p>Welcome, {currentUser.first_name} {currentUser.last_name}</p>
            </div>
          </div>
        </div>

        <div className="modules-nav">
          <button
            className={`module-tab ${activeModule === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveModule('dashboard')}
          >
            <span className="module-icon">📊</span>
            <span className="module-name">Dashboard</span>
          </button>
          <button
            className={`module-tab ${activeModule === 'faculty' ? 'active' : ''}`}
            onClick={() => setActiveModule('faculty')}
          >
            <span className="module-icon">👥</span>
            <span className="module-name">Faculty Management</span>
          </button>
        </div>

        {renderModuleContent()}
      </div>
    );
  };

  return (
    <div className="role-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-with-logo">
            <img 
              src="/images/Limkokwing_Lesotho_Logo.png" 
              alt="Limkokwing Lesotho Logo" 
              className="main-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="header-text">
              <h1>Limkokwing University of Creative Technology</h1>
              <p className="subtitle">Lesotho Campus - Management System</p>
            </div>
          </div>
          <div className="user-info">
            <span>Welcome, {currentUser?.first_name} {currentUser?.last_name}</span>
            <span className="user-role">{currentUser?.role?.replace('_', ' ')}</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>

        {currentUser.role === 'student' && <StudentDashboard />}
        {currentUser.role === 'lecturer' && <LecturerDashboard />}
        {currentUser.role === 'principal_lecturer' && <PrincipalDashboard />}
        {currentUser.role === 'program_leader' && <ProgramLeaderDashboard />}
        {currentUser.role === 'faculty_manager' && <FacultyManagerDashboard />}
      </div>

      {/* Assign Class Modal */}
      {showAssignClassModal && (
        <div className="modal-overlay" onClick={() => setShowAssignClassModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign New Class</h3>
              <button 
                onClick={() => setShowAssignClassModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAssignClass} className="modal-form">
              <div className="form-group">
                <label>Class Name *</label>
                <input
                  type="text"
                  name="name"
                  value={newClassForm.name}
                  onChange={handleFormChange}
                  placeholder="e.g., CS101 Group A"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Course *</label>
                  <select
                    name="course_id"
                    value={newClassForm.course_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Course</option>
                    {allCourses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Lecturer *</label>
                  <select
                    name="lecturer_id"
                    value={newClassForm.lecturer_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Lecturer</option>
                    {lecturers.map(lecturer => (
                      <option key={lecturer.id} value={lecturer.id}>
                        {lecturer.first_name} {lecturer.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Schedule Day *</label>
                  <select
                    name="schedule_day"
                    value={newClassForm.schedule_day}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Schedule Time *</label>
                  <input
                    type="time"
                    name="schedule_time"
                    value={newClassForm.schedule_time}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Venue *</label>
                  <input
                    type="text"
                    name="venue"
                    value={newClassForm.venue}
                    onChange={handleFormChange}
                    placeholder="e.g., Lecture Hall A"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Academic Year *</label>
                  <input
                    type="text"
                    name="academic_year"
                    value={newClassForm.academic_year}
                    onChange={handleFormChange}
                    placeholder="e.g., 2024/2025"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Semester *</label>
                <select
                  name="semester"
                  value={newClassForm.semester}
                  onChange={handleFormChange}
                  required
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Summer School">Summer School</option>
                </select>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowAssignClassModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Assign Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleDashboard;