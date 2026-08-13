import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMapPin,
  FiSearch,
  FiX,
} from "react-icons/fi";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatCurrency } from "../../utils/formatters";
import api from "../../services/api";

const emptyForm = { region: "", town: "", quarter: "", fee: "", isActive: true };

const DeliveryZones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const response = await api.get("/delivery-zones/admin", {
        params: { search: search || undefined, limit: 200 },
      });
      setZones(response.data.data.zones);
    } catch (err) {
      console.error("Failed to fetch delivery zones:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (zone) => {
    setEditingId(zone.id);
    setForm({
      region: zone.region,
      town: zone.town,
      quarter: zone.quarter || "",
      fee: String(zone.fee),
      isActive: zone.isActive,
    });
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.region.trim() || !form.town.trim() || form.fee === "") {
      setError("Région, ville et frais sont requis");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        region: form.region.trim(),
        town: form.town.trim(),
        quarter: form.quarter.trim() || null,
        fee: Number(form.fee),
        isActive: form.isActive,
      };

      if (editingId) {
        await api.patch(`/delivery-zones/${editingId}`, payload);
      } else {
        await api.post("/delivery-zones", payload);
      }

      closeForm();
      fetchZones();
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de l'enregistrement",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zone) => {
    if (
      !window.confirm(
        `Supprimer la zone "${zone.town}${zone.quarter ? " - " + zone.quarter : ""}" ?`,
      )
    ) {
      return;
    }
    try {
      await api.delete(`/delivery-zones/${zone.id}`);
      fetchZones();
    } catch (err) {
      alert(
        err.response?.data?.message || "Erreur lors de la suppression",
      );
    }
  };

  const toggleActive = async (zone) => {
    try {
      await api.patch(`/delivery-zones/${zone.id}`, {
        isActive: !zone.isActive,
      });
      fetchZones();
    } catch (err) {
      console.error("Failed to toggle zone status:", err);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-800">
            Zones de Livraison
          </h1>
          <p className="text-gray-500 text-sm">
            Gérez les frais de livraison par ville et quartier
          </p>
        </div>
        <Button variant="primary" icon={<FiPlus />} onClick={openAddForm}>
          Ajouter une zone
        </Button>
      </div>

      {/* Search */}
      <Card padding="md" className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par région, ville ou quartier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
      </Card>

      {/* Add/Edit form */}
      {showForm && (
        <Card padding="lg" className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg text-gray-800">
              {editingId ? "Modifier la zone" : "Nouvelle zone"}
            </h2>
            <button
              onClick={closeForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Région"
                value={form.region}
                onChange={(e) =>
                  setForm((f) => ({ ...f, region: e.target.value }))
                }
                placeholder="Ex: Littoral"
                required
              />
              <Input
                label="Ville"
                value={form.town}
                onChange={(e) =>
                  setForm((f) => ({ ...f, town: e.target.value }))
                }
                placeholder="Ex: Douala"
                required
              />
              <Input
                label="Quartier (optionnel)"
                value={form.quarter}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quarter: e.target.value }))
                }
                placeholder="Ex: Bonabéri"
              />
            </div>

            <div className="flex items-end gap-4">
              <div className="flex-1 max-w-xs">
                <Input
                  label="Frais de livraison (XAF)"
                  type="number"
                  min="0"
                  value={form.fee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fee: e.target.value }))
                  }
                  placeholder="Ex: 1500"
                  required
                />
              </div>
              <label className="flex items-center gap-2 pb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-600">Zone active</span>
              </label>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" variant="primary" loading={saving}>
                {editingId ? "Enregistrer" : "Ajouter"}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Zones list */}
      <Card padding="none">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : zones.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FiMapPin className="mx-auto mb-3 text-3xl text-gray-300" />
            <p>Aucune zone de livraison configurée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Région
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Ville
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Quartier
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Frais
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {zone.region}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {zone.town}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {zone.quarter || (
                        <span className="text-gray-400">Toute la ville</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {formatCurrency(zone.fee)}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleActive(zone)}>
                        <Badge variant={zone.isActive ? "success" : "default"}>
                          {zone.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditForm(zone)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(zone)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DeliveryZones;