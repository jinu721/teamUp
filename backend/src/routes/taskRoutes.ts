import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { authenticate } from '../middlewares/auth';
import { TaskService } from '../services/TaskService';

const router = Router();
const taskService = new TaskService();
const taskController = new TaskController(taskService);

router.use(authenticate);

router.post('/projects/:projectId/tasks', taskController.createTask);
router.get('/projects/:projectId/tasks', taskController.getProjectTasks);
router.put('/tasks/:id', taskController.updateTask);
router.put('/tasks/:id/status', taskController.updateTaskStatus);
router.delete('/tasks/:id', taskController.deleteTask);

export default router;
export { taskService };
