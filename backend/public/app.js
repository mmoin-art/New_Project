const API_BASE = '/api/tasks';

const state = {
  tasks: [],
  filter: 'all',
  editingId: null
};

const form = document.getElementById('task-form');
const titleInput = document.getElementById('title');
const descInput = document.getElementById('description');
const statusInput = document.getElementById('status');
const idInput = document.getElementById('task-id');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-edit');
const filterButtons = document.querySelectorAll('.filter-btn');
const taskList = document.getElementById('task-list');
const taskTemplate = document.getElementById('task-template');
const emptyState = document.getElementById('empty-state');
const totalCount = document.getElementById('total-count');
const completedCount = document.getElementById('completed-count');

async function fetchTasks() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Unable to load tasks');
    state.tasks = await res.json();
    renderTasks();
  } catch (err) {
    console.error(err);
    alert('Failed to fetch tasks. Is the server running?');
  }
}

function renderTasks() {
  const visibleTasks = state.filter === 'all' ? state.tasks : state.tasks.filter(task => task.status === state.filter);

  taskList.innerHTML = '';
  if (!visibleTasks.length) {
    emptyState.style.display = 'block';
    emptyState.textContent = state.tasks.length
      ? 'No tasks match this filter.'
      : 'No tasks yet. Start by adding a goal above.';
  } else {
    emptyState.style.display = 'none';
  }

  totalCount.textContent = state.tasks.length;
  completedCount.textContent = state.tasks.filter(task => task.status === 'completed').length;

  visibleTasks.forEach(task => {
    const clone = taskTemplate.content.cloneNode(true);
    const item = clone.querySelector('.task-item');
    clone.querySelector('.task-title').textContent = task.title;
    clone.querySelector('.task-desc').textContent = task.description || 'No description provided';
    clone.querySelector('.task-date').textContent = formatDate(task.createdAt);
    const statusPill = clone.querySelector('.status-pill');
    statusPill.textContent = task.status;
    statusPill.classList.add(task.status);

    const completeBtn = clone.querySelector('.complete-btn');
    completeBtn.textContent = task.status === 'completed' ? 'Mark Pending' : 'Mark Done';
    completeBtn.addEventListener('click', () => toggleStatus(task));

    clone.querySelector('.edit-btn').addEventListener('click', () => startEdit(task));
    clone.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task));

    taskList.appendChild(clone);
  });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const payload = {
    title: titleInput.value.trim(),
    description: descInput.value.trim(),
    status: statusInput.value
  };

  if (!payload.title) {
    alert('Title is required.');
    titleInput.focus();
    return;
  }

  try {
    const isEditing = Boolean(state.editingId);
    const endpoint = isEditing ? `${API_BASE}/${state.editingId}` : API_BASE;
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const message = await res.json().catch(() => ({ message: 'Unable to save task' }));
      throw new Error(message.message || 'Unable to save task');
    }

    await fetchTasks();
    form.reset();
    statusInput.value = 'pending';
    exitEditState();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

cancelBtn.addEventListener('click', () => {
  form.reset();
  statusInput.value = 'pending';
  exitEditState();
});

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    filterButtons.forEach(btn => btn.classList.toggle('active', btn === button));
    renderTasks();
  });
});

function startEdit(task) {
  state.editingId = task.id;
  idInput.value = task.id;
  titleInput.value = task.title;
  descInput.value = task.description || '';
  statusInput.value = task.status;
  submitBtn.textContent = 'Update Task';
  cancelBtn.hidden = false;
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function exitEditState() {
  state.editingId = null;
  idInput.value = '';
  submitBtn.textContent = 'Add Task';
  cancelBtn.hidden = true;
}

async function toggleStatus(task) {
  const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
  try {
    const res = await fetch(`${API_BASE}/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        status: nextStatus
      })
    });
    if (!res.ok) throw new Error('Unable to update task');
    await fetchTasks();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

async function deleteTask(task) {
  const confirmed = confirm(`Delete "${task.title}"?`);
  if (!confirmed) return;
  try {
    const res = await fetch(`${API_BASE}/${task.id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Unable to delete task');
    await fetchTasks();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

fetchTasks();
