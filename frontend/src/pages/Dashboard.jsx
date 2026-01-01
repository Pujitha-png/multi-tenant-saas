import { useEffect, useState } from "react";
import api from "../services/api";

const card = {
  background: "#ffffff",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
  flex: 1,
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Get current user
        const userRes = await api.get("/auth/me");
        const currentUser = userRes.data?.data;
        setUser(currentUser);

        // 2️⃣ Get projects
        const projectsRes = await api.get("/projects");
        const projectsList =
          projectsRes.data?.data?.projects ||
          projectsRes.data?.data ||
          [];
        setProjects(projectsList);

        // 3️⃣ Get tasks assigned to current user (per project)
        const allTasks = [];

        for (const project of projectsList) {
          try {
            const tasksRes = await api.get(
              `/projects/${project.id}/tasks?assignedTo=${currentUser.id}`
            );
            const projectTasks = tasksRes.data?.data || [];
            allTasks.push(...projectTasks);
          } catch {
            console.warn(`Failed to load tasks for project ${project.id}`);
          }
        }

        setTasks(allTasks);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading dashboard...</p>;
  }

  if (error) {
    return (
      <p style={{ textAlign: "center", color: "red" }}>
        {error}
      </p>
    );
  }

  // 📊 Stats
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const pendingTasks = totalTasks - completedTasks;

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "40px auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <h1>
        👋 Welcome, {user?.fullName}
        <span style={{ fontSize: "16px", color: "#666", marginLeft: "10px" }}>
          ({user?.role})
        </span>
      </h1>

      {/* Stats */}
      <div style={{ display: "flex", gap: "20px", margin: "30px 0" }}>
        <div style={card}>
          <h3>Total Projects</h3>
          <h2>{totalProjects}</h2>
        </div>
        <div style={card}>
          <h3>Total Tasks</h3>
          <h2>{totalTasks}</h2>
        </div>
        <div style={card}>
          <h3>Completed</h3>
          <h2 style={{ color: "green" }}>{completedTasks}</h2>
        </div>
        <div style={card}>
          <h3>Pending</h3>
          <h2 style={{ color: "orange" }}>{pendingTasks}</h2>
        </div>
      </div>

      {/* Recent Projects */}
      <h2>📁 Recent Projects</h2>
      {projects.length === 0 ? (
        <p>No projects yet</p>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {projects.slice(0, 5).map(project => (
            <div
              key={project.id}
              style={{
                padding: "15px",
                borderRadius: "10px",
                background: "#f8f9fa",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong>{project.name}</strong>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  Status: {project.status}
                </div>
              </div>
              <div>
                Tasks:{" "}
                {tasks.filter(t => t.projectId === project.id).length}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Tasks */}
      <h2 style={{ marginTop: "40px" }}>✅ My Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks assigned to you</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {tasks.map(task => (
            <div
              key={task.id}
              style={{
                padding: "15px",
                borderRadius: "10px",
                background: "#ffffff",
                borderLeft: `6px solid ${
                  task.priority === "high"
                    ? "red"
                    : task.priority === "medium"
                    ? "orange"
                    : "green"
                }`,
                boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              }}
            >
              <strong>{task.title}</strong>
              <div style={{ fontSize: "14px", color: "#666" }}>
                Priority: {task.priority} | Status: {task.status} | Due:{" "}
                {task.dueDate || "N/A"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
