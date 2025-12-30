import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('TodoTools');

export interface TodoTask {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface TodoManagerArgs {
  action: 'add_task' | 'set_tasks' | 'mark_all_done' | 'move_to_task' | 'read_list';
  task?: string;
  tasks?: string[];
  moveToTask?: string;
  taskNameActive: string;
  taskNameComplete: string;
}

let todoList: TodoTask[] = [];

export function manageTodo(args: TodoManagerArgs) {
  logger.info('Managing todos, action:', args.action);

  switch (args.action) {
    case 'set_tasks': {
      if (!args.tasks || args.tasks.length === 0) {
        throw new Error('tasks array is required for set_tasks action');
      }

      todoList = args.tasks.map((task, index) => ({
        content: task,
        status: index === 0 ? 'in_progress' : 'pending',
      }));

      logger.info('Set', todoList.length, 'tasks');

      return {
        action: 'set_tasks',
        tasks: todoList,
        message: `Created ${todoList.length} tasks. First task is now in progress.`,
      };
    }

    case 'add_task': {
      if (!args.task) {
        throw new Error('task is required for add_task action');
      }

      const newTask: TodoTask = {
        content: args.task,
        status: 'pending',
      };

      todoList.push(newTask);

      logger.info('Added task:', args.task);

      return {
        action: 'add_task',
        task: newTask,
        tasks: todoList,
        message: `Added task: ${args.task}`,
      };
    }

    case 'move_to_task': {
      if (!args.moveToTask) {
        throw new Error('moveToTask is required for move_to_task action');
      }

      const targetIndex = todoList.findIndex((t) => t.content === args.moveToTask);

      if (targetIndex === -1) {
        throw new Error(`Task "${args.moveToTask}" not found in todo list`);
      }

      for (let i = 0; i < todoList.length; i++) {
        if (i < targetIndex) {
          todoList[i].status = 'completed';
        } else if (i === targetIndex) {
          todoList[i].status = 'in_progress';
        } else {
          todoList[i].status = 'pending';
        }
      }

      logger.info('Moved to task:', args.moveToTask);

      return {
        action: 'move_to_task',
        currentTask: todoList[targetIndex],
        tasks: todoList,
        message: `Now working on: ${args.moveToTask}`,
      };
    }

    case 'mark_all_done': {
      todoList.forEach((task) => {
        task.status = 'completed';
      });

      logger.info('Marked all tasks as done');

      return {
        action: 'mark_all_done',
        tasks: todoList,
        message: 'All tasks marked as completed!',
      };
    }

    case 'read_list': {
      return {
        action: 'read_list',
        tasks: todoList,
        totalTasks: todoList.length,
        pendingTasks: todoList.filter((t) => t.status === 'pending').length,
        inProgressTasks: todoList.filter((t) => t.status === 'in_progress').length,
        completedTasks: todoList.filter((t) => t.status === 'completed').length,
      };
    }

    default: {
      throw new Error(`Unknown action: ${args.action}`);
    }
  }
}

export function getTodoList(): TodoTask[] {
  return todoList;
}

export function clearTodoList(): void {
  todoList = [];
  logger.info('Cleared todo list');
}
