import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const Login = () => {
  console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    tenantSubdomain: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.email || !form.password || !form.tenantSubdomain) {
      setError("Email, password, and tenant subdomain are required");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/login", {
        email: form.email.trim(),
        password: form.password,
        tenantSubdomain: form.tenantSubdomain.trim(),
      });

      console.log("Login response:", res.data);

      const token = res?.data?.data?.token;
      const user = res?.data?.data?.user; // Make sure backend returns user object

      if (!token || !user) {
        setError("Login failed: Missing token or user info");
        setLoading(false);
        return;
      }

      // Save auth data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user)); // <-- Important!
      localStorage.setItem("tenantSubdomain", form.tenantSubdomain.trim());

      console.log("Token and user saved in localStorage");

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      console.error("Backend response:", err.response?.data);

      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "450px",
        margin: "50px auto",
        padding: "25px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "25px" }}>Login</h2>

      {error && (
        <p
          style={{
            color: "red",
            marginBottom: "15px",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        {[
          {
            label: "Email",
            name: "email",
            type: "email",
            placeholder: "Enter your email",
          },
          {
            label: "Password",
            name: "password",
            type: "password",
            placeholder: "Enter your password",
          },
          {
            label: "Tenant Subdomain",
            name: "tenantSubdomain",
            type: "text",
            placeholder: "Enter tenant subdomain",
          },
        ].map((field) => (
          <div key={field.name} style={{ marginBottom: "18px" }}>
            <label>{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              value={form[field.name]}
              onChange={handleChange}
              autoComplete="off"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p
        style={{
          textAlign: "center",
          marginTop: "20px",
          color: "#555",
        }}
      >
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;
