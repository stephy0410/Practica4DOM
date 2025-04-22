const fs = require('fs');
const Task = require('../models/task');


// Load data from JSON files
let tasks = JSON.parse(fs.readFileSync('./database/tasks.json'));
let users = JSON.parse(fs.readFileSync('./database/users.json'));


// CREATE - POST /tasks
exports.createTask = (req, res) => {
    try {
        const authHeader = req.headers['x-auth'];
        if (!authHeader) {
            return res.status(401).json({ error: 'Se requiere header x-auth' });
        }

        users = JSON.parse(fs.readFileSync('./database/users.json'));
        const user = users.find(user => user.password === authHeader);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Validar campos
        if (!req.body.title || !req.body.id_user || !req.body.due_date) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: title, id_user, due_date'
            });
        }

        if (user.id !== req.body.id_user) {
            return res.status(403).json({
                error: 'No puedes crear tareas para otro usuario'
            });
        }

        // Recargar tareas del archivo (por si hay cambios recientes)
        tasks = JSON.parse(fs.readFileSync('./database/tasks.json'));

        // Obtener nuevo ID
        const newId = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

        // Crear tarea
        let new_task = new Task(
            req.body.title,
            req.body.id_user,
            req.body.due_date,
            req.body.status || "A",
            req.body.tags || [],
            req.body.description || ""
        );

        // Convertir a objeto y asignar el ID generado
        let taskObj = new_task.toObj();
        taskObj.id = newId;

        // Guardar
        tasks.push(taskObj);
        fs.writeFileSync('./database/tasks.json', JSON.stringify(tasks, null, 2));

        res.status(201).json({
            message: "Tarea creada con éxito",
            task: taskObj
        });
    } catch (err) {
        console.log(err); // Log para depuración
        res.status(500).json({
            error: err.message || 'Error al crear la tarea'
        });
    }
};

exports.getAllTasks = (req, res) => {
    try {
        // 1. Get authentication header
        const authHeader = req.headers['x-auth'];
        if (!authHeader) {
            return res.status(401).json({ error: 'Se requiere header x-auth' });
        }
        
        // 2. Find user by password
        const user = users.find(user => user.password === authHeader);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        // 3. Filter tasks by user ID
        const userId = user.id;
        const userTasks = tasks.filter(task => task.id_user === userId);
        
        // 4. Implement pagination
        const page = parseInt(req.query.page); // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) ; // Default to 10 items per page if not provided
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        // Slice the userTasks array for pagination
        const paginatedTasks = userTasks.slice(startIndex, endIndex);

        // 5. Prepare response
        const response = {
            page: page,
            limit: limit,
            next_page: page + 1 , // Provide next page if available
            total: userTasks.length,
            data: paginatedTasks
        };

        // 6. Return response
        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: 'Error al obtener las tareas'
        });
    }
};
exports.authTaksMiddleware = (req, res, next) => {
    try {
       // 1. Get authentication header
       const authHeader = req.headers['x-auth'];
       if (!authHeader) {
           return res.status(401).json({ error: 'Se requiere header x-auth' });
       }
       
       // 2. Find user by password
       const user = users.find(user => user.password === authHeader);
       if (!user) {
           return res.status(401).json({ error: 'Credenciales inválidas' });
       }

       // 3. Parse and validate task ID
       const taskId = parseInt(req.params.id);
       if (isNaN(taskId)) {
           return res.status(400).json({ error: "ID de tarea inválido" });
       }
       
       // 4. Find task by ID
       const task = tasks.find(t => t.id === taskId);
       
       // 5. Check if task exists
       if (!task) {
           return res.status(404).json({ error: `Tarea con ID ${taskId} no encontrada` });
       }

       // 6. Check if the user is authorized to access this task
       if (task.id_user !== user.id) {
           return res.status(403).json({ error: 'No tienes permiso para acceder a esta tarea' });
       }

       req.task = task; // Store the task in the request object
       req.user = user; // Store the user in the request object
       
       next();
    } catch (err) {
        console.log(err);
        res.status(400).send("No se pudo validar");
    }
};
exports.getTaskById = (req, res)=>{
    try {
        const task = req.task;
        res.json({
            id: task.id,
            title: task.title,
            id_user: task.id_user,
            due_date: task.due_date,
            status: task.status,
            tags: task.tags,
            description: task.description
        });
        } catch (err) {
            console.log(err);
            res.status(400).json({
                error: 'Error al obtener la tarea'
            });
        }
};
exports.updateTask = (req, res) => {
    try {
       
        let taskUpdated = false;
        
        if (req.body.title) {
            req.task.title = req.body.title;
            taskUpdated = true;
        }
        
        if (req.body.id_user) {
            req.task.id_user = req.body.id_user;
            taskUpdated = true;
        }
        
        if (req.body.due_date) {
            req.task.due_date = req.body.due_date;
            taskUpdated = true;
        }
        if (req.body.status) {
            req.task.status = req.body.status;
            taskUpdated = true;
        }
        if (req.body.tags) {
            req.task.tags = req.body.tags;
            taskUpdated = true;
        }
        if (req.body.description) {
            req.task.description = req.body.description;
            taskUpdated = true;
        }
        
        if (!taskUpdated) {
            return res.status(400).json({ error: "Al menos un campo se debe de enviar" });
        }
        
        
        const index = tasks.findIndex(task => task.id === task);
        tasks[index] = req.task;
        
        
        fs.writeFileSync('./database/tasks.json', JSON.stringify(tasks, null, 2));
        
        res.json({ 
            message: "task updated!", 
            task: req.task 
        });
    }
    catch (err) {
        console.log(err);
        res.status(400).send("Error Actualizando Task");
    }
};

// DELETE - DELETE /tasks/:id
exports.deleteTask = (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        // Check if task exists
        if (taskIndex === -1) {
            return res.status(404).json({
                error: 'Tarea no encontrada'
            });
        }
        
        // Check if user owns the task
        if (tasks[taskIndex].id_user !== req.user.id) {
            return res.status(403).json({
                error: 'No tienes permiso para eliminar esta tarea'
            });
        }
        
        // Store the task to return in response
        const deletedTask = tasks[taskIndex];
        
        // Remove task from array
        tasks.splice(taskIndex, 1);
        
        // Save to database
        fs.writeFileSync('./database/tasks.json', JSON.stringify(tasks, null, 2));
        
        // Return success response
        res.json({
            message: 'Tarea eliminada con éxito',
            task: deletedTask
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({
            error: 'Error al eliminar la tarea'
        });
    }
};



