import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { FiMail, FiLock, FiUser, FiPhone } from "react-icons/fi";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

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
      await register(formData);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="lg">
      <h2 className="font-serif text-2xl font-bold text-gray-800 mb-6 text-center">
        Inscription
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Prénom"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            icon={<FiUser />}
            required
          />
          <Input
            label="Nom"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            icon={<FiUser />}
            required
          />
        </div>

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
          label="Téléphone"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          icon={<FiPhone />}
          placeholder="+237 6XX XX XX XX"
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
          S'inscrire
        </Button>

        <p className="text-center text-gray-600">
          Déjà un compte?{" "}
          <Link
            to="/login"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Se connecter
          </Link>
        </p>
      </form>
    </Card>
  );
};

export default Register;
