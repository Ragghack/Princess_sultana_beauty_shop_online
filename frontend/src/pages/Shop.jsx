import { FiFilter, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ProductGrid from "../components/product/ProductGrid";
import { PRODUCT_CATEGORIES } from "../utils/constants";
import { useShop } from "../hooks/useShop";
import BundleCard from "../components/bundle/BundleCard";

const Shop = () => {
  const {
    getPageNumbers,
    goToPage,
    handleCategoryChange,
    handleSearch,
    handleSortChange,
    totalPages,
    totalProducts,
    currentPage,
    order,
    sortBy,
    loading,
    products,
    setSearchTerm,
    searchTerm,
    selectedCategory,
    bundles,
  } = useShop();

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Notre Boutique
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez notre collection complète de produits capillaires premium
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full px-6 py-4 rounded-full border-2 border-gray-200 focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100 pr-32"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-primary-300 to-primary-400 text-white rounded-full font-medium hover:shadow-soft-md transition-all"
              >
                Rechercher
              </button>
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 items-center justify-between">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            <button
              onClick={() => handleCategoryChange("ALL")}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedCategory === "ALL"
                  ? "bg-gradient-to-r from-primary-300 to-primary-400 text-white shadow-soft"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Tous
            </button>
            {PRODUCT_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-primary-300 to-primary-400 text-white shadow-soft"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Sort & Results Count */}
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">
              {totalProducts} produit{totalProducts > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-600" />
              <select
                // value={sortBy}
                value={`${sortBy}_${order}`}
                onChange={handleSortChange}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none bg-white"
              >
                <option value="createdAt_desc">Plus récent</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="salesCount_desc">Populaire</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bundles */}
        {bundles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Offres Bundles 🎁</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} />
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        <ProductGrid products={products} loading={loading} />

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-12">
            <div className="flex flex-col items-center gap-4">
              {/* Page Info */}
              <p className="text-gray-600 text-sm">
                Page {currentPage} sur {totalPages}
              </p>

              {/* Pagination Buttons */}
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-primary-50 hover:text-primary-500"
                  }`}
                >
                  <FiChevronLeft size={20} />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => page !== "..." && goToPage(page)}
                    disabled={page === "..."}
                    className={`min-w-[40px] h-10 rounded-lg font-medium transition-all ${
                      page === currentPage
                        ? "bg-gradient-to-r from-primary-300 to-primary-400 text-white shadow-soft"
                        : page === "..."
                          ? "text-gray-400 cursor-default"
                          : "text-gray-700 hover:bg-primary-50 hover:text-primary-500"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-primary-50 hover:text-primary-500"
                  }`}
                >
                  <FiChevronRight size={20} />
                </button>
              </div>

              {/* Quick Jump (Optional - for many pages) */}
              {totalPages > 10 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm">
                    Aller à la page:
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        goToPage(page);
                      }
                    }}
                    className="w-16 px-2 py-1 text-center rounded-lg border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
