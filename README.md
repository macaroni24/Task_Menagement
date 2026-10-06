# Task Management API

Simple full-stack task manager built with ASP.NET Core Web API, Entity Framework Core, SQLite, JWT authentication and React.

## Features

- Register and login
- JWT authentication
- Private tasks per user
- Create, read, update and delete tasks
- Mark tasks as completed
- Due dates
- Filter by all, active and completed
- Clean responsive React frontend
- SQLite database

## Run backend

```bash
cd backend/TaskManager.Api
dotnet restore
dotnet run --urls http://localhost:5000
```

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

## API endpoints

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/{id}
PATCH  /api/tasks/{id}/toggle
DELETE /api/tasks/{id}
```
