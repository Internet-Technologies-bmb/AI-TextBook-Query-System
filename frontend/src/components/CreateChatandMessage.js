import React, { useState, useEffect } from 'react';

const CreateChatAndMessage = () => {
  const [title, setTitle] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]); // Store chat messages
  const [chatId, setChatId] = useState(null); // Store chat ID for retrieving messages
  const [chats, setChats] = useState([]); // Store list of chats
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('user');
  const [isNote, setIsNote] = useState(false);
  const [file, setFile] = useState(null);
  const [messageLoading, setMessageLoading] = useState(false);

  // Fetch CSRF token from cookies
  const getCSRFToken = () => {
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    return csrfToken;
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
      const response = await fetch('/api/get-chat', {
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

  // Fetch messages for selected chat
  const fetchChatMessages = async (chatId) => {
    if (!chatId) {
      setErrorMessage('Invalid chat ID');
      return;
    }

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

      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.messages || []);
      } else {
        const errorData = await response.json();
        setErrorMessage(`Failed to fetch chat messages: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      setErrorMessage('Error fetching messages: ' + error.message);
    }
  };

  // Handle chat creation form submission
  const handleCreateChatSubmit = async (e) => {
    e.preventDefault();

    if (!title) {
      setErrorMessage('Title is required!');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('jwt');
      if (!token) throw new Error('No authentication token found. Please log in.');

      const csrfToken = getCSRFToken();

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

      if (!response.ok) throw new Error(`Failed to create chat: ${response.status} ${response.statusText}`);

      const data = await response.json();
      setResponseMessage('Chat created successfully!');
      setChatId(data.id);  // Set the chat ID here
    } catch (error) {
      setErrorMessage('Failed to create chat. Please try again.');
      console.error('Error creating chat:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle message creation form submission
  const handleCreateMessageSubmit = async (e) => {
    e.preventDefault();
    setMessageLoading(true);
    setErrorMessage(null);
  
    const token = localStorage.getItem('jwt');
    const csrfToken = getCSRFToken();
  
    if (!token) {
      setErrorMessage('No authentication token found.');
      setMessageLoading(false);
      return;
    }
  
    const formData = new FormData();
    formData.append('content', message);
    formData.append('role', role);
    formData.append('is_note', isNote);
    if (file) formData.append('file', file);
  
    try {
      const response = await fetch(`/api/create-message/${chatId}/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: formData, // Send the form data containing the file
    });
    
  
      if (response.ok) {
        const data = await response.json();
        setMessage('');
        setChatMessages((prevMessages) => [...prevMessages, data]); // Add new message to the chat
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to send message.');
      }
    } catch (err) {
      setErrorMessage('An error occurred: ' + err.message);
    } finally {
      setMessageLoading(false);
    }
  };

  // Handle chat deletion
  const handleDeleteChat = async (chatId) => {
    const token = localStorage.getItem('jwt');
    const csrfToken = getCSRFToken();

    if (!token) {
      setErrorMessage('No authentication token found.');
      return;
    }

    try {
      const response = await fetch(`/api/delete-chat/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ chat_id: chatId }),
      });

      if (response.ok) {
        setChats(chats.filter(chat => chat.id !== chatId)); // Remove chat from list
        setResponseMessage('Chat deleted successfully.');
        if (chatId === chatId) {
          setChatId(null); // Clear chatId if the current chat was deleted
        }
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to delete chat.');
      }
    } catch (error) {
      setErrorMessage('Error deleting chat: ' + error.message);
    }
  };

  useEffect(() => {
    fetchChats();  // Fetch chats when the component mounts
  }, []);

  return (
    <div className="create-chat-and-message-container">
      <h2>Create New Chat</h2>
      <form onSubmit={handleCreateChatSubmit}>
        <div className="form-group">
          <label htmlFor="title">Chat Title:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter chat title"
            required
          />
        </div>
        <div className="form-group">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating...' : 'Create Chat'}
          </button>
        </div>
      </form>

      {responseMessage && <p className="response-message">{responseMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {/* Render List of Chats */}
      <div>
        <h3>Existing Chats</h3>
        <ul>
          {chats.map((chat) => (
            <li key={chat.id}>
              <button onClick={() => { setChatId(chat.id); fetchChatMessages(chat.id); }}>
                {chat.title}
              </button>
              {/* Delete Button */}
              <button onClick={() => handleDeleteChat(chat.id)} style={{marginLeft: '10px'}}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Render CreateMessage form if chatId is set */}
      {chatId && (
        <div className="create-message-container">
          <h3>Create a New Message for Chat ID: {chatId}</h3>
          <form onSubmit={handleCreateMessageSubmit} className="message-form" encType="multipart/form-data">
            <div className="form-group">
              <label htmlFor="message">Message Content:</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="role">Role:</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="assistant">Assistant</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="isNote">Note:</label>
              <input
                type="checkbox"
                id="isNote"
                checked={isNote}
                onChange={(e) => setIsNote(e.target.checked)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="file">File:</label>
              <input
                type="file"
                id="file"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
            <div className="form-group">
              <button type="submit" className="submit-button" disabled={messageLoading}>
                {messageLoading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Render chat messages */}
      {chatMessages.length > 0 && (
        <div className="messages-container">
          <h3>Messages</h3>
          <ul>
            {chatMessages.map((msg, index) => (
              <li key={index}>
                <strong>{msg.role}:</strong> {msg.content}
                {msg.file && <a href={msg.file} target="_blank" rel="noopener noreferrer">View File</a>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CreateChatAndMessage;
