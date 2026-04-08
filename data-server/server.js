import express from 'express';

const app = express();
const PORT = 3066;

app.use(express.json());

// --- CORS für lokale Entwicklung ---
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Preflight requests sofort beantworten
  if (req.method === 'OPTIONS') return res.status(204).send();
  
  next();
});

// --- In-memory store (replace with DB later) ---
let tasks =  [
    { id: 1, text: 'Learn Web Components', done: false, notes: 'Start with MDN docs.' },
    { id: 2, text: 'Remove all dependencies', done: true, notes: 'nulldeps.js is the way.' },
    { id: 3, text: 'Ship it', done: false, notes: 'Deploy to production.' }
];

let nextId = 4;

// --- Routes ---

// GET /api/tasks - return all tasks
app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

// GET /api/tasks/:id - return single task
app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
});

// POST /api/tasks - create new task
app.post('/api/tasks', (req, res) => {
  const { text, done = false } = req.body;
  if (!text) return res.status(400).json({ message: 'text is required' });

  const task = { id: nextId++, text, done };
  tasks.push(task);
  res.status(201).json(task);
});

// PATCH /api/tasks/:id - partial update
app.patch('/api/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Task not found' });

  tasks[idx] = { ...tasks[idx], ...req.body };
  res.json(tasks[idx]);
});

// DELETE /api/tasks/:id - remove task
app.delete('/api/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Task not found' });

  tasks.splice(idx, 1);
  res.status(204).send();
});

// --- Start ---
const server = app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

// Graceful shutdown - release port cleanly on exit
process.on('SIGTERM', () => server.close());
process.on('SIGINT',  () => server.close());
