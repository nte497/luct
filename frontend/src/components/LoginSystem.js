import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

const LoginSystem = ({ selectedRole, onLoginSuccess, onNavigateToRegister, onBackToDashboard }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // First, get all users to find matching username
      const usersResponse = await fetch(`${API_BASE_URL}/users`);
      
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const allUsers = await usersResponse.json();
      
      // Find user by username (first_name + last_name)
      const user = allUsers.find(u => {
        const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
        return fullName === username.toLowerCase() && u.role === selectedRole.id;
      });
      
      if (!user) {
        setError(`No ${selectedRole.title} found with that name`);
        return;
      }
      
      // Check password - compare with stored password AND expected password pattern
      const expectedPassword = selectedRole.id === 'faculty_manager' ? 'manager123' : `${selectedRole.id}123`;
      
      if (user.password !== password && password !== expectedPassword) {
        setError('Invalid password');
        return;
      }
      
      // Login successful
      onLoginSuccess(user);
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check if server is running');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo credentials for testing - ADDED FACULTY MANAGER
  const demoCredentials = {
    student: { username: 'Test Student', password: 'student123' },
    lecturer: { username: 'Test Lecturer', password: 'lecturer123' },
    principal_lecturer: { username: 'Test Principal', password: 'principal_lecturer123' },
    program_leader: { username: 'Test Leader', password: 'program_leader123' },
    faculty_manager: { username: 'Test Manager', password: 'manager123' } // ADDED THIS LINE
  };

  const fillDemoCredentials = () => {
    const demo = demoCredentials[selectedRole.id];
    if (demo) {
      setUsername(demo.username);
      setPassword(demo.password);
    }
  };

  const getPasswordHint = () => {
    switch(selectedRole.id) {
      case 'student': return 'student123';
      case 'lecturer': return 'lecturer123';
      case 'principal_lecturer': return 'principal_lecturer123';
      case 'program_leader': return 'program_leader123';
      case 'faculty_manager': return 'manager123'; // CORRECTED THIS LINE
      default: return 'role123';
    }
  };

  return (
    <div className="role-dashboard">
      <div className="login-container">
        <button onClick={onBackToDashboard} className="back-btn">← Back to Roles</button>
        
        <h1>Login as {selectedRole.title}</h1>
        <p className="login-instruction">Use your full name as username</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Full Name (Username)</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder={`Enter your full name (e.g., John Doe)`}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={`Enter ${selectedRole.title} password`}
            />
            <small className="password-hint">Hint: {getPasswordHint()}</small>
          </div>
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>

        </form>
        
        <div className="demo-accounts">
          <h3>Demo Credentials for {selectedRole.title}:</h3>
          <ul>
            <li><strong>Username:</strong> {demoCredentials[selectedRole.id]?.username || 'Test ' + selectedRole.title}</li>
            <li><strong>Password:</strong> {demoCredentials[selectedRole.id]?.password || getPasswordHint()}</li>
          </ul>
        </div>

        <div className="register-link">
          <p>Don't have an account? 
            <button type="button" onClick={onNavigateToRegister} className="link-btn">
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSystem;