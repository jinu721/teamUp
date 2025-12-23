import React, { useState } from 'react';
import { Task } from '../types';
import api from '../services/api';

interface TaskBoardProps {
  tasks: Task[];
  projectId: string;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, projectId }) => {
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTask(projectId, {
        title: newTaskTitle,
        description: newTaskDescription
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowNewTask(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const renderColumn = (title: string, tasks: Task[], status: string) => (
    <div style={{ flex: 1, minWidth: '300px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <h3>{title} ({tasks.length})</h3>
      <div style={{ minHeight: '400px' }}>
        {tasks.map(task => (
          <div
            key={task._id}
            style={{
              backgroundColor: '#fff',
              padding: '15px',
              marginBottom: '10px',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <h4>{task.title}</h4>
            {task.description && <p style={{ fontSize: '14px', color: '#666' }}>{task.description}</p>}
            {task.assignedTo && (
              <div style={{ fontSize: '12px', marginTop: '10px' }}>
                Assigned to: {task.assignedTo.name}
              </div>
            )}
            <div style={{ marginTop: '10px' }}>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task._id, e.target.value)}
                style={{ padding: '5px' }}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowNewTask(!showNewTask)}>
          {showNewTask ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {showNewTask && (
        <form onSubmit={handleCreateTask} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9' }}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <textarea
              placeholder="Task description"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              style={{ width: '100%', padding: '8px', minHeight: '80px' }}
            />
          </div>
          <button type="submit">Create Task</button>
        </form>
      )}

      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto' }}>
        {renderColumn('To Do', todoTasks, 'todo')}
        {renderColumn('In Progress', inProgressTasks, 'in_progress')}
        {renderColumn('Done', doneTasks, 'done')}
      </div>
    </div>
  );
};

export default TaskBoard;
