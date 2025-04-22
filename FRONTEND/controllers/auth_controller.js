// auth_controller.js
function toggleForms(){
    let form_login = document.getElementById('formLogin'),
        form_register = document.getElementById('formRegister');
        
    if(form_register.style.display == 'none'){
        form_login.style.display = 'none';
        form_register.style.display = 'block';
    }
    else{
        form_login.style.display = 'block';
        form_register.style.display = 'none';
    }
}
function register() {
    event.preventDefault();
    let form = document.getElementById('formRegister');
    let data = new FormData(form);
    
    // Validar que las contraseñas coincidan
    const password = form.querySelector('#registerPassword').value;
    const confirmPassword = form.querySelector('#registerConfirmPassword').value;
    
    if(password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }
    
    fetch(local_url + 'users', { // Asegúrate de que esta ruta es correcta
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(data.entries()))
    })
    .then(response => {
        if(!response.ok) {
            return response.json().then(err => { throw new Error(err.message) });
        }
        return response.json();
    })
    .then(user => {
        // 1. Almacenar usuario en sessionStorage
        sessionStorage.setItem('user', JSON.stringify(user));
        
        // 2. Redirigir a home.html
        window.location.href = local_url + 'home.html';
    })
    .catch(error => {
        alert(error.message);
        console.error("Error:", error);
    });
}

function login(){
    event.preventDefault();
    let form = document.getElementById('formLogin');
    let data = new FormData(form);
    
    fetch(local_url + 'login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(data.entries()))
    })
    .then(response => {
        if(response.ok) {
            return response.json();
        } else {
            throw new Error('Credenciales incorrectas');
        }
    })
    .then(user => {
        sessionStorage.setItem('user', JSON.stringify(user));
        window.location.href = local_url + 'home.html';
    })
    .catch(error => {
        alert(error.message);
        console.error("Error:", error);
    });
}
document.addEventListener('DOMContentLoaded', function () {
    const formRegister = document.getElementById('formRegister');
    if (formRegister) {
        formRegister.addEventListener('submit', register);
    }

    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', login);
    }
});

function logout(){
    sessionStorage.clear();
    window.location.href = local_url;
}
window.logout = logout;

function populateModal() {
    try {
        const userStr = sessionStorage.getItem('user');
        if (!userStr) return;
        
        const user = JSON.parse(userStr);
        // Manejar tanto la estructura antigua como la nueva
        const userData = user.user || user;
        
        if (userData) {
            document.getElementById('editName').value = userData.name || '';
            document.getElementById('editEmail').value = userData.email || '';
            document.getElementById('editPassword').value = userData.password || '';
        }
    } catch (e) {
        console.error("Error al poblar el modal:", e);
    }
}

document.getElementById('editUserModal').addEventListener('shown.bs.modal', populateModal);


function updateUser() {
    event.preventDefault();
    const user = JSON.parse(sessionStorage.user);
    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const password = document.getElementById('editPassword').value.trim();

    if (!name || !email || !password) {
        alert("Todos los campos son obligatorios, incluyendo la contraseña.");
        return;
    }

    const data = {
        name,
        email,
        password 
    };

    fetch(local_url+'users/'+user.id, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.password
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if(!response.ok) {
            return response.json().then(err => { throw new Error(err.error || err.message) });
        }
        return response.json();
    })
    .then(updatedUser => {
        // Asegurarnos de que tenemos el objeto usuario directamente
        const userData = updatedUser.user || updatedUser;
        
        // Actualizar sessionStorage con todos los datos del usuario
        sessionStorage.setItem('user', JSON.stringify({
            ...userData,
            password: password 
        }));
        
       
        init();
        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        if (modal) modal.hide();
        
        alert("Usuario actualizado exitosamente.");
    })
    .catch(err => {
        console.error("Error al actualizar usuario:", err);
        alert(err.message || "Error al actualizar usuario");
    });
}
function init() {
    console.log('Iniciando carga de datos...');
    
    // Verificar autenticación primero
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
        console.error('Usuario no autenticado');
        window.location.href = local_url;
        return;
    }

    try {
        const user = JSON.parse(userStr);
        console.log('Usuario autenticado:', user);

        // Actualizar nombre de usuario
        const userNameElement = document.getElementById('userNameWidget');
        if (userNameElement) {
            userNameElement.innerText = user.name || 'Usuario';
        }

        // Cargar etiquetas solo si no se han cargado ya
        if (typeof loadTags === 'function' && !window.tagsLoaded) {
            console.log('Cargando etiquetas...');
            window.tagsLoaded = true; // Marcar como cargadas
            loadTags();
        }

    } catch (e) {
        console.error("Error al cargar datos del usuario:", e);
    }
}

document.addEventListener('DOMContentLoaded', init);

function deleteUser() {
    const user = JSON.parse(sessionStorage.user);
    const password = prompt("Por seguridad, ingresa tu contraseña para confirmar:");

    if (!password) return;

    fetch(`${local_url}users/${user.id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.password
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || err.message); });
        }
        return response.json();
    })
    .then(() => {
        sessionStorage.clear();
        alert("Cuenta eliminada exitosamente.");
        window.location.href = local_url;
    })
    .catch(err => {
        console.error("Error al eliminar usuario:", err);
        alert(err.message || "Error al eliminar usuario");
    });
}

function confirmDelete() {
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('confirmDeleteModal'));
    modal.show();
}