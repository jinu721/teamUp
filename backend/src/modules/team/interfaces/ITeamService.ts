import { ITeam, CreateTeamDTO, UpdateTeamDTO } from '../types/index';
import { ISocketService } from '../../../shared/interfaces/ISocketService';

export interface ITeamService {
    setSocketService(socketService: ISocketService): void;
    createTeam(workshopId: string, actorId: string, data: CreateTeamDTO): Promise<ITeam>;
    getTeam(teamId: string): Promise<ITeam>;
    getWorkshopTeams(workshopId: string): Promise<ITeam[]>;
    getUserTeamsInWorkshop(workshopId: string, userId: string): Promise<ITeam[]>;
    updateTeam(teamId: string, actorId: string, updates: UpdateTeamDTO): Promise<ITeam>;
    deleteTeam(teamId: string, actorId: string): Promise<void>;
    addMemberToTeam(teamId: string, actorId: string, userId: string): Promise<ITeam>;
    removeMemberFromTeam(teamId: string, actorId: string, userId: string): Promise<ITeam>;
    assignInternalRole(teamId: string, actorId: string, userId: string, roleName: string): Promise<ITeam>;
    removeInternalRole(teamId: string, actorId: string, userId: string, roleName: string): Promise<ITeam>;
    isMember(teamId: string, userId: string): Promise<boolean>;
    getMemberCount(teamId: string): Promise<number>;
}
