import React, { useState, useEffect } from 'react';

const CreateChatAndMessage = () => {
  const [title, setTitle] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [editNoteId, setEditNoteId] = useState(null);
  const [editedNoteContent, setEditedNoteContent] = useState('');

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

  // Handle message creation
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

    if (!chatId) {
      setErrorMessage('Chat ID is required to send a message.');
      setMessageLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('user_input', message);
    formData.append('chat_id', chatId);
    if (file) formData.append('file', file);

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

      if (response.ok) {
        const data = await response.json();
        setMessage('');
        setFile(null);

        // Update chat messages immediately
        setChatMessages((prevMessages) => [
          ...prevMessages,
          { role: 'user', content: message },
          { role: 'assistant', content: data.result },
        ]);
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

  // Mark message as a note
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

      if (response.ok) {
        // Add the newly created note to the notes state
        setNotes((prevNotes) => [...prevNotes, data]);
      } else {
        setErrorMessage(data.error || 'Failed to mark message as note');
      }
    } catch (error) {
      setErrorMessage('Error marking message as note: ' + error.message);
    }
  };

  // Unmark message as a note
  const handleUnmarkNote = async (noteId) => {
    const token = localStorage.getItem('jwt');
    const csrfToken = getCSRFToken();

    try {
      const response = await fetch(`/api/note/${noteId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });

      if (response.ok) {
        // Remove the note from the notes state immediately
        const updatedNotes = notes.filter((note) => note.id !== noteId);
        setNotes(updatedNotes);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to unmark note.');
      }
    } catch (error) {
      setErrorMessage('Error unmarking note: ' + error.message);
    }
  };

  // Handle note editing
  const handleEditNote = async (noteId, newContent) => {
    const token = localStorage.getItem('jwt');
    const csrfToken = getCSRFToken();

    try {
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
        const data = await response.json();
        // Update the note in the state
        setNotes((prevNotes) => prevNotes.map((note) =>
          note.id === noteId ? { ...note, message: { ...note.message, content: newContent } } : note
        ));
        setEditNoteId(null); // Clear the edit state
        setEditedNoteContent('');
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to edit note.');
      }
    } catch (error) {
      setErrorMessage('Error editing note: ' + error.message);
    }
  };

  // Fetch all notes for the user
  const fetchUserNotes = async () => {
    const token = localStorage.getItem('jwt');
    const csrfToken = getCSRFToken();

    try {
      const response = await fetch('/api/notes/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to fetch notes.');
      }
    } catch (error) {
      setErrorMessage('Error fetching notes: ' + error.message);
    }
  };

  useEffect(() => {
    fetchChats();
    fetchUserNotes(); // Fetch user notes on component mount
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
          <button type="submit" className="submit-button" disabled={loading || messageLoading}>
            {loading ? 'Creating...' : 'Create Chat'}
          </button>
        </div>
      </form>

      {responseMessage && <p className="response-message">{responseMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div>
        <h3>Existing Chats</h3>
        <ul>
          {chats.map((chat) => (
            <li key={chat.id}>
              <button onClick={() => { setChatId(chat.id); fetchChatMessages(chat.id); }}>
                {chat.title}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {chatId && (
        <div className="create-message-container">
          <h3>Create a New Message for Chat ID: {chatId}</h3>
          <form onSubmit={handleCreateMessageSubmit} encType="multipart/form-data">
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
              <label htmlFor="file">Attach File (optional):</label>
              <input
                type="file"
                id="file"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
            <div className="form-group">
              <button type="submit" disabled={messageLoading}>
                {messageLoading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      )}

      {chatMessages.length > 0 && (
        <div className="messages-container">
          <h3>Messages</h3>
          <ul>
            {chatMessages.map((msg, index) => (
              <li key={index}>
                <strong>{msg.role}:</strong> {msg.content}
                {msg.role === 'assistant' && (
                  <button onClick={() => handleMarkAsNote(msg)}>
                    Mark as Note
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {notes.length > 0 && (
        <div className="notes-container">
          <h3>Notes</h3>
          <ul>
            {notes.map((note, index) => (
              <div key={index} className="note-box">
                <li>
                  <strong>{note.user.username}:</strong>
                  {editNoteId === note.id ? (
                    <div>
                      <textarea
                        value={editedNoteContent}
                        onChange={(e) => setEditedNoteContent(e.target.value)}
                        placeholder="Edit your note"
                      />
                      <button onClick={() => handleEditNote(note.id, editedNoteContent)}>Save</button>
                    </div>
                  ) : (
                    <p>{note.message ? note.message.content : 'No content available'}</p>
                  )}
                </li>
                {editNoteId !== note.id && (
                  <button onClick={() => { setEditNoteId(note.id); setEditedNoteContent(note.message.content); }}>Edit</button>
                )}
                <button onClick={() => handleUnmarkNote(note.id)}>Unmark</button>
              </div>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CreateChatAndMessage;
