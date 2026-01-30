import React, { useState } from "react";
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend } from "react-icons/fi";
import { FaWhatsapp, FaFacebook, FaInstagram } from "react-icons/fa";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });

      setTimeout(() => setSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Contactez-Nous
            </h1>
            <p className="text-gray-600 text-lg">
              Notre équipe est à votre écoute pour répondre à toutes vos
              questions
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Cards */}
              <Card padding="lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiPhone className="text-primary-500" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Téléphone
                    </h3>
                    <p className="text-gray-600">+237 6 XX XX XX XX</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Lun-Sam: 8h-18h
                    </p>
                  </div>
                </div>
              </Card>

              <Card padding="lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiMail className="text-primary-500" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                    <p className="text-gray-600">
                      contact@princesse-sultana.cm
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Réponse sous 24h
                    </p>
                  </div>
                </div>
              </Card>

              <Card padding="lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiMapPin className="text-primary-500" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Adresse
                    </h3>
                    <p className="text-gray-600">Akwa, Douala</p>
                    <p className="text-gray-600">Cameroun</p>
                  </div>
                </div>
              </Card>

              <Card padding="lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiClock className="text-primary-500" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Horaires
                    </h3>
                    <p className="text-gray-600">Lun-Ven: 8h-18h</p>
                    <p className="text-gray-600">Samedi: 9h-17h</p>
                    <p className="text-gray-600">Dimanche: Fermé</p>
                  </div>
                </div>
              </Card>

              {/* Social Media */}
              <Card
                padding="lg"
                className="bg-gradient-to-br from-primary-50 to-secondary-50"
              >
                <h3 className="font-semibold text-gray-800 mb-4">
                  Suivez-nous
                </h3>
                <div className="flex gap-3">
                  <a
                    href="https://wa.me/237XXXXXXXXX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors"
                  >
                    <FaWhatsapp size={20} />
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                  >
                    <FaFacebook size={20} />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white hover:bg-pink-600 transition-colors"
                  >
                    <FaInstagram size={20} />
                  </a>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card padding="lg">
                <h2 className="font-serif text-2xl font-bold text-gray-800 mb-6">
                  Envoyez-nous un message
                </h2>

                {success && (
                  <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 animate-slide-down">
                    ✓ Votre message a été envoyé avec succès! Nous vous
                    répondrons dans les plus brefs délais.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Nom complet"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Téléphone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      label="Sujet"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="6"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
                      placeholder="Décrivez votre demande..."
                    ></textarea>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    icon={<FiSend />}
                  >
                    Envoyer le message
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
