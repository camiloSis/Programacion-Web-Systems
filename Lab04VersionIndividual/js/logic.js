const STORAGE_KEY = 'universitary-tasks';

let tasks = [];
let currentFilter = 'all';

const form = document.getElementById('task-form');
const tituloInput = document.getElementById('titulo');
const cursoInput = document.getElementById('curso');
const fechaEntregaInput = document.getElementById('fechaEntrega');
const alertContainer = document.getElementById('alert-container');
const tasksContainer = document.getElementById('tasks-container');
const taskCount = document.getElementById('task-count');
const filterButtons = document.querySelectorAll('.filter-btn');

function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function getTodayString() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
}

function validateForm(titulo, curso, fechaEntrega) {
    const errors = [];

    if (!titulo.trim()) {
        errors.push({ field: 'titulo', message: 'El título es obligatorio' });
    }

    if (!curso.trim()) {
        errors.push({ field: 'curso', message: 'El curso es obligatorio' });
    }

    if (!fechaEntrega) {
        errors.push({ field: 'fechaEntrega', message: 'La fecha de entrega es obligatoria' });
    } else {
        const today = getTodayString();
        if (fechaEntrega < today) {
            errors.push({ field: 'fechaEntrega', message: 'La fecha de entrega debe ser posterior a la fecha actual' });
        }
    }

    return errors;
}

function showErrors(errors) {
    alertContainer.innerHTML = '';
    errors.forEach(error => {
        const p = document.createElement('p');
        p.textContent = error.message;
        alertContainer.appendChild(p);
        const fieldInput = document.getElementById(error.field);
        if (fieldInput) {
            fieldInput.classList.add('error');
        }
    });
    alertContainer.classList.add('visible');
}

function clearErrors() {
    alertContainer.classList.remove('visible');
    alertContainer.innerHTML = '';
    [tituloInput, cursoInput, fechaEntregaInput].forEach(input => {
        input.classList.remove('error');
    });
}

function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (e) {
            console.error('Error al parsear localStorage:', e);
            tasks = [];
        }
    }
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task-item ${task.completada ? 'completed' : ''}`;
    div.dataset.id = task.id;

    div.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completada ? 'checked' : ''} aria-label="Marcar como ${task.completada ? 'pendiente' : 'completada'}">
        <div class="task-info">
            <div class="task-title">${escapeHtml(task.titulo)}</div>
            <div class="task-meta">
                <span class="task-course">${escapeHtml(task.curso)}</span>
                <span class="task-date">${formatDate(task.fechaEntrega)}</span>
            </div>
        </div>
        <div class="task-actions">
            <button class="btn btn-toggle" aria-label="${task.completada ? 'Marcar como pendiente' : 'Marcar como completada'}">
                ${task.completada ? 'Desmarcar' : 'Completar'}
            </button>
            <button class="btn btn-danger" aria-label="Eliminar tarea">Eliminar</button>
        </div>
    `;

    const checkbox = div.querySelector('.task-checkbox');
    const toggleBtn = div.querySelector('.btn-toggle');
    const deleteBtn = div.querySelector('.btn-danger');

    checkbox.addEventListener('change', () => toggleTask(task.id));
    toggleBtn.addEventListener('click', () => toggleTask(task.id));
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    return div;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function renderTasks() {
    tasksContainer.innerHTML = '';

    let filteredTasks = tasks;
    if (currentFilter === 'pending') {
        filteredTasks = tasks.filter(t => !t.completada);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completada);
    }

    if (filteredTasks.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-message';
        if (currentFilter === 'pending') {
            emptyMsg.textContent = 'No hay tareas pendientes.';
        } else if (currentFilter === 'completed') {
            emptyMsg.textContent = 'No hay tareas completadas.';
        } else {
            emptyMsg.textContent = 'No hay tareas registradas. Agrega tu primera tarea.';
        }
        tasksContainer.appendChild(emptyMsg);
    } else {
        filteredTasks.forEach(task => {
            const taskEl = createTaskElement(task);
            tasksContainer.appendChild(taskEl);
        });
    }

    updateTaskCount();
}

function updateTaskCount() {
    const total = tasks.length;
    const pending = tasks.filter(t => !t.completada).length;
    const completed = tasks.filter(t => t.completada).length;

    let text = `Total: ${total} | Pendientes: ${pending} | Completadas: ${completed}`;
    taskCount.textContent = `(${text})`;
}

function addTask(titulo, curso, fechaEntrega) {
    const task = {
        id: generateId(),
        titulo: titulo.trim(),
        curso: curso.trim(),
        fechaEntrega,
        completada: false
    };

    tasks.push(task);
    saveToLocalStorage();
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completada = !task.completada;
        saveToLocalStorage();
        renderTasks();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveToLocalStorage();
    renderTasks();
}

function setFilter(filter) {
    currentFilter = filter;
    filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderTasks();
}

function init() {
    fechaEntregaInput.min = getTodayString();

    loadFromLocalStorage();
    renderTasks();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors();

        const titulo = tituloInput.value;
        const curso = cursoInput.value;
        const fechaEntrega = fechaEntregaInput.value;

        const errors = validateForm(titulo, curso, fechaEntrega);

        if (errors.length > 0) {
            showErrors(errors);
            return;
        }

        addTask(titulo, curso, fechaEntrega);
        form.reset();
    });

    [tituloInput, cursoInput, fechaEntregaInput].forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('error');
            const errorSpan = document.getElementById(`error-${input.id}`);
            if (errorSpan) errorSpan.textContent = '';
        });
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
}

document.addEventListener('DOMContentLoaded', init);