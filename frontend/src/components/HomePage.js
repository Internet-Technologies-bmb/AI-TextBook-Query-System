import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { Card, Typography, Grid, Box, Avatar, AppBar, Toolbar, Button } from '@mui/material'; 
import { People as PeopleIcon } from '@mui/icons-material'; 

const HomePage = () => {
  const [userProfile, setUserProfile] = useState({}); // Initialize with an empty object
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // Declare isEditing state
  const navigate = useNavigate();

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt'); // Fetch JWT token from localStorage
  
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
  
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1]; // Fetch CSRF token from cookie if applicable
  
      const response = await fetch('/api/get-user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,  // Make sure the token is included here
          'X-CSRFToken': csrfToken, // Include CSRF token if required
        },
        credentials: 'include', // Include cookies if required
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      setUserProfile(data); // Set the user profile data to state
    } catch (err) {
      setError('Failed to fetch user data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  

  const handleLogout = async () => {
    try {
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Clear JWT token from localStorage and cookies
      localStorage.removeItem('jwt');
      document.cookie = 'jwt=; Max-Age=-1; path=/'; // Delete JWT cookie

      setUserProfile({});
      setError(null);

      alert('You have been logged out!');
      navigate('/');
    } catch (err) {
      setError('Logout failed: ' + err.message);
    }
  };

  useEffect(() => {
    fetchUserData(); // Fetch user data when component mounts
  }, []); 

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  if (loading) {
    return <div>Loading...</div>; 
  }

  if (error) {
    return <div>{error}</div>; 
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'flex-start', 
      alignItems: 'center', 
      minHeight: '100vh', 
      width: '100%',
      overflowY: 'auto',
      background: '#2a3442'
    }}>
      {/* Navbar */}
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between', backgroundColor: '#252525'}}>
          <Typography variant="h6">AI TextBook Query System</Typography>
          <Box>
            <Button component={Link} to="/" color="inherit">Home</Button>
            <Button onClick={handleLogout} color="inherit">Logout</Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Footer */}
      <Box width={'100vw'} sx={{textAlign: 'center', backgroundColor: '#252525' }}>
        <Typography variant="body2" color="textSecondary" style={{ padding: '16px 0' }}>
          &copy; 2024 AI TextBook Query System. Created by Corleone II
        </Typography>
      </Box>
    </Box>
  );
};

export default HomePage;
