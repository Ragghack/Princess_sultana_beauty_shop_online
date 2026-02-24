import { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiPackage,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatCurrency } from "../../utils/formatters";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
const VITE_APP_IMAGE_BASE_URL = import.meta.env.VITE_APP_IMAGE_BASE_URL;

const Bundles = () => {
  const navigate = useNavigate();
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBundles, setTotalBundles] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchBundles();
  }, [currentPage, statusFilter]);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      const response = await api.get("/bundles", { params });
      setBundles(response.data.data.bundles || []);
      setTotalPages(response.data.data.pagination?.pages || 1);
      setTotalBundles(response.data.data.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to fetch bundles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce bundle?")) {
      try {
        await api.delete(`/bundles/${id}`);
        alert("Bundle supprimé avec succès");
        fetchBundles();
      } catch (error) {
        alert("Échec de la suppression du bundle");
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "warning";
      case "OUT_OF_STOCK":
        return "error";
      default:
        return "default";
    }
  };

  // Client-side search filter
  const filteredBundles = bundles.filter(
    (bundle) =>
      bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bundle.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement des bundles..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-gray-800">Bundles</h1>
        <Button
          variant="primary"
          icon={<FiPlus />}
          onClick={() => navigate("/admin/bundles/add")}
        >
          Nouveau Bundle
        </Button>
      </div>

      {/* Filters */}
      <Card padding="lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un bundle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
            className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
            <option value="OUT_OF_STOCK">Rupture de stock</option>
          </select>
        </div>
      </Card>

      {/* Bundles Table */}
      <Card padding="lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Aperçu
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Bundle
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Produits
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Prix Original
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Prix Bundle
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Économie
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Ventes
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Statut
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBundles.map((bundle) => (
                <tr
                  key={bundle.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  {/* Preview Images */}
                  <td className="py-3 px-4">
                    <div className="flex -space-x-2">
                      {bundle.items?.slice(0, 3).map((item, idx) => (
                        <img
                          key={idx}
                          src={
                            `${VITE_APP_IMAGE_BASE_URL}${item.productImage}` ||
                            item.productImage
                          }
                          alt={item.productName}
                          className="w-12 h-12 object-cover rounded-lg border-2 border-white"
                        />
                      ))}
                      {bundle.items?.length > 3 && (
                        <div className="w-12 h-12 rounded-lg border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                          +{bundle.items.length - 3}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Bundle Name */}
                  <td className="py-3 px-4">
                    <div>
                      <Link
                        to={`/bundles/${bundle.slug}`}
                        className="font-medium text-gray-800 hover:text-primary-500"
                      >
                        {bundle.name}
                      </Link>
                      {bundle.featured && (
                        <Badge variant="info" className="ml-2">
                          Vedette
                        </Badge>
                      )}
                    </div>
                  </td>

                  {/* Products Count */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <FiPackage size={16} />
                      <span>{bundle.items?.length || 0} produits</span>
                    </div>
                  </td>

                  {/* Original Price */}
                  <td className="py-3 px-4 text-gray-500 line-through">
                    {formatCurrency(bundle.originalPrice)}
                  </td>

                  {/* Bundle Price */}
                  <td className="py-3 px-4 font-semibold text-primary-500">
                    {formatCurrency(bundle.bundlePrice)}
                  </td>

                  {/* Savings */}
                  <td className="py-3 px-4">
                    <div className="text-green-600">
                      <div className="font-semibold">
                        {formatCurrency(bundle.savingsAmount)}
                      </div>
                      <div className="text-xs">
                        {Math.round(bundle.savingsPercent)}% OFF
                      </div>
                    </div>
                  </td>

                  {/* Sales Count */}
                  <td className="py-3 px-4 text-gray-600">
                    {bundle.salesCount || 0}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <Badge variant={getStatusBadge(bundle.status)}>
                      {bundle.status}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          navigate(`/admin/bundles/edit/${bundle.id}`)
                        }
                        className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(bundle.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBundles.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FiPackage className="mx-auto text-5xl mb-3 text-gray-300" />
              <p className="text-lg font-medium">Aucun bundle trouvé</p>
              <p className="text-sm mt-1">
                Créez votre premier bundle pour commencer
              </p>
              <Button
                variant="primary"
                icon={<FiPlus />}
                onClick={() => navigate("/admin/bundles/add")}
                className="mt-4"
              >
                Créer un Bundle
              </Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
              {Math.min(currentPage * itemsPerPage, totalBundles)} sur{" "}
              {totalBundles} bundles
            </div>

            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border-2 ${
                  currentPage === 1
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FiChevronLeft size={20} />
              </button>

              {/* Page Numbers */}
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium ${
                          currentPage === page
                            ? "border-primary-500 bg-primary-500 text-white"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-2 py-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border-2 ${
                  currentPage === totalPages
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FiChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Bundles;
