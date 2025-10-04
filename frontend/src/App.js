import React, { useState, useEffect } from 'react';
import RoleDashboard from './components/RoleDashboard';
import LoginSystem from './components/LoginSystem';
import Register from './components/Register';
import LecturerReportingForm from './components/LecturerReportingForm';
import StudentReportForm from './components/StudentReportForm';
import CourseManagement from './components/CourseManagement';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

// Footer Component
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Limkokwing University of Creative Technology</h4>
          
          </div>
          
          <div className="footer-section">
            <h5>Quick Links</h5>
            <ul className="footer-links">
              <li><a href="#about">About System</a></li>
              <li><a href="#help">Help & Support</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h5>Contact Info</h5>
            <div className="contact-info">
              <p>Phone: +266 56794745</p>
             
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="copyright">
            &copy; {currentYear} Limkokwing University of Creative Technology Lesotho. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user was already logged in on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedLoginStatus = localStorage.getItem('isLoggedIn');
    
    if (savedUser && savedLoginStatus === 'true') {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
        setCurrentView('dashboard');
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
      }
    }
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setCurrentView('login');
    setError('');
  };

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
    
    setCurrentView('dashboard');
    setError('');
  };

  const handleNavigateToRegister = () => {
    setCurrentView('register');
    setError('');
  };

  const handleNavigateToLogin = () => {
    setCurrentView('login');
    setError('');
  };

  const handleNavigateToReporting = () => {
    setCurrentView('reporting-form');
    setError('');
  };

  const handleNavigateToStudentReport = () => {
    setCurrentView('student-report');
    setError('');
  };

  const handleNavigateToDashboard = () => {
    setCurrentView('dashboard');
    setError('');
  };

  const handleNavigateToCourseManagement = () => {
    setCurrentView('course-management');
    setError('');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedRole(null);
    setCurrentUser(null);
    setReports([]);
    setLecturers([]);
    setClasses([]);
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    setCurrentView('dashboard');
    setError('');
  };

  // Handle registration success
  const handleRegistrationSuccess = (userData) => {
    console.log('Registration successful:', userData);
    
    // Show success message and redirect to login
    alert(`Registration successful! You can now login as ${userData.user.role}. Use your auto-generated password to login.`);
    
    // Redirect to login page
    handleNavigateToLogin();
  };

  const fetchClasses = async () => {
    try {
      console.log('🔄 Fetching all classes...');
      const response = await fetch(`${API_BASE_URL}/classes`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Classes fetch error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const classesData = await response.json();
      console.log(`✅ Found ${classesData.length} classes`);
      setClasses(classesData);
      return classesData;
    } catch (error) {
      console.error('❌ Error fetching classes:', error);
      setError(`Failed to load classes: ${error.message}`);
      throw error;
    }
  };

  const fetchLecturerClasses = async (lecturerId) => {
    try {
      console.log(`🔄 Fetching classes for lecturer: ${lecturerId}`);
      const response = await fetch(`${API_BASE_URL}/classes/lecturer/${lecturerId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Lecturer classes fetch error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const lecturerClasses = await response.json();
      console.log(`✅ Found ${lecturerClasses.length} classes for lecturer ${lecturerId}`);
      return lecturerClasses;
    } catch (error) {
      console.error('❌ Error fetching lecturer classes:', error);
      setError(`Failed to load lecturer classes: ${error.message}`);
      throw error;
    }
  };

  const fetchLecturers = async () => {
    try {
      console.log('🔄 Fetching lecturers...');
      const response = await fetch(`${API_BASE_URL}/users`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Lecturers fetch error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const users = await response.json();
      const lecturerUsers = users.filter(user => user.role === 'lecturer');
      console.log(`✅ Found ${lecturerUsers.length} lecturers`);
      setLecturers(lecturerUsers);
      return lecturerUsers;
    } catch (error) {
      console.error('❌ Error fetching lecturers:', error);
      setError(`Failed to load lecturers: ${error.message}`);
      throw error;
    }
  };

  const fetchReports = async () => {
    try {
      console.log('🔄 Fetching reports...');
      const response = await fetch(`${API_BASE_URL}/reports`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Reports fetch error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reportsData = await response.json();
      console.log(`✅ Found ${reportsData.length} reports`);
      setReports(reportsData);
      return reportsData;
    } catch (error) {
      console.error('❌ Error fetching reports:', error);
      setError(`Failed to load reports: ${error.message}`);
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (isLoggedIn && currentUser) {
        try {
          setIsLoading(true);
          console.log('🚀 Starting data fetch for user:', currentUser.id);
          
          await fetchLecturers();
          await fetchReports();
          
          if (currentUser.role === 'program_leader' || currentUser.role === 'faculty_manager') {
            await fetchClasses();
          }
          
          console.log('✅ All data loaded successfully');
        } catch (error) {
          console.error('❌ Error fetching data:', error);
          setError('Error loading application data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [isLoggedIn, currentUser]);

  const handleStudentReport = async (reportData) => {
    try {
      setIsLoading(true);
      setError('');

      console.log('📝 Submitting student report:', reportData);

      const response = await fetch(`${API_BASE_URL}/student-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        const newReport = await response.json();
        setReports(prev => [...prev, newReport]);
        alert('Report submitted to Principal Lecturer successfully!');
        setCurrentView('dashboard');
        await fetchReports();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('❌ Error submitting student report:', error);
      setError(error.message || 'Error submitting report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLecturerReport = async (reportData) => {
    try {
      setIsLoading(true);
      setError('');

      console.log('📝 Submitting lecturer report:', reportData);

      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        const newReport = await response.json();
        setReports(prev => [...prev, newReport]);
        alert('Lecture report submitted successfully!');
        setCurrentView('dashboard');
        await fetchReports();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('❌ Error submitting lecturer report:', error);
      setError(error.message || 'Error submitting report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrincipalResponse = async (reportId, response) => {
    try {
      setIsLoading(true);
      setError('');

      console.log(`💬 Principal responding to report: ${reportId}`);

      const responseData = {
        principal_response: response,
        status: 'reviewed',
        reviewed_at: new Date().toISOString()
      };

      const updateResponse = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData)
      });

      if (updateResponse.ok) {
        const updatedReport = await updateResponse.json();
        setReports(prev => prev.map(report => 
          report.id === reportId ? updatedReport : report
        ));
        alert('Response recorded successfully!');
      } else {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }
    } catch (error) {
      console.error('❌ Error submitting principal response:', error);
      setError(error.message || 'Error submitting response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaderResponse = async (reportId, response) => {
    try {
      setIsLoading(true);
      setError('');

      console.log(`💬 Leader responding to report: ${reportId}`);

      const responseData = {
        leader_response: response,
        status: 'addressed',
        addressed_at: new Date().toISOString()
      };

      const updateResponse = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData)
      });

      if (updateResponse.ok) {
        const updatedReport = await updateResponse.json();
        setReports(prev => prev.map(report => 
          report.id === reportId ? updatedReport : report
        ));
        alert('Response sent to Principal Lecturer!');
      } else {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }
    } catch (error) {
      console.error('❌ Error submitting leader response:', error);
      setError(error.message || 'Error submitting response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const testApiEndpoints = async () => {
    try {
      console.log('🧪 Testing API endpoints...');
      
      const classesResponse = await fetch(`${API_BASE_URL}/classes`);
      console.log('Classes endpoint:', classesResponse.status, classesResponse.statusText);
      
      const lecturerClassesResponse = await fetch(`${API_BASE_URL}/classes/lecturer/1`);
      console.log('Lecturer classes endpoint:', lecturerClassesResponse.status, lecturerClassesResponse.statusText);
      
      if (lecturerClassesResponse.ok) {
        const data = await lecturerClassesResponse.json();
        console.log('Lecturer classes data:', data);
      }
      
    } catch (error) {
      console.error('❌ API test failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading application data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      {process.env.NODE_ENV === 'development' && isLoggedIn && (
        <div className="debug-panel">
          {/* Debug panel content */}
        </div>
      )}

      {/* Header with Logo */}
      <header className="app-header">
        <div className="header-container">
          <div className="header-logo-section">
            <img 
              src="/images/logo.JPG" 
              alt="Limkokwing Lesotho Logo" 
              className="header-logo"
              onError={(e) => {
                console.log('Header logo failed to load');
                e.target.style.display = 'none';
              }}
              onLoad={() => console.log('Header logo loaded successfully')}
            />
            <div className="header-text">
              <h1>Limkokwing University of Creative Technology</h1>
              <p className="header-subtitle">Lesotho Campus - Faculty Reporting System</p>
            </div>
          </div>
          
          {isLoggedIn && currentUser && (
            <div className="header-user-info">
              <span className="welcome-text">
                Welcome, {currentUser.first_name} {currentUser.last_name}
              </span>
              <span className="user-role">({currentUser.role?.replace('_', ' ')})</span>
              {currentUser.role === 'faculty_manager' && (
                <button 
                  className="nav-link-btn"
                  onClick={handleNavigateToCourseManagement}
                >
                  Manage Courses
                </button>
              )}
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation for logged-in users */}
      {isLoggedIn && currentUser && (
        <nav className="app-navbar">
          <div className="nav-container">
            <div className="nav-links">
              <button 
                className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={handleNavigateToDashboard}
              >
                Dashboard
              </button>
              {currentUser.role === 'lecturer' && (
                <button 
                  className={`nav-link ${currentView === 'reporting-form' ? 'active' : ''}`}
                  onClick={handleNavigateToReporting}
                >
                  Submit Report
                </button>
              )}
              {currentUser.role === 'student' && (
                <button 
                  className={`nav-link ${currentView === 'student-report' ? 'active' : ''}`}
                  onClick={handleNavigateToStudentReport}
                >
                  Report Issue
                </button>
              )}
            </div>
          </div>
        </nav>
      )}
      
      <main className="main-content">
        {currentView === 'dashboard' && (
          <RoleDashboard 
            onRoleSelect={handleRoleSelect}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigateToReporting={handleNavigateToReporting}
            onNavigateToStudentReport={handleNavigateToStudentReport}
            onNavigateToCourseManagement={handleNavigateToCourseManagement}
            reports={reports}
            onPrincipalResponse={handlePrincipalResponse}
            onLeaderResponse={handleLeaderResponse}
            lecturers={lecturers}
            classes={classes}
            fetchClasses={fetchClasses}
            fetchLecturerClasses={fetchLecturerClasses}
          />
        )}
        
        {currentView === 'login' && (
          <LoginSystem 
            selectedRole={selectedRole}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={handleNavigateToRegister}
            onBackToDashboard={handleNavigateToDashboard}
          />
        )}
        
        {currentView === 'register' && (
          <Register 
            selectedRole={selectedRole}
            onRegisterSuccess={handleRegistrationSuccess}
            onNavigateToLogin={handleNavigateToLogin}
            onBackToDashboard={handleNavigateToDashboard}
          />
        )}
        
        {currentView === 'reporting-form' && currentUser && (
          <LecturerReportingForm 
            currentUser={currentUser}
            onBackToDashboard={handleNavigateToDashboard}
            onSubmitReport={handleLecturerReport}
            fetchLecturerClasses={fetchLecturerClasses}
          />
        )}
        
        {currentView === 'student-report' && currentUser && (
          <StudentReportForm 
            currentUser={currentUser}
            onBackToDashboard={handleNavigateToDashboard}
            onSubmitReport={handleStudentReport}
            lecturers={lecturers}
          />
        )}
        
        {currentView === 'course-management' && currentUser && (
          <div className="course-management-container">
            <div className="course-management-header">
              <button 
                onClick={handleNavigateToDashboard}
                className="back-btn"
              >
                ← Back to Dashboard
              </button>
              <h1>Course Management</h1>
            </div>
            <CourseManagement />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;