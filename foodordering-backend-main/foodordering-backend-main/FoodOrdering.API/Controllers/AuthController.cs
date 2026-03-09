

using FoodOrdering.Application.DTOs.Auth;
using FoodOrdering.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FoodOrdering.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IAuthService authService,
            ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        /// <summary>
        /// Login with username and password
        /// </summary>
        [HttpPost("login")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
                var requestWithContext = request with { IpAddress = ipAddress, UserAgent = userAgent };

                var response = await _authService.LoginAsync(requestWithContext);
                return Ok(new
                {
                    message = "Login successful",
                    data = response
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Login failed - Invalid credentials");
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Login failed - Unauthorized");
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login");
                return StatusCode(500, new { message = "An error occurred during login" });
            }
        }

        /// <summary>
        /// Register a new customer or regular user
        /// </summary>
        [HttpPost("register")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                var requestWithIp = request with { IpAddress = ipAddress };

                await _authService.RegisterAsync(requestWithIp);
                return StatusCode(201, new
                {
                    message = "Registration successful. You can now log in."
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Registration failed");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration");
                return StatusCode(500, new { message = "An error occurred during registration" });
            }
        }

        /// <summary>
        /// Register a new restaurant owner with restaurant profile
        /// </summary>
        [HttpPost("register-restaurant")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RegisterRestaurant([FromForm] RegisterRestaurantRequest request)
        {
            try
            {
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                var requestWithIp = request with { IpAddress = ipAddress };

                await _authService.RegisterRestaurantAsync(requestWithIp);
                return StatusCode(201, new
                {
                    message = "Restaurant registration successful. You can now log in.",
                    restaurantName = request.RestaurantName
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Restaurant registration failed");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during restaurant registration");
                return StatusCode(500, new { message = "An error occurred during restaurant registration" });
            }
        }

        /// <summary>
        /// Refresh access token using refresh token
        /// </summary>
        [HttpPost("refresh-token")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            try
            {
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
                var requestWithContext = request with { IpAddress = ipAddress, UserAgent = userAgent };

                var response = await _authService.RefreshTokenAsync(requestWithContext);
                return Ok(new
                {
                    message = "Token refreshed successfully",
                    data = response
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Refresh token failed - Unauthorized");
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing token");
                return StatusCode(500, new { message = "An error occurred while refreshing token" });
            }
        }

        /// <summary>
        /// Revoke/logout current refresh token
        /// </summary>
        [Authorize]
        [HttpPost("revoke-token")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RevokeToken([FromBody] RefreshTokenRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _authService.RevokeTokenAsync(userId, request.RefreshToken);
                return Ok(new { message = "Logged out successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking token");
                return StatusCode(500, new { message = "An error occurred during logout" });
            }
        }

        /// <summary>
        /// Revoke all tokens (logout from all devices)
        /// </summary>
        [Authorize]
        [HttpPost("revoke-all-tokens")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RevokeAllTokens()
        {
            try
            {
                var userId = GetCurrentUserId();
                await _authService.RevokeAllTokensAsync(userId);
                return Ok(new { message = "Logged out from all devices successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking all tokens");
                return StatusCode(500, new { message = "An error occurred during logout" });
            }
        }

        /// <summary>
        /// Get active sessions for the current user
        /// </summary>
        [Authorize]
        [HttpGet("sessions")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetActiveSessions()
        {
            try
            {
                var userId = GetCurrentUserId();
                var refreshToken = HttpContext.Request.Headers["X-Refresh-Token"].FirstOrDefault();
                var sessions = await _authService.GetActiveSessionsAsync(userId, refreshToken ?? string.Empty);

                return Ok(new { data = sessions });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sessions");
                return StatusCode(500, new { message = "An error occurred while retrieving sessions" });
            }
        }

        /// <summary>
        /// Verify email address with token
        /// </summary>
        [HttpPost("verify-email")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
        {
            try
            {
                await _authService.VerifyEmailAsync(request);
                return Ok(new { message = "Email verified successfully. You can now log in." });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Email verification failed");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying email");
                return StatusCode(500, new { message = "An error occurred during email verification" });
            }
        }

        /// <summary>
        /// Resend email verification
        /// </summary>
        [HttpPost("resend-verification")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResendVerification([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                await _authService.ResendEmailVerificationAsync(request.Email);
                return Ok(new { message = "If an unverified account exists with this email, a verification link has been sent." });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Resend verification failed");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resending verification");
                return StatusCode(500, new { message = "An error occurred while sending verification email" });
            }
        }

        /// <summary>
        /// Request password reset
        /// </summary>
        [HttpPost("forgot-password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                await _authService.ForgotPasswordAsync(request);
                return Ok(new { message = "If the email exists, a password reset link has been sent." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in forgot password");
                // Always return success to prevent email enumeration
                return Ok(new { message = "If the email exists, a password reset link has been sent." });
            }
        }

        /// <summary>
        /// Reset password with token
        /// </summary>
        [HttpPost("reset-password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                await _authService.ResetPasswordAsync(request);
                return Ok(new { message = "Password reset successfully. Please log in with your new password." });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Password reset failed");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password");
                return StatusCode(500, new { message = "An error occurred while resetting password" });
            }
        }

        /// <summary>
        /// Change password for authenticated user
        /// </summary>
        [Authorize]
        [HttpPost("change-password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _authService.ChangePasswordAsync(userId, request);
                return Ok(new { message = "Password changed successfully. Please log in again." });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Change password failed - Unauthorized");
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Change password failed");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password");
                return StatusCode(500, new { message = "An error occurred while changing password" });
            }
        }

        /// <summary>
        /// Helper method to get current user ID from claims
        /// </summary>
        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }
            return userId;
        }
    }
}