import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user"));

  // Hide navbar on auth pages
  if (!user || location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>Multi-Tenant SaaS</div>

      <div style={styles.links}>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/projects">Projects</Link>

        {user.role === "tenant_admin" && (
          <>
            <Link to="/users">Users</Link>
          </>
        )}
      </div>

      <div style={styles.user}>
        <span>{user.fullName} ({user.role})</span>
        <button onClick={logout} style={styles.logout}>Logout</button>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 24px",
    background: "#1e293b",
    color: "#fff",
    alignItems: "center",
  },
  logo: {
    fontWeight: "bold",
    fontSize: "18px",
  },
  links: {
    display: "flex",
    gap: "20px",
  },
  user: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
  },
  logout: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default Navbar;
