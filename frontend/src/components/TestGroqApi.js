import React, { useState } from 'react';

const TestGroqApi = () => {
    const [file, setFile] = useState(null);
    const [userInput, setUserInput] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

        try {
            const response = await fetch('/groqapi/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to upload file or query AI. Status: ${response.status}`);
            }

            const data = await response.json();
            setResponse(data.response);
        } catch (err) {
            setError('Error uploading the file or fetching the response.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="file-upload-container">
            <h2 className="title">Upload File and Chat with Groq AI</h2>
            <form onSubmit={handleSubmit} className="form">
                <div className="input-group">
                    <label htmlFor="file-upload" className="input-label">
                        <span>File Upload</span>
                        <input type="file" id="file-upload" onChange={handleFileChange} className="input-file" />
                    </label>
                </div>
                <div className="input-group">
                    <label htmlFor="user-input" className="input-label">
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

            {loading && <p className="loading-text">Loading...</p>}
            {error && <p className="error-text">{error}</p>}
            {response && (
                <div className="response">
                    <h3 className="response-title">AI Response:</h3>
                    <div className="response-json-container">
                        <pre className="response-json">{JSON.stringify(response, null, 2)}</pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestGroqApi;
