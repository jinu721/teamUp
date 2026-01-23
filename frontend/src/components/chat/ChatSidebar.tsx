import React, { useEffect, useState, useCallback } from 'react';
import { chatApi, ChatRoom } from '@/services/chatApi';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Hash, Users, MessageSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

import { usePermissions } from '@/hooks/usePermission';
import { useWorkshopRoom } from '@/hooks/useSocket';
import { useWorkshopProjects } from '@/hooks/useWorkshopProjects';
import { useTeams } from '@/hooks/useTeams';
import { useSocket } from '@/hooks/useSocket';
import { CreateRoomDialog } from './CreateRoomDialog';

interface ChatSidebarProps {
    workshopId: string;
    activeRoomId?: string;
    onRoomSelect: (roomId: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    workshopId,
    activeRoomId,
    onRoomSelect
}) => {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    useWorkshopRoom(workshopId);

    const { permissions: permsMap } = usePermissions(workshopId, [
        { action: 'create', resource: 'chat_room' }
    ]);
    const canCreate = permsMap['create:chat_room'] ?? false;

    const { projects } = useWorkshopProjects(workshopId);
    const { teams: userTeams } = useTeams(workshopId);
    const socket = useSocket();

    const fetchRooms = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await chatApi.getRooms(workshopId);
            setRooms(response.data);
        } catch (error) {
            console.error('Failed to fetch chat rooms:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [workshopId]);

    useEffect(() => {
        fetchRooms();
    }, [workshopId]);

    useEffect(() => {
        if (!socket || !workshopId) return;

        const handleRoomCreated = (newRoom: ChatRoom) => {
            if (newRoom.workshop === workshopId) {
                setRooms(prev => {
                    if (prev.find(r => r._id === newRoom._id)) return prev;
                    return [newRoom, ...prev];
                });
            }
        };

        const handleRoomUpdated = (updatedRoom: ChatRoom) => {
            if (updatedRoom.workshop === workshopId) {
                setRooms(prev => prev.map(r => r._id === updatedRoom._id ? updatedRoom : r));
            }
        };

        const handleRoomDeleted = ({ roomId }: { roomId: string }) => {
            setRooms(prev => prev.filter(r => r._id !== roomId));
            if (activeRoomId === roomId) {

            }
        };

        const handleRoomsSync = (data: { workshopId: string }) => {
            if (data.workshopId === workshopId) {
                fetchRooms(true);
            }
        };

        const handleNewMessage = (message: any) => {
            const msgRoomId = typeof message.chatRoom === 'string'
                ? message.chatRoom
                : (message.chatRoom as any)?._id?.toString();

            setRooms(prev => prev.map(room => {
                if (room._id === msgRoomId) {
                    return {
                        ...room,
                        lastMessage: message,
                        lastMessageAt: message.createdAt
                    };
                }
                return room;
            }).sort((a, b) => {
                const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                return dateB - dateA;
            }));
        };

        socket.on('chat:room:created', handleRoomCreated);
        socket.on('chat:room:updated', handleRoomUpdated);
        socket.on('chat:room:deleted', handleRoomDeleted);
        socket.on('chat:rooms:sync', handleRoomsSync);
        socket.on('chat:message:received', handleNewMessage);

        return () => {
            socket.off('chat:room:created', handleRoomCreated);
            socket.off('chat:room:updated', handleRoomUpdated);
            socket.off('chat:room:deleted', handleRoomDeleted);
            socket.off('chat:rooms:sync', handleRoomsSync);
            socket.off('chat:message:received', handleNewMessage);
        };
    }, [socket, workshopId, activeRoomId]);

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(search.toLowerCase())
    );

    const workshopRooms = filteredRooms.filter(r => r.roomType === 'workshop');
    const projectRooms = filteredRooms.filter(r => r.roomType === 'project');
    const teamRooms = filteredRooms.filter(r => r.roomType === 'team');
    const directRooms = filteredRooms.filter(r => r.roomType === 'direct');

    const RoomItem = ({ room }: { room: ChatRoom }) => {
        const isActive = activeRoomId === room._id;
        return (
            <button
                key={room._id}
                onClick={() => onRoomSelect(room._id)}
                className={cn(
                    "w-full flex flex-col gap-1 p-3 text-left transition-all hover:bg-accent group relative rounded-lg mb-1",
                    isActive && "bg-accent shadow-sm"
                )}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {room.roomType === 'workshop' && <Hash className="h-4 w-4 text-muted-foreground shrink-0" />}
                        {room.roomType === 'project' && <Hash className="h-4 w-4 text-primary shrink-0" />}
                        {room.roomType === 'team' && <Users className="h-4 w-4 text-green-500 shrink-0" />}
                        {room.roomType === 'direct' && <MessageSquare className="h-4 w-4 text-amber-500 shrink-0" />}

                        <span className={cn(
                            "text-sm truncate font-medium",
                            isActive ? "text-primary" : "text-foreground"
                        )}>
                            {room.name}
                        </span>
                    </div>
                    {room.lastMessageAt && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(room.lastMessageAt), { addSuffix: false })}
                        </span>
                    )}
                </div>
                {room.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate leading-relaxed pl-6">
                        {(() => {
                            const msg = typeof room.lastMessage === 'string' ? { content: room.lastMessage, messageType: 'text' } : room.lastMessage;
                            switch (msg.messageType) {
                                case 'audio':
                                    return '🎤 Voice message';
                                case 'image':
                                    return '📷 Photo';
                                case 'document':
                                    return `📎 ${msg.fileName || 'Document'}`;
                                default:
                                    return msg.content;
                            }
                        })()}
                    </p>
                )}
            </button>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full bg-card/30 p-4">
                <Skeleton className="h-10 w-full mb-6" />
                <Skeleton className="h-8 w-1/2 mb-4" />
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full mb-2" />)}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-card/30">
            <div className="p-4 flex flex-col gap-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight px-1">Chats</h2>
                    {canCreate && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => setShowCreateDialog(true)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations..."
                        className="pl-9 h-9 bg-background/50 border-transparent focus:border-primary/20 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 px-2 py-4">
                {workshopRooms.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2 flex items-center justify-between">
                            General
                            <Badge variant="outline" className="text-[9px] h-4 font-normal">{workshopRooms.length}</Badge>
                        </h3>
                        {workshopRooms.map(room => <RoomItem key={room._id} room={room} />)}
                    </div>
                )}

                {projectRooms.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2 flex items-center justify-between">
                            Projects
                            <Badge variant="outline" className="text-[9px] h-4 font-normal">{projectRooms.length}</Badge>
                        </h3>
                        {projectRooms.map(room => <RoomItem key={room._id} room={room} />)}
                    </div>
                )}

                {teamRooms.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2 flex items-center justify-between">
                            Teams
                            <Badge variant="outline" className="text-[9px] h-4 font-normal">{teamRooms.length}</Badge>
                        </h3>
                        {teamRooms.map(room => <RoomItem key={room._id} room={room} />)}
                    </div>
                )}

                {directRooms.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2 flex items-center justify-between">
                            Private Messages
                            <Badge variant="outline" className="text-[9px] h-4 font-normal">{directRooms.length}</Badge>
                        </h3>
                        {directRooms.map(room => <RoomItem key={room._id} room={room} />)}
                    </div>
                )}

                {rooms.length === 0 && !loading && (
                    <div className="px-4 py-12 text-center">
                        <MessageSquare className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No channels found</p>
                    </div>
                )}
            </ScrollArea>

            <CreateRoomDialog
                workshopId={workshopId}
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={(room) => {
                    setRooms(prev => [room, ...prev]);
                    onRoomSelect(room._id);
                }}
                projects={projects}
                teams={userTeams}
            />
        </div>
    );
};