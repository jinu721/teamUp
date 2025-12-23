import { Response, NextFunction } from 'express';
import { MessageService } from '../services/MessageService';
import { AuthRequest } from '../types';
import { ValidationError } from '../utils/errorHandler';

export class MessageController {
  private messageService: MessageService;

  constructor(messageService: MessageService) {
    this.messageService = messageService;
  }

  sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { projectId } = req.params;
      const { content, attachments } = req.body;

      if (!content) {
        throw new ValidationError('Message content is required');
      }

      const message = await this.messageService.sendMessage(
        projectId,
        userId,
        content,
        attachments || []
      );

      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  };

  getProjectMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { projectId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const messages = await this.messageService.getProjectMessages(projectId, userId, limit);

      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  };
}
