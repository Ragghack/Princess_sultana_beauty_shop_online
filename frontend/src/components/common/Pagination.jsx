import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Pagination = ({ currentPage, totalPages, getPageNumbers, goToPage }) => {
  return (
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
            <span className="text-gray-600 text-sm">Aller à la page:</span>
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
  );
};

export default Pagination;
