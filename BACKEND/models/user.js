const fs = require('fs');
let users= JSON.parse(fs.readFileSync('./database/users.json'));

function getNextUserID(){
    return users.length + 1;
}
class UserException{
    constructor(errorMessage){
        this.errorMessage = errorMessage;
    }
}
class User{
    #id;
    #name;
    #email;
    #password;
    #joined_at;
    
    constructor(name,email,password){
        this.#id = getNextUserID();
        this.name= name;
        this.email = email;
        this.password = password;
        this.#joined_at = new Date();
    }
    get name(){
        return this.#name;
    }
    get email(){
        return this.#email;
    }
    get password(){
        return this.#password;
    }
    get id(){
        return this.#id;
    }
    get joined_at(){
        return this.#joined_at;
    }
    set id(value){
        throw new UserException("IDs are auto-generated");
    }
    set name(value){
        if (value == null && value == "") {
            throw new UserException("Name cannot be empty");
        }
        this.#name = value;
    }
    set password(value){
        if (value == null && value == "") {
            throw new UserException("Password cannot be empty");
        }
        this.#password = value;
        
        if (value.length < 8) {
            throw new UserException("Password must be at least 8 characters long");
        }
        this.#password = value;
        if (users.some(user => user.password === value)) {
            throw new UserException("La contraseña ya está registrada.");
        }
        this.#password = value;
    }
    set email(value){
        console.log(users);
        if (value == null && value == "") {
            throw new UserException("Email cannot be empty");
        }
        if (users.some(user => user.email === value)) {
            throw new UserException("El email ya está registrado.");
        }
        this.#email = value;
    }
    set joined_at(value){
        throw new UserException("Dates are auto-generated");
    }
    toObj() {
        return{
            id: this.id,
            name: this.name,
            email:this.email,
            password:this.password,
            joined_at: this.joined_at
        };
    }
}
module.exports = User;
