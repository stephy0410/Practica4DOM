
const fs = require('fs');
let users= JSON.parse(fs.readFileSync('./database/users.json'));
const User = require('../models/user');

exports.registerUser=(req,res) =>{
    try{
        if(req.body.password != req.body.confirm_password){
            res.status(400).send("Passwords Missmatch");
        }
        else{
            let new_user = new User(req.body.name, req.body.email,req.body.password);
            users.push(new_user.toObj());
            fs.writeFileSync('./database/users.json', JSON.stringify(users, null, 2));
            res.status(201).json(new_user.toObj());
        }
    }
    catch(err){
        console.log(err);
        res.status(400).send(err.errorMessage);
    }
}

exports.getAllUsers = (req, res) => {
    try {
        const authHeader = req.headers['x-auth'];
        if (!authHeader || authHeader !== 'admin_auth') {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const page = parseInt(req.query.page) ;
        const limit = parseInt(req.query.limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const paginatedUsers = users.slice(startIndex, endIndex);

        res.json({
            page,
            next_page: page + 1, 
            limit,
            total: users.length,
            data: paginatedUsers
        });
    } catch (err) {
        console.error(err);
        res.status(400).send("Error retrieving users");
    }
};
exports.authUsersMiddleware = (req, res, next) => {
    try {
        // 1. Obtener el ID del usuario y convertirlo a número
        let id_user = parseInt(req.params.id);
        if (isNaN(id_user)) {
            return res.status(400).json({ error: "ID de usuario inválido" });
        }
        
        // 2. Buscar usuario por ID 
        const user = users.find(user => user.id === id_user);
        if (!user) {
            return res.status(404).json({ error: `Usuario con ID ${id_user} no encontrado` });
        }
        
        // 3. Verificar si el header de autenticación existe
        const authHeader = req.headers['x-auth'];
        if (!authHeader) {
            return res.status(401).json({ error: 'Se requiere header x-auth' });
        }
        
        // 4. Validar contraseña
        if (user.password !== authHeader) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Almacenar el usuario en req para que esté disponible en el siguiente middleware/controlador
        req.user = user;

        next();
    } catch (err) {
        console.log(err);
        res.status(400).send("No se pudo validar");
    }
};

exports.getUserById = (req, res) => {
    try {
     
        res.json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            password: req.user.password,
            joined_at: req.user.joined_at 
        });

    } catch (error) {
        console.log(error);
        res.status(400).send("Error al obtener el usuario");
    }
};
exports.updateUser = (req, res) => {
    try {
       
        let userUpdated = false;
        
        if (req.body.name) {
            req.user.name = req.body.name;
            userUpdated = true;
        }
        
        if (req.body.email) {
            req.user.email = req.body.email;
            userUpdated = true;
        }
        
        if (req.body.password) {
            req.user.password = req.body.password;
            userUpdated = true;
        }
        
        if (!userUpdated) {
            return res.status(400).json({ error: "Al menos un campo se debe de enviar" });
        }
        
        
        //const index = users.findIndex(user => user.id === user);
        const index = users.findIndex(u => u.id === req.user.id);
        users[index] = req.user;
        
        
        fs.writeFileSync('./database/users.json', JSON.stringify(users, null, 2));
        
        res.json(req.user);
    }
    catch (err) {
        console.log(err);
        res.status(400).send("Error Actualizando Usuario");
    }
};

exports.deleteUser = (req, res) => {
    try {
        let id_user = parseInt(req.params.id);
        const userIndex = users.findIndex(user => user.id === id_user);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: `User with ID ${id_user} not found` });
        }


        const deletedUser = users[userIndex] ;

        // Remove user from array
        users.splice(userIndex, 1);

        // Save to file
        fs.writeFileSync('./database/users.json', JSON.stringify(users, null, 2));

        res.json({ 
            message: `Usser with ID ${id_user} deleted!` , 
            user: deletedUser
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).send("Error deleting user");
    }
};
exports.login = (req, res) => {
    let data = req.body, 
        user = users.find(user=>(user.email == data.email && user.password == data.password));
    if(user){
        res.send(user);
    }else{
        res.sendStatus(401);
    }
};

