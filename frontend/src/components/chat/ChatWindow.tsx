import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { MessageItem } from './MessageItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
    Send,
    Paperclip,
    Image as ImageIcon,
    MoreVertical,
    Hash,
    Users,
    Loader2,
    Info,
    Smile,
    X
} from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { EditRoomDialog } from './EditRoomDialog';
import { useNavigate } from 'react-router-dom';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatWindowProps {
    roomId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ roomId }) => {
    const {
        room,
        messages,
        loading,
        sending,
        typingUsers,
        sendMessage,
        uploadFile,
        startTyping,
        loadMore,
        hasMore,
        updateRoom,
        deleteRoom,
        editMessage,
        deleteMessage,
    } = useChat(roomId);

    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || sending) return;

        try {
            await sendMessage(input.trim(), replyingTo?._id);
            setInput('');
            setReplyingTo(null);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        startTyping();
    };

    const handleUpdateRoom = async (data: { name: string; description: string }) => {
        await updateRoom(data);
    };

    const handleDeleteRoom = async () => {
        try {
            await deleteRoom();
            toast({ title: 'Success', description: 'Channel deleted' });
            navigate(`/workshops/${room?.workshop}/chat`);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete channel', variant: 'destructive' });
        }
    };

    const handleReply = (message: any) => {
        setReplyingTo(message);
        // Focus the input
        const inputElement = document.getElementById('chat-input');
        if (inputElement) inputElement.focus();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio' | 'document') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            await uploadFile(file, type, replyingTo?._id);
            toast({ title: 'Success', description: 'File uploaded' });
            setReplyingTo(null);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to upload file', variant: 'destructive' });
        } finally {
            e.target.value = '';
        }
    };

    const handleVoiceRecord = async (blob: Blob) => {
        try {
            const file = new File([blob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
            await uploadFile(file, 'audio', replyingTo?._id);
            toast({ title: 'Success', description: 'Voice message sent' });
        } catch (error) {
            console.error('Failed to send voice message:', error);
            toast({ title: 'Error', description: 'Failed to send voice message', variant: 'destructive' });
        }
    };

    const handleEditMessage = async (id: string, content: string) => {
        try {
            await editMessage(id, content);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to edit message', variant: 'destructive' });
        }
    };

    const handleDeleteMessage = async (id: string) => {
        try {
            await deleteMessage(id);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete message', variant: 'destructive' });
        }
    };

    const isAdmin = room?.admins.some(id => (typeof id === 'string' ? id : (id as any)._id) === user?._id) || room?.createdBy === user?._id;

    if (loading && messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Header */}
            <div className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur-md z-10">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {room?.roomType === 'direct' ? <Users className="h-5 w-5" /> : <Hash className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate leading-tight">{room?.name || 'Loading channel...'}</h3>
                        <p className="text-[10px] text-muted-foreground truncate leading-tight uppercase tracking-widest mt-0.5">
                            {room?.participants.length || 0} participants
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <Info className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                                Edit Channel
                            </DropdownMenuItem>
                            {isAdmin && (
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setIsDeleteOpen(true)}
                                >
                                    Delete Channel
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <EditRoomDialog
                room={room}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onUpdate={handleUpdateRoom}
            />

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the <strong>#{room?.name}</strong> channel and all its messages. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteRoom} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Channel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar" ref={scrollRef}>
                {hasMore && (
                    <div className="flex justify-center pb-4">
                        <Button variant="ghost" size="sm" onClick={loadMore} className="text-xs text-muted-foreground">
                            Load older messages
                        </Button>
                    </div>
                )}

                {messages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                        <div className="h-16 w-16 rounded-full border-2 border-dashed border-primary mb-4 flex items-center justify-center">
                            <Hash className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-medium">This is the start of your collaboration</p>
                        <p className="text-xs mt-1">Send a message to get things moving!</p>
                    </div>
                )}

                {messages.map((message, index) => {
                    const isMe = message.sender._id === user?._id;
                    const showAvatar = index === 0 || messages[index - 1].sender._id !== message.sender._id;

                    return (
                        <MessageItem
                            key={message._id}
                            message={message}
                            isMe={isMe}
                            showAvatar={showAvatar}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                            onReply={handleReply}
                        />
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Footer / Input */}
            <div className="p-4 border-t bg-card/30">
                {typingUsers.size > 0 && (
                    <div className="absolute -top-6 left-4 right-4 flex items-center gap-1.5 px-2 py-1">
                        <div className="flex gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce" />
                            <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span className="text-[10px] text-primary/60 font-medium italic">
                            Someone is typing...
                        </span>
                    </div>
                )}
                <form onSubmit={handleSend} className="relative flex flex-col gap-2 group">
                    {replyingTo && (
                        <div className="mx-2 mb-1 p-2 bg-muted/50 border-l-4 border-primary rounded-r-lg flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                            <div className="flex flex-col gap-0.5 min-w-0 pr-4">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                    Replying to {replyingTo.sender.name}
                                </span>
                                <p className="text-xs text-muted-foreground truncate italic">
                                    {replyingTo.messageType === 'text' ? replyingTo.content : `[${replyingTo.messageType}]`}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full hover:bg-muted shrink-0"
                                onClick={() => setReplyingTo(null)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                    <div className="flex items-end gap-2 w-full">
                        <div className="flex items-center px-2 py-1 gap-1">
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={(e) => handleFileUpload(e, 'document')}
                            />
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                ref={imageInputRef}
                                onChange={(e) => handleFileUpload(e, 'image')}
                            />
                            <input
                                type="file"
                                className="hidden"
                                accept="audio/*"
                                ref={audioInputRef}
                                onChange={(e) => handleFileUpload(e, 'audio')}
                            />

                            <Button
                                type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                                onClick={() => imageInputRef.current?.click()}
                            >
                                <ImageIcon className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary">
                                <Smile className="h-4 w-4" />
                            </Button>
                            <VoiceRecorder onRecord={handleVoiceRecord} onCancel={() => { }} disabled={sending} />
                        </div>
                        <Input
                            id="chat-input"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                            className="border-0 focus-visible:ring-0 shadow-none text-sm h-10 px-3 flex-1"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className={cn(
                                "h-10 w-10 rounded-full shadow-lg transition-all shrink-0",
                                !input.trim() ? "opacity-50" : "hover:scale-105 active:scale-95"
                            )}
                            disabled={!input.trim() || sending}
                        >
                            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
