import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { Card, Typography, Grid, Box, Avatar, AppBar, Toolbar, Button, IconButton } from '@mui/material'; 
import { People as PeopleIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material'; 

const HomePage = () => {
  const [userProfile, setUserProfile] = useState({}); // Initialize with an empty object
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState([]);
  const navigate = useNavigate();

  const getCSRFToken = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
  };

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt'); // Fetch JWT token from localStorage
  
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
  
      const csrfToken = getCSRFToken();
  
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

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt');
      const csrfToken = getCSRFToken();

      const response = await fetch('/api/notes/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch notes.');
      const data = await response.json();
      setNotes(data); // Store notes in state
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnmarkNote = async (noteId) => {
    try {
      const token = localStorage.getItem('jwt');
      const csrfToken = getCSRFToken();

      const response = await fetch(`/api/note/${noteId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to unmark note.');
      setNotes(notes.filter(note => note.id !== noteId)); // Remove note from state
    } catch (err) {
      setError(err.message);
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
    fetchUserData();
    fetchNotes(); 
  }, []); 


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
            <Button component={Link} to="/home" color="inherit">Home</Button>
            <Button onClick={handleLogout} color="inherit">Logout</Button>
          </Box>
        </Toolbar>
      </AppBar>

       {/* User Notes */}
       <Box sx={{ padding: 4, color: 'white' }}>
        <Typography variant="h5" gutterBottom>My Notes</Typography>
        {notes.length > 0 ? (
          <Grid container spacing={2}>
            {notes.map((note) => (
              <Grid item xs={12} sm={6} md={4} key={note.id}>
                <Card sx={{ padding: 2, backgroundColor: '#3c4856' }}>
                  <Typography variant="body1">{note.message?.content || 'No content'}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton onClick={() => handleUnmarkNote(note.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography>No notes available.</Typography>
        )}
      </Box>

      {/* Footer */}
      <Box width={'100vw'} sx={{textAlign: 'center', backgroundColor: '#252525' }}>
        <Typography variant="body2" style={{ padding: '16px 0' }}>
          &copy; 2024 AI TextBook Query System. Created by Corleone II
        </Typography>
      </Box>
    </Box>
  );
};

export default HomePage;
