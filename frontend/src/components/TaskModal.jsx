import { useState, useEffect } from "react";
import api from "../services/api";

const TaskModal = ({
  isOpen,
  onClose,
  projectId,
  task,
  refreshTasks,
  users = []
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "todo");
      setPriority(task.priority || "medium");
      setAssignedTo(task.assignedTo?.id || "");
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    } else {
      setTitle("");
      setDescription("");
      setStatus("todo");
      setPriority("medium");
      setAssignedTo("");
      setDueDate("");
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (task?.id) {
        // ✅ Corrected PUT endpoint for editing a task
        await api.put(`/projects/${projectId}/tasks/${task.id}`, {
          title,
          description,
          status,
          priority,
          assignedTo: assignedTo || null,
          dueDate: dueDate || null,
        });
      } else {
        // Create task
        await api.post(`/projects/${projectId}/tasks`, {
          title,
          description,
          priority,
          assignedTo: assignedTo || null,
          dueDate: dueDate || null,
        });
      }

      refreshTasks();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ background: "rgba(0,0,0,0.5)", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div className="modal" style={{ background: "#fff", padding: "20px", borderRadius: "8px", width: "400px", maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ marginBottom: "15px" }}>{task ? "Edit Task" : "Create Task"}</h2>

        {error && <p className="error" style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />

          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <label>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <label>Assign To</label>
          <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Unassigned</option>
            {users.length > 0 ? (
              users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))
            ) : (
              <option disabled>No users available</option>
            )}
          </select>

          <label>Due Date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

          <div className="actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px" }}>
            <button type="button" onClick={onClose} style={{ padding: "5px 10px", borderRadius: "4px", border: "1px solid #ccc" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: "5px 10px", borderRadius: "4px", background: "#4ade80", color: "#fff", border: "none" }}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
