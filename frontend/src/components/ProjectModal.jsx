import { useState, useEffect } from "react";
import api from "../services/api";

const ProjectModal = ({ isOpen, onClose, project, refreshProjects }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens/closes or project changes
  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setStatus(project.status || "active");
    } else {
      setName("");
      setDescription("");
      setStatus("active");
    }
    setError("");
    setLoading(false);
  }, [project, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (project?.id) {
        // Edit
        await api.put(`/projects/${project.id}`, { name, description, status });
      } else {
        // Create
        await api.post("/projects", { name, description, status });
      }
      refreshProjects();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", width: "400px" }}>
        <h2>{project?.id ? "Edit Project" : "Create Project"}</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div>
            <label>Project Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              style={{ width: "100%", marginBottom: "10px" }}
            />
          </div>
          <div>
            <label>Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              style={{ width: "100%", marginBottom: "10px" }}
            />
          </div>
          <div>
            <label>Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
              style={{ width: "100%", marginBottom: "10px" }}
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
