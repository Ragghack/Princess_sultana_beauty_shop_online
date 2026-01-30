const authService = require("../services/authService");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class AuthController {
  /**
   * @route   POST /api/v1/auth/register
   * @desc    Register new user
   * @access  Public
   */
  register = asyncHandler(async (req, res) => {
    const { email, phone, password, firstName, lastName } = req.body;

    const result = await authService.register({
      email,
      phone,
      password,
      firstName,
      lastName,
    });

    res.status(201).json(new ApiResponse(201, result, "Inscription réussie"));
  });

  /**
   * @route   POST /api/v1/auth/login
   * @desc    Login user
   * @access  Public
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json(new ApiResponse(200, result, "Connexion réussie"));
  });

  /**
   * @route   POST /api/v1/auth/refresh-token
   * @desc    Refresh access token
   * @access  Public
   */
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshToken(refreshToken);

    res.status(200).json(new ApiResponse(200, tokens, "Token renouvelé"));
  });

  /**
   * @route   POST /api/v1/auth/logout
   * @desc    Logout user
   * @access  Private
   */
  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    await authService.logout(refreshToken);

    res.status(200).json(new ApiResponse(200, null, "Déconnexion réussie"));
  });

  /**
   * @route   GET /api/v1/auth/me
   * @desc    Get current user
   * @access  Private
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    res
      .status(200)
      .json(new ApiResponse(200, req.user, "Utilisateur récupéré"));
  });
}

module.exports = new AuthController();
