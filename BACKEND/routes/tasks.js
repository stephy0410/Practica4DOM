const express = require('express');
const routerTasks = express.Router();
const TasksController = require('../controllers/tasks_api_controller');


routerTasks.post('/', TasksController.createTask); 
routerTasks.get('/', TasksController.getAllTasks);
routerTasks.get('/:id',TasksController.authTaksMiddleware, TasksController.getTaskById);

routerTasks.patch('/:id', TasksController.authTaksMiddleware, TasksController.updateTask);
routerTasks.delete('/:id', TasksController.authTaksMiddleware, TasksController.deleteTask);

module.exports = routerTasks;


