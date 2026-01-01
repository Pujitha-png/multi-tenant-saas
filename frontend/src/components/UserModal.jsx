import { useState, useEffect } from "react";
import api from "../services/api";

const UserModal = ({ isOpen, onClose, tenantId, user, refreshUsers }) => {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role || "user");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      setRole(user.role);
      setIsActive(user.isActive ?? true);
      setPassword("");
    } else {
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("user");
      setIsActive(true);
    }
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!tenantId) {
      setError("Tenant not found. Please re-login.");
      setLoading(false);
      return;
    }

    try {
      if (user?.id) {
        // Edit user
        await api.put(`/users/${user.id}`, {
          fullName,
          role,
          isActive,
          ...(password && { password }) // only include password if entered
        });
      } else {
        // Add new user
        await api.post(`/tenants/${tenantId}/users`, {
          fullName,
          email,
          password,
          role,
          isActive
        });
      }
      refreshUsers();
      onClose();
    } catch (err) {
      console.error(err);

      // Handle backend error messages
      if (err.response) {
        const { status, data } = err.response;
        if (status === 409) {
          setError("Email already exists. Please use a different email.");
        } else if (status === 400) {
          setError(data.message || "Invalid input data");
        } else if (status === 500) {
          setError("Internal server error. Please try again later.");
        } else {
          setError(data.message || "Failed to save user");
        }
      } else {
        setError("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", width: "400px" }}>
        <h2>{user?.id ? "Edit User" : "Add User"}</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div>
            <label>Full Name:</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              style={{ width: "100%", marginBottom: "10px" }}
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: "100%", marginBottom: "10px" }}
              readOnly={!!user?.id} // cannot edit email
            />
          </div>
          <div>
            <label>Password {user?.id ? "(leave blank to keep unchanged)" : ""}:</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required={!user?.id}
              style={{ width: "100%", marginBottom: "10px" }}
            />
          </div>

          {currentUser.role === "tenant_admin" && (
            <>
              <div>
                <label>Role:</label>
                <select value={role} onChange={e => setRole(e.target.value)} style={{ width: "100%", marginBottom: "10px" }}>
                  <option value="user">User</option>
                  <option value="tenant_admin">Tenant Admin</option>
                </select>
              </div>
              <div>
                <label>
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                  Active
                </label>
              </div>
            </>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
