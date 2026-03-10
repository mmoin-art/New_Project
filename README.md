# TaskFlow To-Do App

A lightweight full-stack to-do list built with a zero-dependency Node.js backend and a vanilla JavaScript frontend. It provides full CRUD operations, filtering, status toggles, and persists data locally on disk.

## Features
- Create, read, update, and delete tasks with title, description, status, and creation timestamp
- Mark tasks as completed or pending with a single click
- Filter views (All / Pending / Completed) plus live stats
- Responsive UI with smooth form reuse for editing
- Local JSON persistence (`backend/data/tasks.json`) so your tasks survive restarts
- Single-port setup: backend serves both API routes and the frontend

## Project structure
```
/Users/mmoin/Desktop/New Project
├── backend
│   ├── data/tasks.json        # Local persistence file
│   ├── package.json           # Scripts, metadata
│   ├── public/                # Frontend assets (HTML/CSS/JS)
│   └── server.js              # HTTP server + REST API
├── .gitignore
└── README.md
```

## Prerequisites
- Node.js 18+ (built-in `fetch`, `crypto.randomUUID`, and ES2021 features are used)

## Running locally
1. Open a terminal at the project root.
2. Start the server (defaults to `http://localhost:4000`):
   ```bash
   cd backend
   npm start
   ```
   or simply `node server.js`.
3. Visit `http://localhost:4000` in your browser. The frontend loads from the same port and all API calls go to `/api/tasks`.

> **Note:** the server writes to `backend/data/tasks.json`. Keep this file if you want to preserve your tasks; delete it to reset the list.

## API overview
| Method | Endpoint        | Description |
| ------ | --------------- | ----------- |
| GET    | `/api/tasks`    | List all tasks (sorted by newest). Optional `?status=completed|pending|all` filter. |
| POST   | `/api/tasks`    | Create a new task. Body: `{ title, description?, status? }`. |
| PUT    | `/api/tasks/:id`| Update title/description/status for a task. |
| DELETE | `/api/tasks/:id`| Remove a task. |

Responses are JSON and include validation errors when fields are missing.

## Customization tips
- Change the default port by setting `PORT=5000 npm start`.
- To start fresh, delete `backend/data/tasks.json` before launching.
- Extend the schema by adding new fields in `server.js` and updating the frontend form in `public/index.html` + `public/app.js`.

Enjoy managing your tasks!
=======
# New_Project
>>>>>>> d9e135b5f49bd71cfd7f797eb662cf21086415f4
