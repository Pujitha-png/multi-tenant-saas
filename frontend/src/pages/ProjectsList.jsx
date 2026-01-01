import { useEffect, useState } from "react";
import api from "../services/api";
import ProjectModal from "../components/ProjectModal";

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get("/projects", {
        params: {
          status: filterStatus || undefined,
          search: searchTerm || undefined
        }
      });
      setProjects(res.data?.data?.projects || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [filterStatus, searchTerm]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete project");
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: "green",
      archived: "gray",
      completed: "blue"
    };
    return (
      <span style={{
        padding: "4px 10px",
        borderRadius: "12px",
        backgroundColor: colors[status] || "gray",
        color: "#fff",
        fontSize: "12px",
        fontWeight: "bold",
        textTransform: "capitalize"
      }}>
        {status}
      </span>
    );
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading projects...</p>;
  if (error) return <p style={{ color: "red", textAlign: "center", marginTop: "50px" }}>{error}</p>;

  return (
    <div style={{ maxWidth: "1000px", margin: "50px auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginBottom: "30px", color: "#333" }}>📁 Projects</h1>

      {/* Controls */}
      <div style={{
        marginBottom: "20px",
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        <button
          onClick={() => { setEditingProject(null); setModalOpen(true); }}
          style={{
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            padding: "10px 15px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          + Create New Project
        </button>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            flex: "1",
            minWidth: "180px"
          }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            minWidth: "150px"
          }}
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Projects Table */}
      {projects.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666", marginTop: "50px", fontSize: "16px" }}>
          No projects found
        </p>
      ) : (
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          borderRadius: "10px",
          overflow: "hidden"
        }}>
          <thead style={{ backgroundColor: "#f4f4f4" }}>
            <tr>
              <th style={{ padding: "12px 10px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "12px 10px", textAlign: "left" }}>Description</th>
              <th style={{ padding: "12px 10px", textAlign: "center" }}>Status</th>
              <th style={{ padding: "12px 10px", textAlign: "center" }}>Tasks</th>
              <th style={{ padding: "12px 10px", textAlign: "center" }}>Created</th>
              <th style={{ padding: "12px 10px", textAlign: "center" }}>Creator</th>
              <th style={{ padding: "12px 10px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p, idx) => (
              <tr key={p.id} style={{
                borderBottom: "1px solid #eee",
                backgroundColor: idx % 2 === 0 ? "#fafafa" : "#fff"
              }}>
                <td style={{ padding: "10px" }}>{p.name}</td>
                <td style={{ padding: "10px" }}>{p.description?.slice(0, 50) + (p.description?.length > 50 ? "..." : "")}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{getStatusBadge(p.status)}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{p.taskCount || 0}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{p.createdBy?.fullName || "N/A"}</td>
                <td style={{ padding: "10px", textAlign: "center", display: "flex", justifyContent: "center", gap: "5px" }}>
                  <button
                    onClick={() => { setEditingProject(p); setModalOpen(true); }}
                    style={{
                      backgroundColor: "#2196F3",
                      color: "#fff",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{
                      backgroundColor: "#f44336",
                      color: "#fff",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        project={editingProject}
        refreshProjects={fetchProjects}
      />
    </div>
  );
};

export default ProjectsList;
