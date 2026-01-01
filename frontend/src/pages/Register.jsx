import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    organizationName: "",
    subdomain: "",
    adminEmail: "",
    adminName: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const validate = () => {
    if (
      !form.organizationName ||
      !form.subdomain ||
      !form.adminEmail ||
      !form.adminName ||
      !form.password ||
      !form.confirmPassword
    ) {
      return "All fields are required";
    }

    if (!form.adminEmail.includes("@")) return "Invalid email address";

    if (form.password.length < 8)
      return "Password must be at least 8 characters";

    if (form.password !== form.confirmPassword) return "Passwords do not match";

    if (!form.terms) return "You must accept Terms & Conditions";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      // Payload matches backend field names
      await api.post("/auth/register-tenant", {
        tenantName: form.organizationName,       // frontend org name → backend tenantName
        subdomain: form.subdomain.trim(),        // only subdomain
        adminEmail: form.adminEmail.trim(),      // admin email
        adminFullName: form.adminName.trim(),    // frontend adminName → backend adminFullName
        adminPassword: form.password,            // frontend password → backend adminPassword
      });

      setSuccess("Tenant registered successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.log("Full error:", err);
      console.log("Response data:", JSON.stringify(err.response?.data, null, 2));
      setError(
        err.response?.data?.message ||
          JSON.stringify(err.response?.data) ||
          "Registration failed. Try again."
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
      <h2 style={{ textAlign: "center", marginBottom: "25px" }}>
        Create Organization
      </h2>

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
      {success && (
        <p
          style={{
            color: "green",
            marginBottom: "15px",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {success}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        {[
          { label: "Organization Name", name: "organizationName", type: "text", placeholder: "Enter organization name" },
          { label: "Subdomain", name: "subdomain", type: "text", placeholder: "Enter subdomain" },
          { label: "Admin Email", name: "adminEmail", type: "email", placeholder: "Enter admin email" },
          { label: "Admin Full Name", name: "adminName", type: "text", placeholder: "Enter admin full name" },
          { label: "Password", name: "password", type: "password", placeholder: "Enter password" },
          { label: "Confirm Password", name: "confirmPassword", type: "password", placeholder: "Confirm password" },
        ].map((field) => (
          <div key={field.name} style={{ marginBottom: "18px" }}>
            <label>{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              value={form[field.name]}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
            {field.name === "subdomain" && form.subdomain && (
              <small style={{ color: "#555" }}>
                {form.subdomain.trim()}.yourapp.com
              </small>
            )}
          </div>
        ))}

        <div style={{ marginBottom: "25px" }}>
          <label>
            <input
              type="checkbox"
              name="terms"
              checked={form.terms}
              onChange={handleChange}
            />{" "}
            I agree to Terms & Conditions
          </label>
        </div>

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
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "20px", color: "#555" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;
