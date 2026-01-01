import { useEffect, useState } from "react";
import api from "../services/api";
import UserModal from "../components/UserModal";

const UsersList = () => {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const tenantId = currentUser?.tenantId;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const fetchUsers = async () => {
    if (!tenantId) {
      setError("Tenant not found. Please re-login.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/tenants/${tenantId}/users`, {
        params: { search: searchTerm, role: filterRole },
      });
      setUsers(res.data?.data?.users || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, filterRole]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: "900px", margin: "50px auto" }}>
      <h1>Users</h1>

      {currentUser?.role === "tenant_admin" && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button onClick={() => { setEditingUser(null); setModalOpen(true); }}>
            Add User
          </button>

          <input
            type="text"
            placeholder="Search by name/email"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="tenant_admin">Tenant Admin</option>
          </select>
        </div>
      )}

      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created At</th>
              {currentUser?.role === "tenant_admin" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid #ccc" }}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>
                  <span style={{
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: u.role === "tenant_admin" ? "#f0ad4e" : "#5bc0de",
                    color: "#fff",
                  }}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span style={{
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: u.isActive ? "#5cb85c" : "#d9534f",
                    color: "#fff",
                  }}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleString()}</td>

                {currentUser?.role === "tenant_admin" && (
                  <td>
                    <button onClick={() => { setEditingUser(u); setModalOpen(true); }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(u.id)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <UserModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingUser(null); }}
        tenantId={tenantId}
        user={editingUser}
        refreshUsers={fetchUsers}
      />
    </div>
  );
};

export default UsersList;
