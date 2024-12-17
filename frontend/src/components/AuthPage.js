import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from './AuthForm';
import './AuthPage.css'

const AuthPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null); // Reset previous errors
  
    try {
      const apiUrl = isRegister ? '/api/register' : '/api/login';  // Determine the endpoint

      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
  
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,  // Add CSRF token in the headers
        },
        body: JSON.stringify(data),
      });
  
      const responseText = await response.text();
      console.log('Response Text:', responseText);
  
      try {
        const result = JSON.parse(responseText); // Attempt to parse the response
        if (response.ok) {
          if (!isRegister) {
            localStorage.setItem('jwt', result.jwt);
            alert('Login successful!');
            navigate('/home');  // Redirect to home page after login
          } else {
            alert('Registration successful!');
            setIsRegister(false);  // Switch to login form
          }
        } else {
          throw new Error(result.detail || 'An error occurred');
        }
      } catch (err) {
        console.error('Error parsing JSON:', err);
        setError('Failed to parse response from server');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);  // Handle errors
    } finally {
      setLoading(false);  // Reset loading state
    }
  };

  const toggleForm = () => {
    setIsRegister(!isRegister); // Toggle between login and register
  };

  return (
    <div className="center">
      <AuthForm
        isRegister={isRegister}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        toggleForm={toggleForm}
      />
    </div>
  );
};

export default AuthPage;
