import { ITeam, CreateTeamDTO, UpdateTeamDTO } from '../../../shared/types/index';

export interface ITeamRepository {
    create(workshopId: string, teamData: CreateTeamDTO): Promise<ITeam>;
    findById(id: string): Promise<ITeam | null>;
    findByIds(ids: string[]): Promise<ITeam[]>;
    findByWorkshop(workshopId: string): Promise<ITeam[]>;
    findByMemberInWorkshop(workshopId: string, userId: string): Promise<ITeam[]>;
    update(id: string, updates: UpdateTeamDTO): Promise<ITeam>;
    delete(id: string): Promise<void>;
    deleteByWorkshop(workshopId: string): Promise<void>;
    addMember(teamId: string, userId: string): Promise<ITeam>;
    removeMember(teamId: string, userId: string): Promise<ITeam>;
    isMember(teamId: string, userId: string): Promise<boolean>;
    countMembers(teamId: string): Promise<number>;
    assignInternalRole(teamId: string, roleName: string, userId: string): Promise<ITeam>;
    removeInternalRole(teamId: string, roleName: string, userId: string): Promise<ITeam>;
    getUserInternalRoles(teamId: string, userId: string): Promise<string[]>;
    countByWorkshop(workshopId: string): Promise<number>;
}
