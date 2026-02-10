export interface ISocketService {
    emitToWorkshop(workshopId: string, event: string, data: any): void;
    emitToTeam(teamId: string, event: string, data: any): void;
    emitToUser(userId: string, event: string, data: any): void;
    emitToProject(projectId: string, event: string, data: any): void;
    emitToChatRoom(roomId: string, event: string, data: any): void;
    emitToCommunity(event: string, data: any): void;
    emitToAll(event: string, data: any): void;
    isUserOnline(userId: string): boolean;
    getOnlineUsersCount(): number;
}
