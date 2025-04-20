function createTag() {
    event.preventDefault();
    const name = document.getElementById('tagName').value.trim();
    const color = document.getElementById('tagColor').value;

    if (!name) {
        alert('El nombre de la etiqueta es requerido');
        return;
    }

    const user = JSON.parse(sessionStorage.user);
    
    fetch(local_url + 'tags', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.password
        },
        body: JSON.stringify({ name, color, id_user: user.id })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.message || 'Error al crear etiqueta') });
        }
        return response.json();
    })
    .then(newTag => {
        // Limpiar formulario y cerrar modal
        document.getElementById('tagName').value = '';
        document.getElementById('tagColor').value = '#563d7c';
        const modal = bootstrap.Modal.getInstance(document.getElementById('newTagModal'));
        if (modal) modal.hide();
        
        // Esperar 300ms antes de recargar para asegurar que el backend ha procesado
        setTimeout(() => {
            loadTags();
            alert('Etiqueta creada exitosamente');
        }, 300);
    })
    .catch(error => {
        alert(error.message);
        console.error("Error:", error);
    });
}

function updateTag() {
    event.preventDefault();
    const tagId = document.getElementById('editTagId').value;
    const name = document.getElementById('editTagName').value.trim();
    const color = document.getElementById('editTagColor').value;
    const user = JSON.parse(sessionStorage.user);

    if (!name) {
        alert('El nombre de la etiqueta es requerido');
        return;
    }

    fetch(`${local_url}tags/${tagId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.password
        },
        body: JSON.stringify({ name, color })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.message || 'Error al actualizar etiqueta') });
        }
        return response.json();
    })
    .then(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('editTagModal'));
        if (modal) modal.hide();
        
        // Esperar antes de recargar
        setTimeout(() => {
            loadTags();
            alert('Etiqueta actualizada exitosamente');
        }, 300);
    })
    .catch(error => {
        alert(error.message);
        console.error("Error:", error);
    });
}

function loadTags() {
    const user = JSON.parse(sessionStorage.user);
    const tagsDropdown = document.getElementById('tagsDropdown');
    
    if (!tagsDropdown) {
        console.error('Elemento tagsDropdown no encontrado');
        return;
    }
    
    // Limpiar completamente el dropdown (excepto los últimos 2 elementos)
    const itemsToPreserve = 2; // Separador y "Nueva Etiqueta"
    while (tagsDropdown.children.length > itemsToPreserve) {
        tagsDropdown.removeChild(tagsDropdown.children[0]);
    }

    fetch(local_url + 'tags', {
        headers: {
            'x-auth': user.password
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al obtener etiquetas');
        }
        return response.json();
    })
    .then(data => {
        if (data && data.data && data.data.length > 0) {
            // Eliminar posibles duplicados por ID
            const uniqueTags = [];
            const tagIds = new Set();
            
            data.data.forEach(tag => {
                if (!tagIds.has(tag.id)) {
                    tagIds.add(tag.id);
                    uniqueTags.push(tag);
                }
            });

            uniqueTags.forEach(tag => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.className = 'dropdown-item d-flex justify-content-between align-items-center';
                a.href = '#';
                a.innerHTML = `
                    <span class="badge" style="background-color: ${tag.color}">${tag.name}</span>
                    <i class="fas fa-pencil-alt ms-2" onclick="editTagPrompt(${tag.id}, event)"></i>
                `;
                li.appendChild(a);
                tagsDropdown.insertBefore(li, tagsDropdown.children[tagsDropdown.children.length - itemsToPreserve]);
            });
        } else {
            const li = document.createElement('li');
            li.innerHTML = '<span class="dropdown-item text-muted">No hay etiquetas</span>';
            tagsDropdown.insertBefore(li, tagsDropdown.children[tagsDropdown.children.length - itemsToPreserve]);
        }
    })
    .catch(error => {
        console.error("Error al cargar etiquetas:", error);
        const li = document.createElement('li');
        li.innerHTML = `<span class="dropdown-item text-danger">Error: ${error.message}</span>`;
        tagsDropdown.insertBefore(li, tagsDropdown.children[tagsDropdown.children.length - itemsToPreserve]);
    });
}
// tags_controller.js
function editTagPrompt(tagId, event) {
    event.stopPropagation();
    const user = JSON.parse(sessionStorage.user);
    
    fetch(`${local_url}tags/${tagId}`, {
        headers: {
            'x-auth': user.password
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al obtener etiqueta');
        }
        return response.json();
    })
    .then(tag => {
        // Llenar el modal de edición
        document.getElementById('editTagId').value = tag.id;
        document.getElementById('editTagName').value = tag.name;
        document.getElementById('editTagColor').value = tag.color;
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('editTagModal'));
        modal.show();
    })
    .catch(error => {
        console.error("Error:", error);
        alert(error.message);
    });
}

function deleteTag(event) {
    // Prevenir comportamiento por defecto y propagación
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const tagId = document.getElementById('editTagId').value;
    const user = JSON.parse(sessionStorage.user);

    // Confirmación más detallada
    const confirmation = confirm(`¿Estás seguro de que deseas eliminar esta etiqueta?\nEsta acción no se puede deshacer.`);
    if (!confirmation) {
        return;
    }

    fetch(`${local_url}tags/${tagId}`, {
        method: 'DELETE',
        headers: {
            'x-auth': user.password
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.message || 'Error al eliminar etiqueta') });
        }
        return response.json();
    })
    .then(() => {
        // Cerrar el modal de edición
        const modal = bootstrap.Modal.getInstance(document.getElementById('editTagModal'));
        if (modal) modal.hide();
        
        // Actualizar la lista de etiquetas
        loadTags();
        
        // Mostrar mensaje de éxito
        showAlert('success', 'Etiqueta eliminada exitosamente');
    })
    .catch(error => {
        showAlert('danger', error.message);
        console.error("Error:", error);
    });
}
// Añadir event listeners cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Formulario de creación de etiquetas
    const tagForm = document.querySelector('#newTagModal form');
    if (tagForm) {
        tagForm.addEventListener('submit', createTag);
    }

    // Formulario de edición de etiquetas
    const editTagForm = document.getElementById('editTagForm');
    if (editTagForm) {
        editTagForm.addEventListener('submit', updateTag);
    }

    const deleteTagBtn = document.querySelector('#editTagForm button.btn-danger');
    if (deleteTagBtn) {
        // Eliminar cualquier onclick existente
        deleteTagBtn.removeAttribute('onclick');
        
        // Añadir el nuevo listener
        deleteTagBtn.addEventListener('click', deleteTag);
    }

    // Cargar etiquetas al inicio si estamos en home.html o tasks.html
    if (window.location.href.includes('home.html') && window.location.href.includes('tasks.html')) {
        loadTags();
    }
});