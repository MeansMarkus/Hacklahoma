/**
 * Life as a Mountain — Reach New Heights
 * Each task = a ledge. Summit = your goal. Gamified growth.
 */

const SVG_VIEW = { width: 800, height: 500 };
const MOUNTAIN_BASE_Y = 480;
const SUMMIT_X = 400;
const SUMMIT_Y = 80;

let state = {
  goal: '',
  tasks: [], // { id, text, done }
};

const STORAGE_KEY = 'life-as-a-mountain';

// DOM
const goalInput = document.getElementById('goalInput');
const setGoalBtn = document.getElementById('setGoalBtn');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const goalLabel = document.getElementById('goalLabel');
const altitudeBar = document.getElementById('altitudeBar');
const altitudeValue = document.getElementById('altitudeValue');
const motivationText = document.getElementById('motivationText');
const summitBanner = document.getElementById('summitBanner');
const mountainSvg = document.getElementById('mountainSvg');
const mountainPath = document.getElementById('mountainPath');
const summitCap = document.getElementById('summitCap');
const ledgesGroup = document.getElementById('ledgesGroup');
const climberGroup = document.getElementById('climberGroup');
const climberDot = document.getElementById('climberDot');

const MOTIVATION = {
  empty: "Set your summit and add ledges. Every step takes you higher.",
  goalOnly: "Add tasks — each one is a ledge on your way to the summit.",
  hasTasks: "Complete tasks to climb. You've got this.",
  progress: (p) => {
    if (p <= 25) return "You're on the trail. Keep moving.";
    if (p <= 50) return "Halfway up — the view is already changing.";
    if (p <= 75) return "So close. One ledge at a time.";
    if (p < 100) return "The summit is right there. Finish strong.";
    return "You reached the summit. New heights unlocked.";
  },
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state.goal = parsed.goal || '';
      state.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    }
  } catch (_) {}
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    goal: state.goal,
    tasks: state.tasks,
  }));
}

function getProgress() {
  const total = state.tasks.length;
  if (total === 0) return 0;
  const done = state.tasks.filter(t => t.done).length;
  return Math.round((done / total) * 100);
}

function getAltitude() {
  const total = state.tasks.length;
  if (total === 0) return 0;
  const done = state.tasks.filter(t => t.done).length;
  const maxAlt = 4000; // "meters" at summit
  return Math.round((done / total) * maxAlt);
}

function updateMotivation() {
  const p = getProgress();
  const total = state.tasks.length;
  if (!state.goal && total === 0) {
    motivationText.textContent = MOTIVATION.empty;
    return;
  }
  if (state.goal && total === 0) {
    motivationText.textContent = MOTIVATION.goalOnly;
    return;
  }
  if (total > 0 && p === 0) {
    motivationText.textContent = MOTIVATION.hasTasks;
    return;
  }
  motivationText.textContent = MOTIVATION.progress(p);
  if (p === 100 && state.tasks.length > 0) {
    document.body.classList.add('summit-reached');
    showSummitCelebration();
  } else {
    document.body.classList.remove('summit-reached');
    delete document.body.dataset.summitCelebrated;
  }
}

function showSummitCelebration() {
  if (document.body.dataset.summitCelebrated === '1') return;
  document.body.dataset.summitCelebrated = '1';
  const el = document.createElement('div');
  el.className = 'summit-celebration';
  el.innerHTML = '<span class="summit-celebration-text">🏔️ Summit reached — new heights unlocked!</span>';
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
  setTimeout(() => {
    el.classList.remove('visible');
    setTimeout(() => el.remove(), 400);
  }, 2800);
}

function updateAltitudeMeter() {
  const p = getProgress();
  const alt = getAltitude();
  altitudeBar.style.width = `${p}%`;
  altitudeValue.textContent = `${alt} m`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawMountain() {
  const n = Math.max(state.tasks.length, 3);
  const ledgeCount = n;
  const leftBaseX = 120;
  const rightBaseX = SVG_VIEW.width - 120;
  const summitX = SUMMIT_X;
  const summitY = SUMMIT_Y;

  // Mountain: left base -> summit -> right base (smooth curve)
  const pathLeft = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const x = lerp(leftBaseX, summitX, t);
    const y = lerp(MOUNTAIN_BASE_Y, summitY, 1 - (1 - t) * (1 - t));
    pathLeft.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
  }
  const pathRight = [];
  for (let i = 1; i <= 40; i++) {
    const t = i / 40;
    const x = lerp(summitX, rightBaseX, t);
    const y = lerp(summitY, MOUNTAIN_BASE_Y, t * t);
    pathRight.push(`L ${x} ${y}`);
  }
  mountainPath.setAttribute('d', pathLeft.join(' ') + ' ' + pathRight.join(' ') + ' Z');

  // Summit snow cap
  const capWidth = 72;
  const capHeight = 48;
  summitCap.setAttribute('d', `M ${summitX - capWidth/2} ${summitY + capHeight} L ${summitX} ${summitY} L ${summitX + capWidth/2} ${summitY + capHeight} Z`);

  // Ledges along the climb (left side of mountain)
  ledgesGroup.innerHTML = '';
  const doneCount = state.tasks.filter(t => t.done).length;

  for (let i = 0; i < ledgeCount; i++) {
    const t = (i + 0.5) / ledgeCount;
    const x = lerp(leftBaseX, summitX, t);
    const y = lerp(MOUNTAIN_BASE_Y, summitY, 1 - (1 - t) * (1 - t));
    const ledgeWidth = 44 + (1 - t) * 36;
    const isReached = i < doneCount;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `ledge ${isReached ? 'reached' : ''}`);
    g.setAttribute('data-ledge', i);

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x - ledgeWidth / 2);
    rect.setAttribute('y', y - 6);
    rect.setAttribute('width', ledgeWidth);
    rect.setAttribute('height', 12);
    rect.setAttribute('rx', 4);
    rect.setAttribute('fill', isReached ? '#34d399' : 'rgba(71, 85, 105, 0.95)');
    rect.setAttribute('stroke', isReached ? '#34d399' : 'rgba(148, 163, 184, 0.35)');
    rect.setAttribute('stroke-width', 1.5);
    g.appendChild(rect);

    ledgesGroup.appendChild(g);
  }

  // Climber dot position
  let climberX = leftBaseX + 25;
  let climberY = MOUNTAIN_BASE_Y - 25;
  const total = state.tasks.length;
  if (total > 0) {
    const idx = Math.min(doneCount, total);
    const t = (idx - 0.25) / total;
    if (t > 0) {
      climberX = lerp(leftBaseX, summitX, t);
      climberY = lerp(MOUNTAIN_BASE_Y, summitY, 1 - (1 - t) * (1 - t)) - 12;
    }
  }
  climberDot.setAttribute('cx', climberX);
  climberDot.setAttribute('cy', climberY);
}

function renderTasks() {
  taskList.innerHTML = '';
  state.tasks.forEach((task, i) => {
    const li = document.createElement('li');
    li.className = `task-item ${task.done ? 'done' : ''}`;
    li.dataset.id = task.id;
    const id = `task-${task.id}`;
    li.innerHTML = `
      <input type="checkbox" id="${id}" ${task.done ? 'checked' : ''} />
      <label for="${id}">${escapeHtml(task.text)}</label>
      <button type="button" class="remove-btn" aria-label="Remove">×</button>
    `;
    li.querySelector('input').addEventListener('change', () => toggleTask(task.id));
    li.querySelector('.remove-btn').addEventListener('click', () => removeTask(task.id));
    taskList.appendChild(li);
  });
  drawMountain();
  updateAltitudeMeter();
  updateMotivation();
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  state.tasks.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    text,
    done: false,
  });
  taskInput.value = '';
  saveState();
  renderTasks();
}

function toggleTask(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  saveState();
  renderTasks();
}

function removeTask(id) {
  state.tasks = state.tasks.filter(x => x.id !== id);
  saveState();
  renderTasks();
}

function setGoal() {
  const text = goalInput.value.trim();
  state.goal = text;
  goalInput.value = '';
  saveState();
  goalLabel.textContent = text || 'Your summit';
  updateMotivation();
  if (state.goal && document.body.classList.contains('summit-reached')) {
    document.body.classList.add('summit-reached');
  }
}

// Init
loadState();
goalLabel.textContent = state.goal || 'Your summit';
if (state.goal) goalInput.placeholder = 'Change your goal';
setGoalBtn.addEventListener('click', setGoal);
goalInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') setGoal(); });
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
renderTasks();

function generateMountainPath() {
  const peakX = 400;
  const peakY = 100;

  //Create a more irregular "rocky" edge

  return `M100 500 L250 350 L320 380 L${peakX} ${peakY} L480 380 L550 350 L700 500 Z`;
}

const zoomTarget = document.getElementById('zoomTarget');
let currentScale = 1;
window.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = -e.deltaY * 0.001;
  currentScale = Math.min(Math.max(0.5, currentScale + delta), 3);
  zoomTarget.style.transform = `scale(${currentScale})`;
}, { passive: false });