import React, { useState } from 'react';
import axios from 'axios';
import './Home.css';

export default function Home() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    // Function to handle sending a message
    const sendMessage = async () => {
        if (!input.trim()) return;
    
        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
    
        try {
            const response = await axios.post('http://localhost:3011/api/chat', { prompt: input });
            console.log('Backend Response:', response.data);
    
            setMessages([...newMessages, { role: 'assistant', content: response.data.response }]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages([...newMessages, { role: 'assistant', content: 'An error occurred. Please try again.' }]);
        }
    };
    
    

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') sendMessage(); // Send message on Enter key press
    };

    return (
        <div className="chat-container">
            <div className="chat-window">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.role}`}>
                        <p>{message.content}</p>
                    </div>
                ))}
            </div>
            <div className="input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    onKeyDown={handleKeyDown}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}
