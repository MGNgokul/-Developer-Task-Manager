import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.name.length < 3) return alert("Name must be at least 3 characters");
    if (!EMAIL_REGEX.test(form.email.trim())) return alert("Invalid email");
    if (!PASSWORD_REGEX.test(form.password))
      return alert("Password must be 8+ chars with upper, lower, number and symbol");

    register({ ...form, email: form.email.trim().toLowerCase() });
    navigate("/login");
  };

  return (
    <form onSubmit={handleSubmit} className="auth-card">
      <h2>Register</h2>
      <input
        placeholder="Name"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <button className="btn">Register</button>
    </form>
  );
}

export default RegisterForm;
