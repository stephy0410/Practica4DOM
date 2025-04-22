function createTask(event) {
    event.preventDefault();

    const title = document.getElementById('taskName').value.trim();
    const due_date = document.getElementById('taskDate').value;
    const tagValue = document.getElementById('taskTag').value;
    const tags = tagValue ? [parseInt(tagValue)] : [];
    const user = JSON.parse(sessionStorage.user);

    if (!title || !due_date ) {
        alert("Todos los campos son obligatorios.");
        return;
    }

    const newTask = {
        title,
        due_date,
        id_user: user.id,
        status: "A",
        tags, 
        description: ""
    };
    

    fetch(local_url + 'tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.password
        },
        body: JSON.stringify(newTask)
    })
    .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.error); });
        return res.json();
    })
    .then(() => {
        alert("Tarea creada exitosamente.");
        document.getElementById('taskName').value = '';
        document.getElementById('taskDate').value = '';
        document.getElementById('taskTag').value = '';
        const modal = bootstrap.Modal.getInstance(document.getElementById('newTaskModal'));
        if (modal) modal.hide();
        setTimeout(() => {
            loadAllTasks(); // función para refrescar tareas
        }, 300);
    })
    .catch(error => {
        alert(error.message);
        console.error("Error al crear tarea:", error);
    });
}
function populateTaskTagOptions() {
    const user = JSON.parse(sessionStorage.user);
    fetch(local_url + 'tags', {
        headers: {
            'x-auth': user.password
        }
    })
    .then(res => res.json())
    .then(data => {
        const select = document.getElementById('taskTag');
        select.innerHTML = '<option value="">Sin etiqueta</option>'; // esta línea permite dejarlo vacío

        data.data.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag.id;
            option.textContent = tag.name;
            select.appendChild(option);
        });
    })
    .catch(err => {
        console.error("Error al cargar etiquetas:", err);
    });
}


function loadAllTasks(page = 1) {
    const user = JSON.parse(sessionStorage.user);

    fetch(`${local_url}tasks?page=${page}&limit=10`, {
        headers: { 'x-auth': user.password }
    })
    .then(res => {
        if (!res.ok) throw new Error("Error al obtener tareas");
        return res.json();
    })
    .then(data => {
        renderTasks(data.data); // Función para mostrar tareas en la tabla
        renderPagination(data.total, page); // Función para mostrar botones de página
    })
    .catch(err => {
        console.error(err);
        alert("No se pudieron cargar las tareas");
    });
}
function renderTasks(tasks) {
    const tbody = document.querySelector('tbody'); // ajusta el selector si tienes más de una tabla
    tbody.innerHTML = '';

    tasks.forEach(task => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td><input type="checkbox" ${task.status === 'F' ? 'checked' : ''}></td>
            <td>${task.status === 'F' ? `<del>${task.title}</del>` : task.title}</td>
            <td>${(task.tags || []).map(tagId => `<span class="badge bg-secondary">${tagId}</span>`).join(' ')}</td>
            <td>${task.due_date}</td>
            <td>
                <i class="fas fa-pen" style="cursor:pointer; color:blue;" onclick="editTaskPrompt(${task.id})" title="Editar"></i>
                <i class="fas fa-trash" style="cursor:pointer; color:red;" onclick="deleteTask(${task.id})" title="Eliminar"></i>
            </td>
        `;

        tbody.appendChild(tr);
    });
}
function renderPagination(total, currentPage) {
    const paginationContainer = document.getElementById('pagination-tasks');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(total / 10);
    paginationContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-light'} m-1`;
        btn.innerText = i;
        btn.onclick = () => loadAllTasks(i);
        paginationContainer.appendChild(btn);
    }
}
function editTaskPrompt(taskId) {
    const user = JSON.parse(sessionStorage.user);

    fetch(`${local_url}tasks/${taskId}`, {
        headers: { 'x-auth': user.password }
    })
    .then(res => res.json())
    .then(task => {
        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTaskName').value = task.title;
        document.getElementById('editTaskDate').value = task.due_date;

        // Cargar opciones de etiquetas
        return fetch(local_url + 'tags', {
            headers: { 'x-auth': user.password }
        })
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('editTaskTag');
            select.innerHTML = '';
            data.data.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag.id;
                option.textContent = tag.name;
                if (task.tags.includes(tag.id)) option.selected = true;
                select.appendChild(option);
            });

            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
            modal.show();
        });
    })
    .catch(err => {
        console.error("Error al obtener tarea:", err);
        alert("No se pudo cargar la tarea.");
    });
}
function updateTask(event) {
    event.preventDefault();

    const user = JSON.parse(sessionStorage.user);
    const id = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskName').value.trim();
    const due_date = document.getElementById('editTaskDate').value;
    const tagValue = document.getElementById('taskTag').value;
    const tags = tagValue ? [parseInt(tagValue)] : [];

    if (!title || !due_date) {
        alert("Todos los campos son obligatorios");
        return;
    }

    const data = {
        title,
        due_date,
        tags
    };

    fetch(`${local_url}tasks/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.password
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(() => {
        alert("Tarea actualizada");
        const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
        if (modal) modal.hide();
        loadAllTasks();
    })
    .catch(err => {
        console.error("Error al actualizar tarea:", err);
        alert("No se pudo actualizar la tarea");
    });
}
function deleteTask(id) {
    const user = JSON.parse(sessionStorage.user);
    const confirmDelete = confirm("¿Estás seguro de que deseas eliminar esta tarea?");

    if (!confirmDelete) return;

    fetch(`${local_url}tasks/${id}`, {
        method: 'DELETE',
        headers: {
            'x-auth': user.password
        }
    })
    .then(res => {
        if (!res.ok) throw new Error("No se pudo eliminar la tarea");
        return res.json();
    })
    .then(() => {
        alert("Tarea eliminada");
        loadAllTasks(); // recarga las tareas
    })
    .catch(err => {
        console.error("Error al eliminar tarea:", err);
        alert("Error al eliminar tarea");
    });
}
function updateUserSummary() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    fetch(`${local_url}tasks?date=${today}&limit=100`, {
        headers: { 'x-auth': user.password }
    })
    .then(res => {
        if (!res.ok) throw new Error("Error al obtener tareas del usuario");
        return res.json();
    })
    .then(data => {
        const tasks = data.data || [];
        const completed = tasks.filter(t => t.status === "F").length;
        const pending = tasks.filter(t => t.status === "A").length;
        const total = completed + pending;

        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById("userNameWidget").innerText = user.name;
        document.getElementById("completedTasksCount").innerText = `${completed} tareas`;
        document.getElementById("pendingTasksCount").innerText = `${pending} tareas`;

        document.getElementById("aiSummaryText").innerText =
            `${user.name} es un usuario que ha terminado ${completed} tareas hoy. ` +
            `Aún tiene ${pending} pendientes para el día, por lo que lleva un total del ${percent}% de su trabajo terminado.`;
    })
    .catch(err => {
        console.error("Error en updateUserSummary:", err);
    });
}
//Tareas de hoy
function showTasksToday(page = 1) {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const today = new Date().toISOString().split("T")[0];

    fetch(`${local_url}tasks?date=${today}&completed=A&page=${page}&limit=3`, {
        headers: { "x-auth": user.password }
    })
    .then(res => res.json())
    .then(data => {
        const tasks = data.data;
        const tbody = document.getElementById("hoy");
        const pagContainer = document.getElementById("pagination-hoy");
        tbody.innerHTML = "";
        pagContainer.innerHTML = "";

        if (!tasks.length) {
            tbody.innerHTML = `<tr><td colspan="4">Sin tareas por ahora.</td></tr>`;
            return;
        }

        tasks.forEach(task => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><input type="checkbox" onchange="toggleTaskCompleted(${task.id}, true)"></td>
                <td>${task.title}</td>
                <td>${renderTags(task.tags)}</td>
                <td>${task.due_date}</td>
            `;
            tbody.appendChild(tr);
        });

        if (data.total > 3) renderPagination(data.total, page, "pagination-hoy", showTasksToday);
    })
    .catch(err => console.error("Error en showTasksToday:", err));
}
function renderTags(tagList) {
    if (!Array.isArray(tagList)) return "";
    return tagList.map(tag => {
        return `<span class="badge task-badge" style="background-color:${tag.color || "#ccc"}">${tag.name}</span>`;
    }).join(" ");
}
function toggleTaskCompleted(taskId, completed) {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const status = completed ? "F" : "A";

    fetch(`${local_url}tasks/${taskId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "x-auth": user.password
        },
        body: JSON.stringify({ status })
    })
    .then(res => res.json())
    .then(() => {
        showTasksToday();           
        showCompletedTasks();       
        updateUserSummary();        
        loadTagsForFilter();        
    })
    .catch(err => console.error("Error al actualizar tarea:", err));
}

//Pendientes por etiquetas
function loadTagsForFilter() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    fetch(`${local_url}tags`, {
        headers: { "x-auth": user.password }
    })
    .then(res => res.json())
    .then(data => {
        const tags = data.data;
        const container = document.querySelector(".etiquetas");
        container.innerHTML = "";

        if (!tags.length) {
            container.innerHTML = "<p>Sin etiquetas aún</p>";
            document.getElementById("pendientes").innerHTML = "";
            document.getElementById("pagination-pendientes").innerHTML = "";
            return;
        }

        tags.forEach(tag => {
            const btn = document.createElement("button");
            btn.className = "tag-filter-btn btn btn-sm btn-light";
            btn.style.backgroundColor = tag.color;
            btn.style.opacity = 0.4;
            btn.innerText = tag.name;
            btn.dataset.tagId = tag.id;
            btn.onclick = () => renderTasksByTag(tag.id);
            container.appendChild(btn);
        });

        renderTasksByTag(tags[0].id); // mostrar primera etiqueta por defecto
    });
}
function renderTasksByTag(tagId, page = 1) {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const tbody = document.getElementById("pendientes");
    const pag = document.getElementById("pagination-pendientes");
    const tagButtons = document.querySelectorAll(".tag-filter-btn");

    tagButtons.forEach(btn => {
        btn.style.opacity = btn.dataset.tagId == tagId ? 1 : 0.4;
    });

    fetch(`${local_url}tasks?completed=A&tag=${tagId}&page=${page}&limit=3`, {
        headers: { "x-auth": user.password }
    })
    .then(res => res.json())
    .then(data => {
        const tasks = data.data || [];
        tbody.innerHTML = "";
        pag.innerHTML = "";

        if (!tasks.length) {
            tbody.innerHTML = `<tr><td colspan="4">Sin tareas por mostrar</td></tr>`;
            return;
        }

        tasks.forEach(task => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><input type="checkbox" onchange="toggleTaskCompleted(${task.id}, true)"></td>
                <td>${task.title}</td>
                <td>${renderTags(task.tags)}</td>
                <td>${task.due_date}</td>
            `;
            tbody.appendChild(tr);
        });

        if (data.total > 3)
            renderPagination(data.total, page, "pagination-pendientes", (p) => renderTasksByTag(tagId, p));
    })
    .catch(err => console.error("Error en renderTasksByTag:", err));
}
//Tareas Terminadas
function showCompletedTasks(page = 1) {
    const user = JSON.parse(sessionStorage.getItem("user"));
    fetch(`${local_url}tasks?completed=F&page=${page}&limit=3`, {
        headers: { "x-auth": user.password }
    })
    .then(res => res.json())
    .then(data => {
        const tasks = data.data || [];
        const tbody = document.getElementById("terminadas");
        const pag = document.getElementById("pagination-terminadas");
        tbody.innerHTML = "";
        pag.innerHTML = "";

        if (!tasks.length) {
            tbody.innerHTML = `<tr><td colspan="4">Sin tareas completadas aún</td></tr>`;
            return;
        }

        tasks.forEach(task => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><input type="checkbox" checked onchange="toggleTaskCompleted(${task.id}, false)"></td>
                <td><del>${task.title}</del></td>
                <td>${renderTags(task.tags)}</td>
                <td>${task.due_date}</td>
            `;
            tbody.appendChild(tr);
        });

        if (data.total > 3)
            renderPagination(data.total, page, "pagination-terminadas", showCompletedTasks);
    })
    .catch(err => console.error("Error en showCompletedTasks:", err));
}

document.addEventListener('DOMContentLoaded', () => {
    const newTaskModal = document.getElementById('newTaskModal');
    if (newTaskModal) {
        newTaskModal.addEventListener('shown.bs.modal', populateTaskTagOptions);
    }

    populateTaskTagOptions();
    loadAllTasks();

    const formEdit = document.getElementById('editTaskForm');
    if (formEdit) {
        formEdit.addEventListener('submit', updateTask);
    }

    const formNew = document.getElementById('newTaskForm');
    if (formNew) {
        formNew.addEventListener('submit', createTask);
    }
});


