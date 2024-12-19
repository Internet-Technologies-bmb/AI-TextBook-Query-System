import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { Box, Typography, List, ListItem, ListItemButton, TextField, Button, Divider, IconButton, Alert } from '@mui/material';
import { AttachFile as AttachFileIcon, Send as SendIcon, StarBorder as StarBorderIcon,  Delete as DeleteIcon } from '@mui/icons-material';
import AppBarComponent from './AppBarComponent';

const CreateChatAndMessage = () => {
  const [userProfile, setUserProfile] = useState({});
  const [title, setTitle] = useState('');
  const [chats, setChats] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [error, setError] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const pollingInterval = useRef(null);
  const navigate = useNavigate();

  // Fetch CSRF token
  const getCSRFToken = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
  };

  // Fetch all chats
  const fetchChats = async () => {
    const token = localStorage.getItem('jwt');
    const csrfToken = getCSRFToken();

    if (!token) {
      setErrorMessage('No authentication token found.');
      return;
    }

    try {
      const response = await fetch('/api/get-all-chats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch chats.');

      const data = await response.json();
      setChats(data);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to fetch chats.');
    }
  };

  const handleDeleteChat = async (chatId) => {
    const token = localStorage.getItem('jwt');
    const csrfToken = getCSRFToken();

    try {
      const response = await fetch(`/api/delete-chat/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete chat.');
      }

      // Update the chat list after deletion
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
      if (chatId === chatId) {
        setChatId(null);
        setChatMessages([]);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Error deleting chat.');
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

  // Fetch messages for a selected chat
  const fetchChatMessages = async (chatId, forceUpdate = false) => {
    if (!chatId) return;

    if (forceUpdate || chatId !== chatId) {
      const token = localStorage.getItem('jwt');
      const csrfToken = getCSRFToken();

      try {
        const response = await fetch(`/api/chat/${chatId}/messages`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch chat messages.');

        const data = await response.json();
        setChatMessages(data.messages || []);
      } catch (error) {
        setErrorMessage(error.message || 'Failed to fetch chat messages.');
      }
    }
  };

  // Start polling for chat messages
  const startPollingMessages = (chatId) => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);

    pollingInterval.current = setInterval(() => {
      fetchChatMessages(chatId, true); // Fetch new messages periodically
    }, 3000); // Poll every 3 seconds
  };


  // Handle chat selection
  const handleChatSelect = (chatId) => {
    setChatId(chatId);
    fetchChatMessages(chatId, true);
    startPollingMessages(chatId);
  };

  // Stop polling on component unmount
  useEffect(() => {
    fetchChats();

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, []);


  // Handle creating a new chat
  const handleCreateChat = async () => {
    if (!title) {
      setErrorMessage('Chat title is required.');
      return;
    }

    const token = localStorage.getItem('jwt');
    const csrfToken = getCSRFToken();

    try {
      const response = await fetch('/api/create-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ title }),
      });

      if (!response.ok) throw new Error('Failed to create chat.');

      const newChat = await response.json();
      setChats((prevChats) => [...prevChats, newChat]);
      setTitle('');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to create chat.');
    }
  };

  
  const handleMarkAsNote = async (message) => {
    const token = localStorage.getItem('jwt');
    const csrfToken = getCSRFToken();

    try {
      const response = await fetch(`/api/message/${message.id}/mark-as-note/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });

      const data = await response.json();
      console.log('API Response:', data); // Check the structure of the response

    } catch (error) {
      setErrorMessage('Error marking message as note: ' + error.message);
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!file) {
      setErrorMessage('You must attach a file to send a message.');
      return;
    }

    const token = localStorage.getItem('jwt');
    const csrfToken = getCSRFToken();

    const formData = new FormData();
    formData.append('user_input', message);
    formData.append('chat_id', chatId);
    formData.append('file', file);

    try {
      const response = await fetch('/groqapi/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to send message.');

      const data = await response.json();
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { role: 'user', content: message },
        { role: 'assistant', content: data.result },
      ]);

      setMessage('');
      setFile(null);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to send message.');
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: '300px',
          backgroundColor: '#2a3442',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Chats
        </Typography>
        <Box sx={{ marginBottom: '16px' }}>
          <TextField
            fullWidth
            placeholder="New chat title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ marginBottom: '8px', backgroundColor: 'white' }}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleCreateChat}
          >
            Create Chat
          </Button>
        </Box>
        <Divider sx={{ marginBottom: '16px' }} />
        <List>
          {chats.map((chat) => (
            <ListItem
              key={chat.id}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  color="error"
                  onClick={() => handleDeleteChat(chat.id)}
                >
                  <DeleteIcon />
                </IconButton>
              }
              onClick={() => {
                handleChatSelect(chat.id)
              }}
            >
              <ListItemButton sx={{ color: 'white' }}>
                {chat.title}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
        {/* Navbar */}
        <AppBarComponent handleLogout={handleLogout} />
        <Box sx={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          {chatMessages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                marginBottom: '16px',
                textAlign: msg.role === 'user' ? 'right' : 'left',
              }}
            >
              <Typography
                sx={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  backgroundColor: msg.role === 'user' ? '#2196f3' : '#e0e0e0',
                  borderRadius: '8px',
                  color: msg.role === 'user' ? 'white' : 'black',
                }}
              >
                {msg.content}
                {msg.role === 'assistant' && (
                  <IconButton
                    onClick={() => handleMarkAsNote(msg)}
                    size="small"
                    sx={{
                      position: 'relative',
                      marginLeft: '8px',
                      verticalAlign: 'middle',
                      color: '#ff9800',
                    }}
                  >
                    <StarBorderIcon />
                  </IconButton>
                )}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Error Message */}
        {errorMessage && (
          <Alert
            severity="error"
            onClose={() => setErrorMessage('')}
            sx={{ margin: '16px' }}
          >
            {errorMessage}
          </Alert>
        )}

        {/* Message Input */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid #ddd',
            backgroundColor: '#ffffff',
            padding: '16px',
          }}
        >
          {/* Display file name if a file is attached */}
          {file && (
            <Typography variant="caption" color="textSecondary" sx={{ marginBottom: '8px' }}>
              Attached file: {file.name}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton component="label">
              <AttachFileIcon />
              <input
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files[0])}
              />
            </IconButton>
            <TextField
              fullWidth
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ marginLeft: '8px', marginRight: '8px' }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendMessage}
              endIcon={<SendIcon />}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateChatAndMessage;
