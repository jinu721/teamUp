import React, { useState } from 'react';
import { Message } from '@/services/chatApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
    FileIcon,
    Download,
    MoreHorizontal,
    Edit2,
    Trash2,
    Volume2,
    X,
    Reply
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageItemProps {
    message: Message;
    isMe: boolean;
    showAvatar: boolean;
    onEdit?: (id: string, newContent: string) => void;
    onDelete?: (id: string) => void;
    onReply?: (message: Message) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isMe, showAvatar, onEdit, onDelete, onReply }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);

    const time = format(new Date(message.createdAt), 'h:mm a');
    const initials = message.sender.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const handleEdit = () => {
        if (editContent.trim() && editContent !== message.content) {
            onEdit?.(message._id, editContent.trim());
        }
        setIsEditing(false);
    };

    const renderContent = () => {
        if (message.isDeleted) {
            return <p className="italic text-muted-foreground/60">This message has been deleted</p>;
        }

        if (isEditing) {
            return (
                <div className="flex flex-col gap-2 min-w-[300px] animate-in fade-in zoom-in duration-200">
                    <div className="relative">
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="bg-background/80 border-primary/20 focus:border-primary/50 min-h-[80px] text-sm resize-none pr-10 rounded-xl"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleEdit();
                                }
                                if (e.key === 'Escape') {
                                    setIsEditing(false);
                                }
                            }}
                        />
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-full hover:bg-muted"
                                onClick={() => setIsEditing(false)}
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 px-1">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-8 px-3 rounded-full hover:bg-primary/5 hover:text-primary"
                            onClick={() => setIsEditing(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="text-xs h-8 px-4 rounded-full shadow-sm"
                            onClick={handleEdit}
                            disabled={!editContent.trim() || editContent === message.content}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            );
        }

        switch (message.messageType) {
            case 'image':
                return (
                    <div className="group/img relative max-w-sm rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                        <img
                            src={message.content}
                            alt={message.fileName || "Uploaded image"}
                            className="w-full h-auto object-cover max-h-[400px] cursor-pointer"
                            onClick={() => window.open(message.content, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="secondary" size="sm" className="rounded-full shadow-lg h-8 px-3 text-xs" onClick={() => window.open(message.content, '_blank')}>
                                View Full
                            </Button>
                        </div>
                        {message.fileName && (
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-[9px] text-white truncate">
                                {message.fileName}
                            </div>
                        )}
                    </div>
                );
            case 'audio':
                return (
                    <div className="flex flex-col gap-2 min-w-[280px] max-w-sm">
                        <div className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl shadow-sm transition-all",
                            isMe
                                ? "bg-primary/10 border border-primary/20"
                                : "bg-gradient-to-br from-primary/5 to-transparent border border-primary/20"
                        )}>
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                isMe ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
                            )}>
                                <Volume2 className="h-5 w-5" />
                            </div>
                            <div className="flex-1 space-y-1 min-w-0">
                                <p className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest opacity-70",
                                    isMe ? "text-primary" : "text-primary"
                                )}>
                                    Voice Message
                                </p>
                                <audio
                                    controls
                                    className="h-8 w-full"
                                    style={isMe ? {} : {}}
                                >
                                    <source src={message.content} type={message.mimeType} />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        </div>
                    </div>
                );
            case 'document':
                return (
                    <div className={cn(
                        "flex items-center gap-3 p-3 rounded-xl shadow-sm backdrop-blur-sm min-w-[220px] max-w-sm hover:shadow-md transition-all",
                        isMe
                            ? "bg-primary/10 border border-primary/20"
                            : "border border-border/50 bg-background/50"
                    )}>
                        <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                            isMe ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
                        )}>
                            <FileIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{message.fileName || 'Document'}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : 'File'}
                            </p>
                        </div>
                        <a
                            href={message.content}
                            download={message.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors shrink-0"
                        >
                            <Download className="h-4 w-4" />
                        </a>
                    </div>
                );
            default:
                return <p className="leading-relaxed break-words">{message.content}</p>;
        }
    };

    return (
        <div className={cn(
            "flex w-full group transition-all",
            isMe ? "justify-end" : "justify-start",
            showAvatar ? "mt-4" : "mt-1"
        )}>
            <div className={cn(
                "flex max-w-[85%] gap-3",
                isMe ? "flex-row-reverse" : "flex-row"
            )}>
                {/* Avatar */}
                {!isMe && (
                    <div className="w-8 shrink-0 flex items-end mb-1">
                        {showAvatar ? (
                            <Avatar className="h-8 w-8 shadow-sm border border-border/50">
                                <AvatarImage src={message.sender.profilePhoto} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                            </Avatar>
                        ) : null}
                    </div>
                )}

                {/* Bubble Container */}
                <div className={cn(
                    "flex flex-col gap-1 relative",
                    isMe ? "items-end" : "items-start"
                )}>
                    {showAvatar && !isMe && (
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                            {message.sender.name}
                        </span>
                    )}

                    <div className="flex items-center gap-2 group/bubble">
                        <div className={cn(
                            "relative transition-all",
                            // Only apply bubble styling for text messages
                            message.messageType === 'text' && cn(
                                "px-4 py-2.5 rounded-2xl text-sm shadow-xs",
                                isMe
                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                    : "bg-card border rounded-tl-none hover:bg-accent/50"
                            ),
                            message.isDeleted && "bg-muted/30 border-dashed"
                        )}>
                            {message.replyTo && !message.isDeleted && (
                                <div className={cn(
                                    "mb-2 p-2 rounded-lg border-l-4 bg-black/5 flex flex-col gap-0.5 max-w-xs",
                                    isMe ? "border-primary-foreground/50" : "border-primary/50"
                                )}>
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                                        {message.replyTo.sender.name}
                                    </span>
                                    <p className="text-[11px] truncate opacity-80 italic">
                                        {message.replyTo.messageType === 'text' ? message.replyTo.content : `[${message.replyTo.messageType}]`}
                                    </p>
                                </div>
                            )}
                            {renderContent()}

                            {message.isEdited && !message.isDeleted && (
                                <span className="absolute -bottom-4 right-2 text-[8px] text-muted-foreground/60 italic">
                                    edited
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        {!message.isDeleted && !isEditing && (
                            <div className={cn(
                                "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1",
                                isMe ? "flex-row-reverse" : "flex-row"
                            )}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full hover:bg-muted"
                                    onClick={() => onReply?.(message)}
                                >
                                    <Reply className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>

                                {isMe && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-muted">
                                                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align={isMe ? "end" : "start"} className="w-32">
                                            {message.messageType === 'text' && (
                                                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                                    <Edit2 className="h-3 w-3 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => onDelete?.(message._id)}
                                            >
                                                <Trash2 className="h-3 w-3 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status info */}
                    {showAvatar && (
                        <div className="flex items-center gap-1.5 px-1 mt-0.5 opacity-40">
                            <span className="text-[9px] text-muted-foreground font-medium">{time}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

