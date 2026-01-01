import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import TaskModal from "../components/TaskModal";

const statusColors = {
  active: "bg-green-200 text-green-800",
  completed: "bg-blue-200 text-blue-800",
  archived: "bg-gray-200 text-gray-800",
  todo: "bg-yellow-200 text-yellow-800",
  in_progress: "bg-purple-200 text-purple-800",
};

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProject, setEditingProject] = useState(false);
  const [newName, setNewName] = useState("");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterUser, setFilterUser] = useState("");

  // Fetch project details
  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data.data);
      setNewName(res.data.data.name);
    } catch (err) {
      console.error(err);
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (filterUser) params.assignedTo = filterUser;

      const res = await api.get(`/projects/${projectId}/tasks`, { params });
      setTasks(res.data.data.tasks);
    } catch (err) {
      console.error(err);
      setError("Failed to load tasks");
    }
  };

  // Fetch tenant users
  const fetchUsers = async () => {
    try {
      const res = await api.get("/users"); // backend returns users for this tenant
      setUsers(res.data.data.users);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchTasks();
    fetchUsers();
  }, [filterStatus, filterPriority, filterUser]);

  const handleProjectUpdate = async () => {
    try {
      await api.put(`/projects/${projectId}`, { name: newName });
      setEditingProject(false);
      fetchProject();
    } catch (err) {
      console.error(err);
      alert("Failed to update project name");
    }
  };

  const handleProjectDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`/projects/${projectId}`);
      navigate("/projects");
    } catch (err) {
      console.error(err);
      alert("Failed to delete project");
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      // ✅ Correct endpoint: /tasks/:taskId
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      fetchTasks(); // refresh tasks after delete
    } catch (err) {
      console.error("Task delete failed:", err.response?.data || err);
      alert("Failed to delete task");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: "1000px", margin: "50px auto", fontFamily: "Arial, sans-serif" }}>
      {/* Project Header */}
      <div style={{ padding: "20px", background: "#f5f5f5", borderRadius: "8px", marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {editingProject ? (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{ fontSize: "24px", padding: "5px" }}
              />
              <button onClick={handleProjectUpdate} style={{ padding: "5px 10px" }}>Save</button>
              <button onClick={() => setEditingProject(false)} style={{ padding: "5px 10px" }}>Cancel</button>
            </div>
          ) : (
            <h1 style={{ fontSize: "28px" }}>{project.name}</h1>
          )}
          <span className={`px-2 py-1 rounded-full ${statusColors[project.status] || "bg-gray-200 text-gray-800"}`}>
            {project.status}
          </span>
        </div>
        <p style={{ marginTop: "10px" }}>{project.description || "No description"}</p>
        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
          {!editingProject && <button onClick={() => setEditingProject(true)}>Edit Project</button>}
          <button
            onClick={handleProjectDelete}
            style={{ background: "#f87171", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "4px" }}
          >
            Delete Project
          </button>
        </div>
      </div>

      {/* Tasks Section */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Tasks</h2>
        <button onClick={() => { setEditingTask(null); setTaskModalOpen(true); }} style={{ padding: "5px 10px" }}>Add Task</button>
      </div>

      {/* Task Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
          <option value="">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.fullName}</option>
          ))}
        </select>
      </div>

      {/* Tasks Table */}
      {tasks.length === 0 ? (
        <p>No tasks found</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "8px" }}>{t.title}</td>
                <td>
                  <span className={`px-2 py-1 rounded-full ${statusColors[t.status] || "bg-gray-200 text-gray-800"}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </td>
                <td>
                  <span className={`px-2 py-1 rounded-full ${priorityColors[t.priority] || "bg-gray-200 text-gray-800"}`}>
                    {t.priority}
                  </span>
                </td>
                <td>{t.assignedTo?.fullName || "Unassigned"}</td>
                <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}</td>
                <td style={{ display: "flex", gap: "5px" }}>
                  <button onClick={() => { setEditingTask(t); setTaskModalOpen(true); }}>Edit</button>
                  <button
                    onClick={() => handleTaskDelete(t.id)}
                    style={{ background: "#f87171", color: "#fff", border: "none", borderRadius: "4px", padding: "3px 6px" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={editingTask}
        projectId={projectId}
        refreshTasks={fetchTasks}
        users={users}
      />
    </div>
  );
};

export default ProjectDetails;
