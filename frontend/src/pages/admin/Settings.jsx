import React, { useState } from "react";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { FiSave } from "react-icons/fi";

const Settings = () => {
  const [settings, setSettings] = useState({
    deliveryFee: "2000",
    shopName: "Princesse Sultana Hair Care",
    shopEmail: "contact@princesse-sultana.cm",
    shopPhone: "+237 6 XX XX XX XX",
    shopAddress: "Akwa, Douala, Cameroun",
    lowStockThreshold: "10",
    taxRate: "0",
    currency: "XAF",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-gray-800">
          Paramètres
        </h1>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg animate-slide-down">
          ✓ Paramètres mis à jour avec succès!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Shop Information */}
        <Card padding="lg" className="mb-6">
          <h2 className="font-semibold text-xl text-gray-800 mb-6">
            Informations de la Boutique
          </h2>
          <div className="space-y-4">
            <Input
              label="Nom de la boutique"
              name="shopName"
              value={settings.shopName}
              onChange={handleChange}
              required
            />
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                name="shopEmail"
                value={settings.shopEmail}
                onChange={handleChange}
                required
              />
              <Input
                label="Téléphone"
                type="tel"
                name="shopPhone"
                value={settings.shopPhone}
                onChange={handleChange}
                required
              />
            </div>
            <Input
              label="Adresse"
              name="shopAddress"
              value={settings.shopAddress}
              onChange={handleChange}
              required
            />
          </div>
        </Card>

        {/* Business Settings */}
        <Card padding="lg" className="mb-6">
          <h2 className="font-semibold text-xl text-gray-800 mb-6">
            Paramètres Commerciaux
          </h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Input
                label="Frais de livraison (XAF)"
                type="number"
                name="deliveryFee"
                value={settings.deliveryFee}
                onChange={handleChange}
                required
              />
              <Input
                label="Seuil stock faible"
                type="number"
                name="lowStockThreshold"
                value={settings.lowStockThreshold}
                onChange={handleChange}
                required
              />
              <Input
                label="Taux de taxe (%)"
                type="number"
                name="taxRate"
                value={settings.taxRate}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Devise
              </label>
              <select
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
              >
                <option value="XAF">XAF - Franc CFA</option>
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - Dollar US</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card padding="lg" className="mb-6">
          <h2 className="font-semibold text-xl text-gray-800 mb-6">
            Paramètres de Notification
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Notifications Email</p>
                <p className="text-sm text-gray-600">
                  Recevoir des emails pour les nouvelles commandes
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">
                  Notifications WhatsApp
                </p>
                <p className="text-sm text-gray-600">
                  Recevoir des messages WhatsApp pour les nouvelles commandes
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">
                  Alertes Stock Faible
                </p>
                <p className="text-sm text-gray-600">
                  Être notifié quand un produit atteint le seuil de stock faible
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={<FiSave />}
          >
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
