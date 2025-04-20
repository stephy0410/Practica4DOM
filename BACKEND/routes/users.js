const express = require('express');

const routerUsers = express.Router();
const usersController = require('../controllers/users_api_controller');


routerUsers.post('/', usersController.registerUser);

routerUsers.get('/', usersController.getAllUsers);

routerUsers.use('/:id', usersController.authUsersMiddleware);
routerUsers.get('/:id', usersController.getUserById);

routerUsers.patch('/:id', usersController.authUsersMiddleware, usersController.updateUser);

routerUsers.delete('/:id', usersController.authUsersMiddleware, usersController.deleteUser);

module.exports = routerUsers;
