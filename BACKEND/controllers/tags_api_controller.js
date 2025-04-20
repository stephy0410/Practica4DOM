const fs = require('fs');
const Tag = require('../models/tag');
let users = JSON.parse(fs.readFileSync('./database/users.json'));
let tasks = JSON.parse(fs.readFileSync('./database/tasks.json'))
let tags = JSON.parse(fs.readFileSync('./database/tags.json'));
exports.authMiddleware = (req, res, next) => {
    const authHeader = req.headers['x-auth'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Se requiere header x-auth' });
    }

    // Find user by password
    const user = users.find(user => user.password === authHeader);
    if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    // 3. Parse and validate tagID
    const tagId = parseInt(req.params.id);
    if (isNaN(tagId)) {
        return res.status(400).json({ error: "ID de etiqueta inválido" });
    }
    
    // 4. Find task by ID
    const tag = tags.find(t => t.id === tagId);
    
    // 5. Check if task exists
    if (!tag) {
        return res.status(404).json({ error: `Etiqueta con ID ${tagId} no encontrada` });
    }

    // 6. Check if the user is authorized to access this task
    if (tag.id_user !== user.id) {
        return res.status(403).json({ error: 'No tienes permiso para acceder a esta etiqueta' });
    }

    req.tag = tag; 
    // Attach user ID to the request object
    req.userId = user.id; // Store the user ID for later use
    next();
};
exports.createTag = (req, res) => {
    try {
        const authHeader = req.headers['x-auth'];
        if (!authHeader) {
            return res.status(401).json({ error: 'Se requiere header x-auth' });
        }
    
        // Find user by password
        const user = users.find(user => user.password === authHeader);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        req.userId = user.id;
        const { name, color } = req.body;

        const newTag = new Tag(name, color, req.userId);
        tags.push(newTag.toObj());

        // Save to database
        fs.writeFileSync('./database/tags.json', JSON.stringify(tags, null, 2));

        res.status(201).json({
            message: "Etiqueta creada con éxito",
            tag: newTag.toObj()
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({
            error: err.message || 'Error al crear la etiqueta'
        });
    }
};

exports.getAllTags = (req, res) => {
    try {
        const authHeader = req.headers['x-auth'];
        if (!authHeader) {
            return res.status(401).json({ error: 'Se requiere header x-auth' });
        }
        
        const user = users.find(user => user.password === authHeader);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        const userId = user.id;
        
        // Filtrar y eliminar duplicados
        const userTags = [];
        const tagIds = new Set();
        
        tags.forEach(tag => {
            if (tag.id_user == userId && !tagIds.has(tag.id)) {
                tagIds.add(tag.id);
                userTags.push(tag);
            }
        });
        
        res.json({
            page: 1,
            limit: userTags.length,
            next_page: null,
            total: userTags.length,
            data: userTags
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: 'Error al obtener las etiquetas'
        });
    }
};

exports.getTagById = (req, res) => {
    try {
        const tag = req.tag;
        res.json({
            id: tag.id,
            name: tag.name,
            color: tag.color,
            id_user: tag.id_user
        });
        } catch (err) {
            console.log(err);
            res.status(400).json({
                error: 'Error al obtener la etiqueta'
            });
        }
};

exports.updateTag = (req, res) => {
   
    const tagId = parseInt(req.params.id);
    const tagIndex = tags.findIndex(t => t.id === tagId);

    if (tagIndex === -1) {
        return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    try {
        const { name, color } = req.body;
        const tag = tags[tagIndex];

        if (name) tag.name = name;
        if (color) tag.color = color;

        // Save to database
        fs.writeFileSync('./database/tags.json', JSON.stringify(tags, null, 2));

        res.status(200).json({
            message: "Etiqueta actualizada con éxito",
            tag: tag
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({
            error: err.message || 'Error al actualizar la etiqueta'
        });
    }
};

exports.deleteTag = (req, res) => {
    try {

        const tagId = parseInt(req.params.id);
        const tagIndex = tags.findIndex(t => t.id === tagId);

        if (tagIndex === -1) {
            return res.status(404).json({ error: 'Etiqueta no encontrada' });
        }

        // Check if the tag is assigned to any tasks
        const isAssignedToTask = tasks.some(task => task.tags.includes(tagId));
        if (isAssignedToTask) {
            return res.status(400).json({ error: 'No se puede eliminar la etiqueta porque está asignada a una tarea' });
        }
        const deletedTag = tags[tagIndex];
        tags.splice(tagIndex, 1); // Remove the tag from the array

        // Save to database
        fs.writeFileSync('./database/tags.json', JSON.stringify(tags, null, 2));
        
        res.status(200).json({ 
            message: 'Etiqueta eliminada con éxito',
            tag: deletedTag
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({
            error: 'Error al eliminar la etiqueta'
        });
    }
};