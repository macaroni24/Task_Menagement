import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api";

function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const body =
        mode === "register"
          ? form
          : {
              email: form.email,
              password: form.password,
            };

      const data = await api(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      onAuth(data.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function changeMode() {
    setMode((current) =>
      current === "login" ? "register" : "login"
    );

    setError("");

    setForm({
      name: "",
      email: "",
      password: "",
    });
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">Taskly</div>

        <h1>
          {mode === "login"
            ? "Welcome back"
            : "Create account"}
        </h1>

        <p className="muted">
          {mode === "login"
            ? "Sign in to manage your tasks."
            : "Create an account and organize your work."}
        </p>

        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              Name

              <input
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                placeholder="Your name"
                required
              />
            </label>
          )}

          <label>
            Email

            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({
                  ...form,
                  email: event.target.value,
                })
              }
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({
                  ...form,
                  password: event.target.value,
                })
              }
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </label>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary full"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="text-button"
          onClick={changeMode}
        >
          {mode === "login"
            ? "Don't have an account? Register"
            : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");

    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  });

  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const filteredTasks = useMemo(() => {
    if (filter === "active") {
      return tasks.filter(
        (task) => !task.isCompleted
      );
    }

    if (filter === "completed") {
      return tasks.filter(
        (task) => task.isCompleted
      );
    }

    return tasks;
  }, [tasks, filter]);

  const activeTasksCount = useMemo(() => {
    return tasks.filter(
      (task) => !task.isCompleted
    ).length;
  }, [tasks]);

  useEffect(() => {
    if (!user) {
      return;
    }

    async function loadTasks() {
      setError("");

      try {
        const data = await api("/tasks");

        setTasks(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        setError(error.message);
      }
    }

    loadTasks();
  }, [user]);

  async function submitTask(event) {
    event.preventDefault();

    setError("");

    const body = {
      title: form.title.trim(),
      description:
        form.description.trim() || null,
      dueDate: form.dueDate
        ? new Date(
            `${form.dueDate}T12:00:00`
          ).toISOString()
        : null,
    };

    try {
      if (editingId) {
        const updated = await api(
          `/tasks/${editingId}`,
          {
            method: "PUT",
            body: JSON.stringify(body),
          }
        );

        setTasks((current) =>
          current.map((task) =>
            task.id === updated.id
              ? updated
              : task
          )
        );
      } else {
        const created = await api("/tasks", {
          method: "POST",
          body: JSON.stringify(body),
        });

        setTasks((current) => [
          created,
          ...current,
        ]);
      }

      setForm({
        title: "",
        description: "",
        dueDate: "",
      });

      setEditingId(null);
    } catch (error) {
      setError(error.message);
    }
  }

  async function toggleTask(id) {
    setError("");

    try {
      const updated = await api(
        `/tasks/${id}/toggle`,
        {
          method: "PATCH",
        }
      );

      setTasks((current) =>
        current.map((task) =>
          task.id === updated.id
            ? updated
            : task
        )
      );
    } catch (error) {
      setError(error.message);
    }
  }

  async function deleteTask(id) {
    setError("");

    try {
      await api(`/tasks/${id}`, {
        method: "DELETE",
      });

      setTasks((current) =>
        current.filter(
          (task) => task.id !== id
        )
      );

      if (editingId === id) {
        cancelEdit();
      }
    } catch (error) {
      setError(error.message);
    }
  }

  function editTask(task) {
    setEditingId(task.id);

    setForm({
      title: task.title,
      description:
        task.description || "",
      dueDate: task.dueDate
        ? task.dueDate.slice(0, 10)
        : "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);

    setForm({
      title: "",
      description: "",
      dueDate: "",
    });
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setTasks([]);
    setFilter("all");
    setEditingId(null);
    setError("");

    setForm({
      title: "",
      description: "",
      dueDate: "",
    });
  }

  if (!user) {
    return (
      <Auth onAuth={setUser} />
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">
            Taskly
          </div>

          <span className="muted">
            Simple task management
          </span>
        </div>

        <div className="user-area">
          <div>
            <strong>
              {user.name}
            </strong>

            <span>
              {user.email}
            </span>
          </div>

          <button
            type="button"
            className="secondary"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <section className="layout">
        <aside className="panel">
          <h2>
            {editingId
              ? "Edit task"
              : "New task"}
          </h2>

          <form onSubmit={submitTask}>
            <label>
              Title

              <input
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
                placeholder="What needs to be done?"
                required
              />
            </label>

            <label>
              Description

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
                placeholder="Optional details"
              />
            </label>

            <label>
              Due date

              <input
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm({
                    ...form,
                    dueDate:
                      event.target.value,
                  })
                }
              />
            </label>

            {error && (
              <div className="error">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="primary"
              >
                {editingId
                  ? "Save changes"
                  : "Add task"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </aside>

        <section className="tasks-section">
          <div className="tasks-header">
            <div>
              <h1>
                My tasks
              </h1>

              <p className="muted">
                {activeTasksCount} active{" "}
                {activeTasksCount === 1
                  ? "task"
                  : "tasks"}
              </p>
            </div>

            <div className="filters">
              {[
                "all",
                "active",
                "completed",
              ].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={
                    filter === item
                      ? "filter active"
                      : "filter"
                  }
                  onClick={() =>
                    setFilter(item)
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="task-list">
            {filteredTasks.length === 0 ? (
              <div className="empty">
                <h3>
                  No tasks here
                </h3>

                <p>
                  Create a task or choose another filter.
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <article
                  className={
                    task.isCompleted
                      ? "task completed"
                      : "task"
                  }
                  key={task.id}
                >
                  <button
                    type="button"
                    className={
                      task.isCompleted
                        ? "check checked"
                        : "check"
                    }
                    onClick={() =>
                      toggleTask(task.id)
                    }
                    aria-label="Toggle task"
                  >
                    {task.isCompleted
                      ? "✓"
                      : ""}
                  </button>

                  <div className="task-content">
                    <h3>
                      {task.title}
                    </h3>

                    {task.description && (
                      <p>
                        {task.description}
                      </p>
                    )}

                    <div className="task-meta">
                      {task.dueDate && (
                        <span>
                          Due{" "}
                          {new Date(
                            task.dueDate
                          ).toLocaleDateString()}
                        </span>
                      )}

                      {task.createdAt && (
                        <span>
                          Created{" "}
                          {new Date(
                            task.createdAt
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="task-actions">
                    <button
                      type="button"
                      onClick={() =>
                        editTask(task)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteTask(task.id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;