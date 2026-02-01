// src/utils/asyncHandler.js

// Method 1: Using async/await wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Method 2: Using try-catch wrapper
const asyncHandler2 = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};

module.exports = asyncHandler;