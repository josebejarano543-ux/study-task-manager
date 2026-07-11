const STORAGE_KEY = "cse310-study-tasks";

const taskForm = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const courseInput = document.querySelector("#task-course");
const dateInput = document.querySelector("#task-date");
const priorityInput = document.querySelector("#task-priority");
const taskList = document.querySelector("#task-list");
const formMessage = document.querySelector("#form-message");
const totalCount = document.querySelector("#total-count");
const pendingCount = document.querySelector("#pending-count");
const completedCount = document.querySelector("#completed-count");
const taskListDescription = document.querySelector("#task-list-description");
const filterButtons = [...document.querySelectorAll(".filter-button")];

let tasks = loadTasks();
let activeFilter = "all";

/**
 * Loads saved tasks from localStorage.
 * @returns {Array<object>} The saved task list or an empty array.
 */
function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);

  if (!savedTasks) {
    return [];
  }

  try {
    const parsedTasks = JSON.parse(savedTasks);
    return Array.isArray(parsedTasks) ? parsedTasks : [];
  } catch (error) {
    console.error("Could not read saved tasks:", error);
    return [];
  }
}

/**
 * Saves the current task list in localStorage.
 */
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Creates a unique identifier for a task.
 * @returns {string} A unique task ID.
 */
function createTaskId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Formats a date by using the external Day.js library.
 * @param {string} dateValue - A date in YYYY-MM-DD format.
 * @returns {string} A readable date.
 */
function formatDate(dateValue) {
  return dayjs(dateValue).format("MMM D, YYYY");
}

/**
 * Recursively counts completed tasks.
 * This satisfies the recursion requirement because the function calls itself.
 * @param {Array<object>} taskArray - The tasks to examine.
 * @param {number} index - The current array position.
 * @returns {number} The number of completed tasks.
 */
function countCompletedRecursively(taskArray, index = 0) {
  if (index >= taskArray.length) {
    return 0;
  }

  const currentValue = taskArray[index].completed ? 1 : 0;
  return currentValue + countCompletedRecursively(taskArray, index + 1);
}

/**
 * Returns tasks that match the active filter.
 * Uses native ES6 array functions such as filter and sort.
 * @returns {Array<object>} The filtered and sorted task list.
 */
function getVisibleTasks() {
  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === "pending") {
      return !task.completed;
    }

    if (activeFilter === "completed") {
      return task.completed;
    }

    return true;
  });

  return filteredTasks.sort((taskA, taskB) => {
    return dayjs(taskA.dueDate).valueOf() - dayjs(taskB.dueDate).valueOf();
  });
}

/**
 * Creates one task card with DOM elements.
 * @param {object} task - The task to display.
 * @returns {HTMLElement} A completed task card element.
 */
function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = `task-card${task.completed ? " completed" : ""}`;

  const completeButton = document.createElement("button");
  completeButton.type = "button";
  completeButton.className = "complete-button";
  completeButton.setAttribute(
    "aria-label",
    task.completed ? "Mark task as pending" : "Mark task as completed"
  );
  completeButton.textContent = task.completed ? "✓" : "";
  completeButton.addEventListener("click", () => toggleTask(task.id));

  const taskMain = document.createElement("div");
  taskMain.className = "task-main";

  const taskTitle = document.createElement("h3");
  taskTitle.className = "task-title";
  taskTitle.textContent = task.title;

  const taskMeta = document.createElement("div");
  taskMeta.className = "task-meta";

  const courseBadge = document.createElement("span");
  courseBadge.className = "badge";
  courseBadge.textContent = task.course || "General study";

  const dateBadge = document.createElement("span");
  dateBadge.className = "badge";
  dateBadge.textContent = `Due ${formatDate(task.dueDate)}`;

  const priorityBadge = document.createElement("span");
  priorityBadge.className = `badge ${task.priority}`;
  priorityBadge.textContent = `${capitalizeWord(task.priority)} priority`;

  taskMeta.append(courseBadge, dateBadge, priorityBadge);
  taskMain.append(taskTitle, taskMeta);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteTask(task.id));

  card.append(completeButton, taskMain, deleteButton);
  return card;
}

/**
 * Capitalizes the first letter of a word.
 * @param {string} word - The word to capitalize.
 * @returns {string} The capitalized word.
 */
function capitalizeWord(word) {
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
}

/**
 * Displays the current task list in the browser.
 * Uses forEach, another native ES6 array function.
 */
function renderTasks() {
  taskList.innerHTML = "";
  const visibleTasks = getVisibleTasks();

  if (visibleTasks.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "No tasks match this filter yet.";
    taskList.append(emptyState);
  } else {
    visibleTasks.forEach((task) => {
      taskList.append(createTaskCard(task));
    });
  }

  updateSummary();
  updateFilterDescription();
}

/**
 * Updates the total, pending, and completed task counters.
 */
function updateSummary() {
  const completed = countCompletedRecursively(tasks);
  const pending = tasks.length - completed;

  totalCount.textContent = tasks.length;
  pendingCount.textContent = pending;
  completedCount.textContent = completed;
}

/**
 * Updates the text that explains the active filter.
 */
function updateFilterDescription() {
  const descriptions = {
    all: "Showing all tasks",
    pending: "Showing pending tasks",
    completed: "Showing completed tasks"
  };

  taskListDescription.textContent = descriptions[activeFilter];
}

/**
 * Adds a new task from the form values.
 * @param {SubmitEvent} event - The form submission event.
 */
function addTask(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const course = courseInput.value.trim();
  const dueDate = dateInput.value;
  const priority = priorityInput.value;

  if (!title || !dueDate) {
    formMessage.textContent = "Please enter a task name and due date.";
    return;
  }

  const newTask = {
    id: createTaskId(),
    title,
    course,
    dueDate,
    priority,
    completed: false
  };

  tasks = [...tasks, newTask];
  saveTasks();
  renderTasks();

  taskForm.reset();
  priorityInput.value = "medium";
  setDefaultDate();
  formMessage.textContent = "Task added successfully.";
  titleInput.focus();
}

/**
 * Changes a task between completed and pending.
 * Uses map, a native ES6 array function.
 * @param {string} taskId - The task identifier.
 */
function toggleTask(taskId) {
  tasks = tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, completed: !task.completed };
    }

    return task;
  });

  saveTasks();
  renderTasks();
}

/**
 * Removes a task from the list.
 * Uses filter, a native ES6 array function.
 * @param {string} taskId - The task identifier.
 */
function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
}

/**
 * Changes the active task filter.
 * @param {string} filterName - The selected filter.
 */
function changeFilter(filterName) {
  activeFilter = filterName;

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filterName;
    button.classList.toggle("active", isActive);
  });

  renderTasks();
}

/**
 * Sets the form date to tomorrow by using Day.js.
 */
function setDefaultDate() {
  dateInput.value = dayjs().add(1, "day").format("YYYY-MM-DD");
}

taskForm.addEventListener("submit", addTask);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    changeFilter(button.dataset.filter);
  });
});

setDefaultDate();
renderTasks();
