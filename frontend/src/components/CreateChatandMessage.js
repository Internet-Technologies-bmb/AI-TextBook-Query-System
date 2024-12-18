import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemButton, TextField, Button, Divider, IconButton, Alert } from '@mui/material';
import { AttachFile as AttachFileIcon, Send as SendIcon } from '@mui/icons-material';
import AppBarComponent from './AppBarComponent';

const CreateChatAndMessage = () => {
  const [title, setTitle] = useState('');
  const [chats, setChats] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

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

  // Fetch messages for a selected chat
  const fetchChatMessages = async (chatId) => {
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
  };

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

  // Delete a chat
  const handleDeleteChat = async (chatId) => {
    // const token = localStorage.getItem('jwt');
    // const csrfToken = getCSRFToken();

    // try {
    //   const response = await fetch(`/api/delete-chat/${chatId}`, {
    //     method: 'DELETE',
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'X-CSRFToken': csrfToken,
    //     },
    //     credentials: 'include',
    //   });

    //   if (!response.ok) throw new Error('Failed to delete chat.');

    //   setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    //   if (chatId === chatId) {
    //     setChatId(null);
    //     setChatMessages([]);
    //   }
    // } catch (error) {
    //   setErrorMessage(error.message || 'Failed to delete chat.');
    // }
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
                setChatId(chat.id);
                fetchChatMessages(chat.id);
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
        <AppBarComponent />
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
