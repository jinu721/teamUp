import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socketService from '../services/socket';

interface ChatProps {
  messages: Message[];
  projectId: string;
}

const Chat: React.FC<ChatProps> = ({ messages, projectId }) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    socketService.on('typing:start', handleTypingStart);
    socketService.on('typing:stop', handleTypingStop);

    return () => {
      socketService.off('typing:start', handleTypingStart);
      socketService.off('typing:stop', handleTypingStop);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTypingStart = (data: { userId: string; projectId: string }) => {
    if (data.projectId === projectId && data.userId !== user?._id) {
      setTypingUsers(prev => new Set(prev).add(data.userId));
    }
  };

  const handleTypingStop = (data: { userId: string; projectId: string }) => {
    if (data.projectId === projectId) {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socketService.startTyping(projectId);

    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(projectId);
    }, 1000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await api.sendMessage(projectId, newMessage);
      setNewMessage('');
      socketService.stopTyping(projectId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '600px', border: '1px solid #ddd' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f9f9f9' }}>
        {messages.map((message) => (
          <div
            key={message._id}
            style={{
              marginBottom: '15px',
              display: 'flex',
              justifyContent: message.sender._id === user?._id ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '10px 15px',
                borderRadius: '8px',
                backgroundColor: message.sender._id === user?._id ? '#007bff' : '#fff',
                color: message.sender._id === user?._id ? '#fff' : '#000',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '12px' }}>
                {message.sender.name}
              </div>
              <div>{message.content}</div>
              <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.7 }}>
                {new Date(message.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {typingUsers.size > 0 && (
        <div style={{ padding: '5px 20px', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
          Someone is typing...
        </div>
      )}

      <form onSubmit={handleSendMessage} style={{ padding: '15px', borderTop: '1px solid #ddd', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button type="submit" style={{ padding: '10px 20px' }}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
