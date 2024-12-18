import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { Card, Typography, Grid, Box, AppBar, Toolbar, Button, IconButton, TextField } from '@mui/material'; 
import { Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import AppBarComponent from './AppBarComponent';
import FooterComponent from './FooterComponent';

const HomePage = () => {
  const [userProfile, setUserProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState([]);
  const [editNoteId, setEditNoteId] = useState(null);
  const [editedNoteContent, setEditedNoteContent] = useState('');
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
      const token = localStorage.getItem('jwt'); 
  
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
  
      const csrfToken = getCSRFToken();
  
      const response = await fetch('/api/get-user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      setUserProfile(data);
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
      setNotes(data);
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
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditNote = async (noteId, newContent) => {
    try {
      const token = localStorage.getItem('jwt');
      const csrfToken = getCSRFToken();

      const response = await fetch(`/api/note/${noteId}/edit/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRFToken': csrfToken,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: newContent }),
      });

      if (response.ok) {
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note.id === noteId ? { ...note, message: { ...note.message, content: newContent } } : note
          )
        );
        setEditNoteId(null);
        setEditedNoteContent('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to edit note.');
      }
    } catch (err) {
      setError('Error editing note: ' + err.message);
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

      localStorage.removeItem('jwt');
      document.cookie = 'jwt=; Max-Age=-1; path=/';

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
      <AppBarComponent handleLogout={handleLogout} />

      <Box sx={{ paddingTop: '32px', paddingBottom: '32px', color: 'white', width: '100%' }}>
        <Typography variant="h5" gutterBottom sx={{ paddingLeft: '16px' }}>My Notes</Typography>
        {notes.length > 0 ? (
          <Box
            sx={{
              maxHeight: 'calc(100vh - 200px)', // Adjust height to leave space for header and footer
              overflowY: 'auto', // Enable scrolling for the notes section
              padding: '16px',
            }}
          >
            <Grid container spacing={2}>
              {notes.map((note) => (
                <Grid item xs={12} sm={6} md={4} key={note.id}>
                  <Card sx={{ padding: 2, backgroundColor: '#3c4856' }}>
                    {editNoteId === note.id ? (
                      <TextField
                        fullWidth
                        multiline
                        value={editedNoteContent}
                        onChange={(e) => setEditedNoteContent(e.target.value)}
                        placeholder="Edit your note"
                        variant="outlined"
                        sx={{ marginBottom: 2, backgroundColor: '#ffffff' }}
                      />
                    ) : (
                      <Typography variant="body1">{note.message?.content || 'No content'}</Typography>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      {editNoteId === note.id ? (
                        <IconButton onClick={() => handleEditNote(note.id, editedNoteContent)} color="primary">
                          <SaveIcon />
                        </IconButton>
                      ) : (
                        <IconButton onClick={() => { setEditNoteId(note.id); setEditedNoteContent(note.message.content); }} color="primary">
                          <EditIcon />
                        </IconButton>
                      )}
                      <IconButton onClick={() => handleUnmarkNote(note.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Typography>No notes available.</Typography>
        )}
      </Box>

      <FooterComponent />
    </Box>
  );
};

export default HomePage;
