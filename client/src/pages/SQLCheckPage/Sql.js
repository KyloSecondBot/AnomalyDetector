import React, { useState } from 'react';
import axios from 'axios';
import './Sql.css';

export default function Sql() {
    const [query, setQuery] = useState(''); // Store the user's SQL query input
    const [result, setResult] = useState(null); // Store the API response
    const [loading, setLoading] = useState(false); // Manage loading state

    // Function to handle form submission
    const handleSubmit = async (e) => {
        if (e) e.preventDefault(); // Prevent page reload on form submit
        setLoading(true); // Set loading state

        try {
            const response = await axios.post('http://localhost:3011/api/process-query', { query });
            console.log('Response data:', response.data); // Log API response
            setResult(response.data); // Update result state with the API response
        } catch (error) {
            console.error('Error processing query:', error.response?.data || error.message); // Log error details
            setResult({
                error: error.response?.data?.error || 'Failed to process query.',
                query,
                analysis: 'Malicious', // Assume query is malicious if an error occurs
                timestamp: new Date().toISOString(), // Add timestamp to the error
            });
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    // Handle Enter key press inside the textarea
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent newline insertion
            handleSubmit(); // Call the submit function
        }
    };

    return (
        <div className="sql-container">
            <h1>SQL Query Analyzer</h1>
            <form onSubmit={handleSubmit} className="sql-form">
                <textarea
                    placeholder="Enter your SQL query here..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown} // Attach keydown handler
                    className="sql-textarea"
                ></textarea>
                <button type="submit" className="sql-submit" disabled={loading}>
                    {loading ? 'Analyzing...' : 'Submit Query'}
                </button>
            </form>
            {result && (
                <div className="sql-result">
                    <h2>Result:</h2>
                    {result.error ? (
                        <div>
                            <p><strong>Error:</strong> {result.error}</p>
                            <p><strong>Query:</strong> {result.query}</p>
                            <p><strong>Analysis:</strong> {result.analysis}</p>
                            <p><strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}</p>
                        </div>
                    ) : (
                        <div>
                            <p><strong>Query:</strong> {result.query}</p>
                            <p><strong>Analysis:</strong> {result.analysis}</p>
                            <p><strong>Result:</strong> {result.result}</p>
                            {result.queryResult && Array.isArray(result.queryResult) && (
                                <div className="title-answer-container">
                                    <h3>Query Result:</h3>
                                    <table className="result-table">
                                        <thead>
                                            <tr className="title-key">
                                                {Object.keys(result.queryResult[0] || {}).map((key) => (
                                                    <th key={key}>{key}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.queryResult.map((row, index) => (
                                                <tr className="title-answer" key={index}>
                                                    {Object.values(row).map((value, idx) => (
                                                        <td key={idx}>{value}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
