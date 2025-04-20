const express = require('express');
const routerTags = express.Router();
const TagsController = require('../controllers/tags_api_controller');

// Create a new tag
routerTags.post('/',TagsController.createTag);

// Get all tags
routerTags.get('/',TagsController.getAllTags);

// Get a tag by ID
routerTags.get('/:id', TagsController.authMiddleware,TagsController.getTagById);

// Update a tag by ID
routerTags.patch('/:id', TagsController.authMiddleware,TagsController.updateTag);

// Delete a tag by ID
routerTags.delete('/:id', TagsController.authMiddleware,TagsController.deleteTag);

module.exports = routerTags;