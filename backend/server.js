const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
  }
}

function readTasks() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse tasks.json, resetting file.', err);
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
    return [];
  }
}

function writeTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

function sendJSON(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) {
        req.connection.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function handleOptions(res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end();
}

function filterTasks(tasks, status) {
  if (!status || status === 'all') return tasks;
  if (status === 'completed') {
    return tasks.filter(task => task.status === 'completed');
  }
  if (status === 'pending') {
    return tasks.filter(task => task.status === 'pending');
  }
  return tasks;
}

async function handleApi(req, res, urlObj) {
  if (req.method === 'OPTIONS') {
    handleOptions(res);
    return;
  }

  const tasks = readTasks();

  if (req.method === 'GET' && urlObj.pathname === '/api/tasks') {
    const status = urlObj.searchParams.get('status');
    const filtered = filterTasks(tasks, status);
    sendJSON(res, 200, filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/tasks') {
    try {
      const body = await parseBody(req);
      const title = (body.title || '').trim();
      const description = (body.description || '').trim();
      if (!title) {
        sendJSON(res, 400, { message: 'Title is required.' });
        return;
      }
      const timestamp = new Date().toISOString();
      const task = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
        title,
        description,
        status: body.status === 'completed' ? 'completed' : 'pending',
        createdAt: timestamp,
        updatedAt: timestamp
      };
      tasks.push(task);
      writeTasks(tasks);
      sendJSON(res, 201, task);
    } catch (err) {
      sendJSON(res, 400, { message: err.message });
    }
    return;
  }

  const taskIdMatch = urlObj.pathname.match(/^\/api\/tasks\/(.+)$/);
  if (taskIdMatch) {
    const taskId = taskIdMatch[1];
    const index = tasks.findIndex(task => task.id === taskId);
    if (index === -1) {
      sendJSON(res, 404, { message: 'Task not found.' });
      return;
    }

    if (req.method === 'PUT') {
      try {
        const body = await parseBody(req);
        const title = (body.title || '').trim();
        const description = (body.description || '').trim();
        const status = body.status === 'completed' ? 'completed' : 'pending';
        if (!title) {
          sendJSON(res, 400, { message: 'Title is required.' });
          return;
        }
        tasks[index] = {
          ...tasks[index],
          title,
          description,
          status,
          updatedAt: new Date().toISOString()
        };
        writeTasks(tasks);
        sendJSON(res, 200, tasks[index]);
      } catch (err) {
        sendJSON(res, 400, { message: err.message });
      }
      return;
    }

    if (req.method === 'DELETE') {
      const deleted = tasks.splice(index, 1)[0];
      writeTasks(tasks);
      sendJSON(res, 200, deleted);
      return;
    }
  }

  sendJSON(res, 404, { message: 'Route not found.' });
}

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);

  if (urlObj.pathname.startsWith('/api/')) {
    handleApi(req, res, urlObj);
    return;
  }

  let filePath = path.join(PUBLIC_DIR, urlObj.pathname === '/' ? 'index.html' : urlObj.pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Access denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (urlObj.pathname !== '/' && !path.extname(urlObj.pathname)) {
        // SPA-style fallback
        serveStaticFile(res, path.join(PUBLIC_DIR, 'index.html'));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      }
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    serveStaticFile(res, filePath);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});
