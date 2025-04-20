const fs = require('fs');
let tasks= JSON.parse(fs.readFileSync('./database/tasks.json'));
const data = {
    users: JSON.parse(fs.readFileSync('./database/users.json')),
    tags: JSON.parse(fs.readFileSync('./database/tags.json')) 
};
function getNextTaskID(){
    return tasks.length+1;
}
class TaskException{
    constructor(errorMessage){
        this.errorMessage = errorMessage;
    }
}
class Task{
    #id;
    #title;
    #due_date;
    #id_user;
    #status;
    #tags;
    #description;
    constructor(title,id_user,due_date,status,tags,description){
        this.#id = getNextTaskID();
        this.title= title;
        this.id_user = id_user;
        this.due_date= due_date;
        this.status = status;
        this.tags = tags;
        this.description = description;
    }
    get id(){
        return this.#id;
    }
    get title(){
        return this.#title;
    }
    get due_date(){
        return this.#due_date;
    }
    get description() {
        return this.#description;
    }
    get id_user(){
        return this.#id_user;
    }
    get status(){
        return this.#status;
    }
    get tags(){
        return this.#tags;
    }
    set id(value){
        throw new TaskException("IDs are auto-generated");
    }
    set title(value){
        if (value == null && value == "") {
            throw new TaskException("Title cannot be empty");
        }
        this.#title = value;
    }
    set due_date(value){
        const date = new Date(value);
        if(isNaN(date.getTime())){
            throw new TaskException("Date format incorrect");
        }
        this.#due_date = value;
    }
    set description(value) {
        this.#description = value;
    }
    set status(value){
        if(value != 'A' && value!= 'F' && value != 'C'){
            throw new TaskException("Status must be one of the following values: A/F/C (Active, Finished, Cancelled)");
        }
        this.#status = value;
    }
    
    set  tags(value){
       // Si value es undefined o null, asignar un array vacío
        if (value == null) {
            this.#tags = [];
            return;
        }
        
        // Si value no es un array, lanzar excepción
        if (!Array.isArray(value)) {
            throw new TaskException("Tags must be an array");
        }
        
        // Si el array está vacío, asignarlo directamente
        if (value.length === 0) {
            this.#tags = [];
            return;
        }
        if (!value.every(tagID => data.tags.some(tag => tag.id === tagID))) {
            throw new TaskException("Some tags do not exist.");
        }
        this.#tags = value;
    }
    set id_user(value) {
        const userId = parseInt(value); // Convert to integer
        const userExists = data.users.find(user => user.id === userId);
        if (!userExists) {
            throw new TaskException(`id_user with ID ${userId} does not exist`);
        }
        this.#id_user = userId; // Store the integer value
    }
    toObj() {
        return {
            id: this.id,
            title: this.title,
            id_user: this.id_user,
            due_date: this.due_date,
            status: this.status,
            tags: this.tags,
            description: this.description
        };
    }
}
module.exports = Task;