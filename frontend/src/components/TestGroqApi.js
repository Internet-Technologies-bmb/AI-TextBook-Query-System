import React, { useState } from 'react';
import AppBarComponent from './AppBarComponent';

const TestGroqApi = () => {
    const [file, setFile] = useState(null);
    const [userInput, setUserInput] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const [wordCount, setWordCount] = useState(null);

    const getCSRFToken = () => {
        const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return csrfToken;
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleInputChange = (e) => {
        setUserInput(e.target.value);
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

    const pollTaskStatus = async (taskId) => {
        for (let i = 0; i < 30; i++) {
            try {
                const statusResponse = await fetch(`/groqapi/task_status/${taskId}`, {
                    method: 'GET',
                });

                if (!statusResponse.ok) {
                    throw new Error('Failed to fetch task status');
                }

                const statusData = await statusResponse.json();

                if (statusData.status === 'Success') {
                    setResponse(statusData.result);
                    setStatus('Completed');
                    setLoading(false);
                    return;
                } else if (statusData.status === 'Failure') {
                    setError(`Task failed: ${statusData.error}`);
                    setStatus('Failed');
                    setLoading(false);
                    return;
                }

                setStatus('Processing...');
                await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before polling again
            } catch (err) {
                setError('Error polling task status.');
                setStatus('Error');
                setLoading(false);
                return;
            }
        }

        setStatus('Pending');
        setError('Task is still processing. Please try again later.');
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setError('Please select a file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_input', userInput);

        setLoading(true);
        setError('');
        setResponse(null);
        setStatus('');

        try {
            const uploadResponse = await fetch('/groqapi/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                },
            });

            if (!uploadResponse.ok) {
                throw new Error(`Failed to upload file or query AI. Status: ${uploadResponse.status}`);
            }

            const uploadData = await uploadResponse.json();

            if (uploadData.status === 'Pending') {
                setStatus('Processing...');
                setWordCount(uploadData.word_count || null);
                await pollTaskStatus(uploadData.task_id); // Start polling for task status
            } else {
                setResponse(uploadData.result);
                setStatus('Completed');
                setWordCount(uploadData.word_count || null);
            }
        } catch (err) {
            setError('Error uploading the file or fetching the response.');
            setStatus('Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="file-upload-container fullscreen">
            <AppBarComponent handleLogout={handleLogout} />
            <div className="upload-form">
                <h2 className="title" style={{ color: 'white' }}>Upload File and Chat with Groq AI</h2>
                <form onSubmit={handleSubmit} className="form">
                    <div className="input-group">
                        <label htmlFor="file-upload" className="input-label" style={{ color: 'white' }}>
                            <span>File Upload</span>
                            <input type="file" id="file-upload" onChange={handleFileChange} className="input-file" style={{ color: 'white' }}/>
                        </label>
                    </div>
                    <div className="input-group">
                        <label htmlFor="user-input" className="input-label" style={{ color: 'white' }}>
                            <span>Your Message</span>
                            <textarea
                                id="user-input"
                                value={userInput}
                                onChange={handleInputChange}
                                placeholder="Enter your message here..."
                                className="input-textarea"
                            />
                        </label>
                    </div>
                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? 'Uploading...' : 'Upload and Query AI'}
                    </button>
                </form>

                {loading && <p className="loading-text">Loading... {status}</p>}
                {error && <p className="error-text">{error}</p>}
            </div>

            {response && (
                <div className="response scrollable">
                    <h3 className="response-title">AI Response:</h3>
                    <div className="response-json-container">
                        <pre className="response-json">{response}</pre>
                        {wordCount && <p>Word Count: {wordCount}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestGroqApi;
