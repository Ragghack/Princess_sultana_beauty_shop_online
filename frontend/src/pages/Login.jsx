import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { FiMail, FiLock } from "react-icons/fi";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.title === "toBeAuthToAddToCart") {
      alert("Svp vous devez vous authentifier avant d'ajouter au panier");
    }
  }, [location]);

  // Get the page user was trying to access (if any)
  const from = location.state?.from?.pathname || null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(formData.email, formData.password);

      // Role-based redirect
      redirectBasedOnRole(user);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const redirectBasedOnRole = (user) => {
    // If user was trying to access a specific page, go there
    if (from) {
      navigate(from, { replace: true });
      return;
    }

    // Otherwise, redirect based on role
    switch (user.role) {
      case "ADMIN":
        navigate("/admin", { replace: true });
        break;
      case "STAFF":
        navigate("/admin", { replace: true });
        break;
      case "DELIVERY":
        navigate("/delivery", { replace: true });
        break;
      case "CUSTOMER":
        navigate("/", { replace: true });
        break;
      default:
        navigate("/", { replace: true });
    }
  };

  return (
    <Card padding="lg">
      <h2 className="font-serif text-2xl font-bold text-gray-800 mb-6 text-center">
        Connexion
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          icon={<FiMail />}
          required
        />

        <Input
          label="Mot de passe"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          icon={<FiLock />}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          className="mb-4"
        >
          Se connecter
        </Button>

        <p className="text-center text-gray-600">
          Pas de compte?{" "}
          <Link
            to="/register"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            S'inscrire
          </Link>
        </p>
      </form>
    </Card>
  );
};

export default Login;
