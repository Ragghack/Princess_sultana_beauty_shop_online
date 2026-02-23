import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import Card from "../common/Card";
import Input from "../common/Input";
import Button from "../common/Button";
import { FiUser, FiMail, FiPhone, FiSave } from "react-icons/fi";
import api from "../../services/api";

const ProfileSettings = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    api
      .get("/users/profile")
      .then((res) => {
        setFormData({
          firstName: res.data.data.firstName,
          lastName: res.data.data.lastName,
          email: res.data.data.email,
          phone: res.data.data.phone,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    api
      .patch("/users/profile", formData)
      .then((res) => {
        fetchProfile();
        setSuccess(true);

        setTimeout(() => setSuccess(false), 3000);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <Card padding="lg">
      <h2 className="font-serif text-2xl font-bold text-gray-800 mb-6">
        Paramètres du Profil
      </h2>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
          ✓ Profil mis à jour avec succès!
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
          disabled
        />

        <Input
          label="Téléphone"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          icon={<FiPhone />}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          icon={<FiSave />}
        >
          Enregistrer les modifications
        </Button>
      </form>
    </Card>
  );
};

export default ProfileSettings;
