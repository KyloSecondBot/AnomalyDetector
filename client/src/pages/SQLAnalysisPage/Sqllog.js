import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Sqllog.css';

export default function Sqllog() {
    const [logs, setLogs] = useState([]);
    const [todayAttacks, setTodayAttacks] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fetch logs from the backend
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await axios.get('http://localhost:3011/api/malicious-logs');
                const logsData = response.data?.maliciousQueries || [];
                const attacksToday = response.data?.todayAttacks || 0;

                setLogs(logsData);
                setTodayAttacks(attacksToday);
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    // Format the date
    const formatDate = (isoDate) => {
        const date = new Date(isoDate);
        return date.toLocaleString(); // Converts to local time and human-readable format
    };

    return (
        <div className="sql-log-container">
            <h1>SQL Malicious Query Log</h1>
            {loading ? (
                <p>Loading logs...</p>
            ) : (
                <div className='title'>
                    <p><strong>Malicious Queries Today:</strong> {todayAttacks}</p>
                    <p><strong>Total Malicious Queries:</strong> {logs.length || 0}</p>

                    {logs.length > 0 ? (
                        <table className="sql-log-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Query</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{log.query}</td>
                                        <td>{formatDate(log.date)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No malicious queries logged yet.</p>
                    )}
                </div>
            )}
        </div>
    );
}
