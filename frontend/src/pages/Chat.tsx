import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Inbox, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ChatPage: React.FC = () => {
    const { workshopId, roomId } = useParams<{ workshopId: string; roomId: string }>();
    const navigate = useNavigate();

    // If workshopId is missing, we might want to redirect to a default or show a message
    if (!workshopId) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)]">
                    <MessageSquare className="h-16 w-16 text-muted-foreground/20 mb-4" />
                    <h2 className="text-xl font-semibold">Select a workshop to chat</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
                {/* Chat Sidebar */}
                <div className="w-80 border-r flex-shrink-0 hidden md:block">
                    <ChatSidebar
                        workshopId={workshopId}
                        activeRoomId={roomId}
                        onRoomSelect={(id) => navigate(`/workshops/${workshopId}/chat/${id}`)}
                    />
                </div>

                {/* Chat Window */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    {roomId ? (
                        <ChatWindow roomId={roomId} />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10">
                            <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                                <MessageSquare className="h-10 w-10 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Your Workshop Hub</h2>
                            <p className="text-muted-foreground mt-2 max-w-sm">
                                Select a room from the sidebar to start collaborating with your team in real-time.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default ChatPage;
