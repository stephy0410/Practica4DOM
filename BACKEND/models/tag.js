const fs = require('fs');
let tags= JSON.parse(fs.readFileSync('./database/tags.json'));
const data = {
    users: JSON.parse(fs.readFileSync('./database/users.json')),
};
function getNextTagID(){
    return tags.length+1;
}
class TagException{
    constructor(errorMessage){
        this.errorMessage = errorMessage;
    }
}
class Tag{
    #id;
    #name;
    #color;
    #id_user;
    constructor(name,color,id_user){
        this.#id = getNextTagID();
        this.name= name;
        this.color = color;
        this.id_user = id_user;
    }
    get id(){
        return this.#id;
    }
    get name(){
        return this.#name;
    }
    get color(){
        return this.#color;
    }
    get id_user() {
        return this.#id_user;
    }
    set id(value){
        throw new TagException("IDs are auto-generated");
    }
    set name(value){
        if (value == null && value == "") {
            throw new TagException("Name cannot be empty");
        }
        this.#name = value;
    }
    set color(value){
        if (value == null && value == "") {
            throw new TagException("Color cannot be empty");
        }
        
        let hexColor = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
        if (!hexColor.test(value)) {
            throw new TagException("Color must be a valid hexadecimal value");
        }
        
        this.#color = value;

    }
    set id_user(value) {
        const userId = parseInt(value); // Convert to integer
        const userExists = data.users.find(user => user.id === userId);
        if (!userExists) {
            throw new TaskException(`id_user with ID ${userId} does not exist`);
        }
        this.#id_user = userId; // Store the integer value
        if (value == null || value === "") {
            throw new TagException("User  ID cannot be empty");
        }
        this.#id_user = value; 
    }
    toObj() {
        return {
            id: this.id,
            name: this.name,
            color: this.#color,
            id_user: this.id_user
        };
    }
}
module.exports = Tag;
