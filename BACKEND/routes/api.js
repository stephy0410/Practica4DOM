

const express = require('express');
const path = require('path');
const usersRoutes = require('./users');
const tasksRoutes = require('./tasks');
const tagsRoutes = require('./tags');
const usersControllers = require('../controllers/users_api_controller');

const routerApi = express.Router();
routerApi.use(express.json()); 
routerApi.get('/', (req, res) => {
    const authHeader = req.headers['x-auth'];
    if (authHeader) {
        return res.sendFile(path.resolve(__dirname + "/../../FRONTEND/views/home.html"));
    }
    res.sendFile(path.resolve(__dirname + "/../../FRONTEND/views/login.html"));
});

routerApi.get('/home.html', (req, res) => {
    res.sendFile(path.resolve(__dirname + "/../../FRONTEND/views/home.html"));
});

routerApi.get('/tasks.html', (req, res) => {
    res.sendFile(path.resolve(__dirname + "/../../FRONTEND/views/tasks.html"));
});

routerApi.get('/login.html', (req, res)=> res.sendFile(path.resolve(__dirname+"/../../FRONTEND/views/login.html")));
routerApi.use('/tasks', tasksRoutes);
routerApi.use('/tags', tagsRoutes);
routerApi.use('/users',usersRoutes);
routerApi.post('/login',usersControllers.login);


module.exports=routerApi;