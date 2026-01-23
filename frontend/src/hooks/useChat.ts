import { useState, useEffect, useCallback, useRef } from 'react';
import { chatApi, Message, ChatRoom } from '../services/chatApi';
import { useSocket } from './useSocket';

export const useChat = (roomId: string | null) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [room, setRoom] = useState<ChatRoom | null>(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [unreadCount, setUnreadCount] = useState(0);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

    const socket = useSocket();
    const typingTimeoutRef = useRef<any>(null);

    useEffect(() => {
        if (!roomId) return;

        const loadRoom = async () => {
            try {
                const response = await chatApi.getRoom(roomId);
                setRoom(response.data);
            } catch (error) {
                console.error('Failed to load room:', error);
            }
        };

        loadRoom();
    }, [roomId]);

    const loadMessages = useCallback(async (pageNum: number = 1) => {
        if (!roomId) return;

        setLoading(true);
        try {
            const response = await chatApi.getMessages(roomId, pageNum);

            if (pageNum === 1) {
                setMessages(response.data);
            } else {
                setMessages(prev => {
                    const existingIds = new Set(prev.map(m => m._id));
                    const newMessages = response.data.filter((m: Message) => !existingIds.has(m._id));
                    return [...newMessages, ...prev];
                });
            }

            setHasMore(response.pagination?.hasMore || false);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useEffect(() => {
        if (roomId) {
            loadMessages(1);
            loadUnreadCount();
        }
    }, [roomId, loadMessages]);

    useEffect(() => {
        if (!socket || !roomId) return;

        socket.joinChat(roomId);

        const handleNewMessage = (message: Message) => {
            const msgRoomId = typeof message.chatRoom === 'string'
                ? message.chatRoom
                : (message.chatRoom as any)?._id?.toString() || (message.chatRoom as any)?.toString();

            console.log(`[Socket] Message received for room ${msgRoomId}. Current room: ${roomId}`);

            if (msgRoomId?.toString() === roomId?.toString()) {
                setMessages(prev => {

                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            }
        };

        const handleMessageEdits = (message: Message) => {
            setMessages(prev =>
                prev.map(m => (m._id === message._id ? message : m))
            );
        };

        const handleMessageDeletion = ({ messageId }: { messageId: string }) => {
            setMessages(prev =>
                prev.map(m =>
                    m._id === messageId
                        ? { ...m, isDeleted: true, content: 'This message has been deleted' }
                        : m
                )
            );
        };

        const handleTypingStart = ({ userId, roomId: typingRoomId }: { userId: string, roomId: string }) => {
            if (typingRoomId === roomId) {
                setTypingUsers(prev => new Set(prev).add(userId));
            }
        };

        const handleTypingStop = ({ userId, roomId: typingRoomId }: { userId: string, roomId: string }) => {
            if (typingRoomId === roomId) {
                setTypingUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(userId);
                    return newSet;
                });
            }
        };

        const handleRoomUpdate = (updatedRoom: ChatRoom) => {
            if (updatedRoom._id === roomId) {
                setRoom(updatedRoom);
            }
        };

        const handleRoomDeletion = ({ roomId: deletedRoomId }: { roomId: string }) => {
            if (deletedRoomId === roomId) {
                setRoom(prev => prev ? { ...prev, isDeleted: true } : null);
            }
        };

        socket.on('chat:message:received', handleNewMessage);
        socket.on('chat:message:edited', handleMessageEdits);
        socket.on('chat:message:deleted', handleMessageDeletion);
        socket.on('chat:typing:start', handleTypingStart);
        socket.on('chat:typing:stop', handleTypingStop);
        socket.on('chat:room:updated', handleRoomUpdate);
        socket.on('chat:room:deleted', handleRoomDeletion);

        return () => {
            socket.leaveChat(roomId);
            socket.off('chat:message:received', handleNewMessage);
            socket.off('chat:message:edited', handleMessageEdits);
            socket.off('chat:message:deleted', handleMessageDeletion);
            socket.off('chat:typing:start', handleTypingStart);
            socket.off('chat:typing:stop', handleTypingStop);
            socket.off('chat:room:updated', handleRoomUpdate);
            socket.off('chat:room:deleted', handleRoomDeletion);
        };
    }, [socket, roomId]);

    const loadUnreadCount = async () => {
        if (!roomId) return;
        try {
            const response = await chatApi.getUnreadCount(roomId);
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    };

    const sendMessage = async (content: string, replyTo?: string) => {
        if (!roomId || !content.trim()) return;

        setSending(true);
        try {
            const response = await chatApi.sendMessage(roomId, {
                messageType: 'text',
                content: content.trim(),
                replyTo
            });

            return response.data;
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        } finally {
            setSending(false);
        }
    };

    const uploadFile = async (file: File, messageType: 'image' | 'audio' | 'document', replyTo?: string) => {
        if (!roomId) return;

        setSending(true);
        try {
            await chatApi.uploadMedia(roomId, file, messageType, replyTo);
        } catch (error) {
            console.error('Failed to upload file:', error);
            throw error;
        } finally {
            setSending(false);
        }
    };

    const editMessage = async (messageId: string, content: string) => {
        try {
            const response = await chatApi.editMessage(messageId, content);

            setMessages(prev => prev.map(m => m._id === messageId ? response.data : m));
            return response.data;
        } catch (error) {
            console.error('Failed to edit message:', error);
            throw error;
        }
    };

    const deleteMessage = async (messageId: string) => {
        try {
            await chatApi.deleteMessage(messageId);

            setMessages(prev => prev.map(m =>
                m._id === messageId
                    ? { ...m, isDeleted: true, content: 'This message has been deleted' }
                    : m
            ));
        } catch (error) {
            console.error('Failed to delete message:', error);
            throw error;
        }
    };

    const startTyping = () => {
        if (!roomId) return;
        socket.startChatTyping(roomId);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            stopTyping();
        }, 3000);
    };

    const stopTyping = () => {
        if (!roomId) return;
        socket.stopChatTyping(roomId);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    };

    const updateRoom = async (data: { name?: string; description?: string }) => {
        if (!roomId) return;
        try {
            const response = await chatApi.updateRoom(roomId, data);
            setRoom(response.data);
            return response.data;
        } catch (error) {
            console.error('Failed to update room:', error);
            throw error;
        }
    };

    const deleteRoom = async () => {
        if (!roomId) return;
        try {
            await chatApi.deleteRoom(roomId);
        } catch (error) {
            console.error('Failed to delete room:', error);
            throw error;
        }
    };

    return {
        room,
        messages,
        loading,
        sending,
        hasMore,
        unreadCount,
        typingUsers,
        sendMessage,
        uploadFile,
        startTyping,
        stopTyping,
        updateRoom,
        deleteRoom,
        editMessage,
        deleteMessage,
        loadMore: () => {
            if (!loading && hasMore) {
                loadMessages(page + 1);
            }
        },
        refetchMessages: () => loadMessages(1)
    };
};