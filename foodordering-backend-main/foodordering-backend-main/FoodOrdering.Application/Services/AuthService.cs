
using FoodOrdering.Application.DTOs.Auth;
using FoodOrdering.Application.DTOs.Restaurant;
using FoodOrdering.Application.Interfaces;
using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using FoodOrdering.Core.Enums;
using FoodOrdering.Core.Validator;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AuditLog = FoodOrdering.Core.Enums.AuditLog;

namespace FoodOrdering.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IAuthRepository _authRepository;
        private readonly IUserSessionRepository _userSessionRepository;
        private readonly IRestaurantRepository _restaurantRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IEmailService _emailService;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _configuration;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly IRestaurantService _restaurantService;
        private readonly ILogger<AuthService> _logger;

        int MaxFailedAttempts = 5;

        public AuthService(
            IAuthRepository authRepository,
            IRoleRepository roleRepository,
            IPasswordHasher passwordHasher,
            IRestaurantRepository restaurantRepository,
            IEmailService emailService,
            ITokenService tokenService,
            IConfiguration configuration,
            IAuditLogRepository auditLogRepository,
            IUserSessionRepository userSessionRepository,
            IRestaurantService restaurantService,
            ILogger<AuthService> logger)
        {
            _authRepository = authRepository;
            _roleRepository = roleRepository;
            _passwordHasher = passwordHasher;
            _emailService = emailService;
            _tokenService = tokenService;
            _restaurantRepository = restaurantRepository;
            _configuration = configuration;
            _auditLogRepository = auditLogRepository;
            _userSessionRepository = userSessionRepository;
            _restaurantService = restaurantService;
            _logger = logger;
        }

        public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
        {
            var user = await _authRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("user not found");
            }

            var verifypassword = _passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash);
            if (!verifypassword)
            {
                throw new InvalidOperationException("incorrect password");
            }
            var validate = PasswordValidator.Validate(request.NewPassword);
            if (!validate.IsValid)
                throw new InvalidOperationException(validate.ErrorMessage);

            await _userSessionRepository.RevokeAllUserSessionsAsync(userId);
            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            await _authRepository.UpdateAsync(user);
            await LogAuditAsync(user.Id, "Password Changed", "User changed their password", "System", true);
            _logger.LogInformation("Password changed for user {UserId}", userId);
        }

        public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
        {
            var user = await _authRepository.GetByEmailAsync(request.Email);
            if (user == null)
            {
                _logger.LogInformation("Password reset requested for non-existent email: {Email}", request.Email);
                return;
            }
            var resettoken = _tokenService.GeneratePasswordResetToken();
            user.PasswordResetToken = resettoken;
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
            await _authRepository.UpdateAsync(user);

            await _emailService.SendPasswordResetAsync(user.Email, user.Username, resettoken);
            await LogAuditAsync(user.Id, "Password Reset Requested", "Reset token generated", "System", true);
            _logger.LogInformation("Password reset requested for user {UserId}", user.Id);
        }

        public async Task<List<UserSessionResponse>> GetActiveSessionsAsync(Guid userId, string currentRefreshToken)
        {
            var sessions = await _userSessionRepository.GetActiveUserSessionsAsync(userId);

            return sessions.Select(s => new UserSessionResponse(
                s.Id,
                s.IpAddress,
                s.UserAgent,
                s.CreatedAt,
                s.ExpiresAt,
                !string.IsNullOrEmpty(currentRefreshToken) && s.RefreshToken == currentRefreshToken
            )).ToList();
        }

        public async Task<TokenResponse> LoginAsync(LoginRequest request)
        {
            var user = await _authRepository.GetByUsernameAsync(request.Username);
            if (user == null)
            {
                await LogAuditAsync(null, "Login Failed", $"Invalid credentials attempt", request.IpAddress ?? "Unknown", false);
                throw new InvalidOperationException("invalid login credentials");
            }
            if (user.IsLockedOut())
            {
                await LogAuditAsync(user.Id, "Login Failed", "Account locked out", request.IpAddress ?? "Unknown", false);
                throw new UnauthorizedAccessException("Account is temporarily locked. Please try again later or reset your password.");
            }
            var validatepassword = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
            if (!validatepassword)
            {
                user.FailedLoginAttempts++;
                if (user.FailedLoginAttempts >= MaxFailedAttempts)
                {
                    user.LockoutEnd = DateTime.UtcNow.AddMinutes(5);
                    _logger.LogWarning("User {UserId} locked out due to too many failed attempts", user.Id);
                }
                await _authRepository.UpdateAsync(user);
                await LogAuditAsync(user.Id, "Login Failed", "Invalid password", request.IpAddress ?? "Unknown", false);
                throw new UnauthorizedAccessException("Invalid credentials");
            }
            if (!user.IsActive)
            {
                await LogAuditAsync(user.Id, "Login Failed", "Account inactive", request.IpAddress ?? "Unknown", false);
                throw new UnauthorizedAccessException("Account is inactive. Please contact support.");
            }
            // EMAIL VERIFICATION CHECK DISABLED — skipping email verified gate
            // if (!user.EmailVerified)
            // {
            //     await LogAuditAsync(user.Id, "Login Failed", "Email not verified", request.IpAddress ?? "Unknown", false);
            //     throw new UnauthorizedAccessException("Please verify your email before logging in. Check your inbox for the verification link.");
            // }
            user.LastLoginAt = DateTime.UtcNow;
            user.LastLoginIp = request.IpAddress;
            user.LockoutEnd = null;
            user.FailedLoginAttempts = 0;
            await _authRepository.UpdateAsync(user);

            var role = await _roleRepository.GetUserRolesAsync(user.Id);
            var token = _tokenService.GenerateAccessToken(user, role);
            var refreshtoken = _tokenService.GenerateRefreshToken();

            var session = new UserSession
            {
                CreatedAt = DateTime.UtcNow,
                UserId = user.Id,
                RefreshToken = refreshtoken,
                IpAddress = request.IpAddress ?? "Unknown",
                UserAgent = request.UserAgent,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };
            await _userSessionRepository.CreateAsync(session);
            await LogAuditAsync(user.Id, "Login Successful", $"Logged in from {request.IpAddress}", request.IpAddress ?? "Unknown", true);
            _logger.LogInformation("User {UserId} logged in successfully from {IpAddress}", user.Id, request.IpAddress);

            return new TokenResponse(token, refreshtoken, DateTime.UtcNow.AddHours(1));
        }

        public async Task<TokenResponse> RefreshTokenAsync(RefreshTokenRequest request)
        {
            var session = await _userSessionRepository.GetByRefreshTokenAsync(request.RefreshToken);

            if (session == null || !session.IsActive)
            {
                throw new UnauthorizedAccessException("Invalid refresh token");
            }

            var user = await _authRepository.GetByIdAsync(session.UserId);
            if (user == null || !user.IsActive)
            {
                throw new UnauthorizedAccessException("Invalid user");
            }

            await _userSessionRepository.RevokeSessionAsync(session.Id);

            var roles = await _authRepository.GetUserRolesAsync(user.Id);
            var newAccessToken = _tokenService.GenerateAccessToken(user, roles);
            var newRefreshToken = _tokenService.GenerateRefreshToken();

            var newSession = new UserSession
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                RefreshToken = newRefreshToken,
                IpAddress = request.IpAddress ?? session.IpAddress,
                UserAgent = request.UserAgent ?? session.UserAgent,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };
            await _userSessionRepository.CreateAsync(newSession);

            await LogAuditAsync(user.Id, "Token Refreshed", $"From {request.IpAddress}", request.IpAddress ?? "Unknown", true);

            return new TokenResponse(newAccessToken, newRefreshToken, DateTime.UtcNow.AddHours(1));
        }

        public async Task RegisterAsync(RegisterRequest request)
        {
            var existinguser = await _authRepository.GetByUsernameAsync(request.Username);
            if (existinguser != null)
                throw new InvalidOperationException("Username already exists");
            var existingemail = await _authRepository.GetByEmailAsync(request.Email);
            if (existingemail != null)
                throw new InvalidOperationException("Email already used");
            if (request.Role != "Customer" && request.Role != "Restaurant")
                throw new InvalidOperationException("Invalid Role");
            var passwordvalidation = PasswordValidator.Validate(request.Password);
            if (!passwordvalidation.IsValid)
            {
                throw new InvalidOperationException("Invalid password Format");
            }
            // EMAIL VERIFICATION DISABLED — users are auto-verified on registration
            // var emailverification = _tokenService.GenerateEmailVerificationToken();

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                PhoneNumber = request.Phone,
                EmailVerificationToken = null,          // no token needed
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                EmailVerified = true,                   // auto-verified
                EmailVerificationTokenExpiry = null,
            };
            await _authRepository.CreateAsync(user);

            var role = await _roleRepository.GetByNameAsync(request.Role);
            if (role == null)
            {
                throw new InvalidOperationException($"Role '{request.Role}' not found in the system");
            }
            await _roleRepository.AssignRoleToUserAsync(user.Id, role.Id);

            // await _emailService.SendEmailVerificationAsync(user.Email, user.Username, emailverification);
            await LogAuditAsync(user.Id, "User Registered", $"New {request.Role} registered from {request.IpAddress}", request.IpAddress ?? "Unknown", true);

            _logger.LogInformation("New {Role} user {UserId} registered with username {Username}", request.Role, user.Id, user.Username);
        }

        public async Task RegisterRestaurantAsync(RegisterRestaurantRequest request)
        {
            // Validate username
            var existinguser = await _authRepository.GetByUsernameAsync(request.Username);
            if (existinguser != null)
                throw new InvalidOperationException("Username already exists");

            // Validate email
            var existingemail = await _authRepository.GetByEmailAsync(request.Email);
            if (existingemail != null)
                throw new InvalidOperationException("Email already used");

            // Validate password
            var passwordvalidation = PasswordValidator.Validate(request.Password);
            if (!passwordvalidation.IsValid)
            {
                throw new InvalidOperationException(passwordvalidation.ErrorMessage);
            }

            // Validate restaurant name is provided
            if (string.IsNullOrWhiteSpace(request.RestaurantName))
            {
                throw new InvalidOperationException("Restaurant name is required");
            }

            // EMAIL VERIFICATION DISABLED — users are auto-verified on registration
            // var emailverification = _tokenService.GenerateEmailVerificationToken();

            // Create user account
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                PhoneNumber = request.Phone,
                EmailVerificationToken = null,          // no token needed
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                EmailVerified = true,                   // auto-verified
                EmailVerificationTokenExpiry = null,
            };

            await _authRepository.CreateAsync(user);

            // Assign Restaurant role
            var role = await _roleRepository.GetByNameAsync("Restaurant");
            if (role == null)
            {
                throw new InvalidOperationException("Restaurant role not found in the system");
            }
            await _roleRepository.AssignRoleToUserAsync(user.Id, role.Id);

            // Create restaurant profile
            var restaurantRequest = new CreateRestaurantRequest(
                RestaurantName: request.RestaurantName,
                RestaurantDescription: request.RestaurantDescription,
                PhoneNumber: request.RestaurantPhone ?? request.Phone,
                Address: request.Address,
                City: request.City,
                State: request.State,
                Country: request.Country,

                RestaurantLogo: request.RestaurantLogo,
                RestaurantBanner: request.RestaurantBanner
            );

            await _restaurantService.CreateRestaurantAsync(user.Id, restaurantRequest);

            // Send verification email — DISABLED, users are auto-verified
            // await _emailService.SendEmailVerificationAsync(user.Email, user.Username, emailverification);

            await LogAuditAsync(user.Id, "Restaurant User Registered",
                $"New restaurant '{request.RestaurantName}' registered from {request.IpAddress}",
                request.IpAddress ?? "Unknown", true);

            _logger.LogInformation("New restaurant user {UserId} registered with username {Username} and restaurant {RestaurantName}",
                user.Id, user.Username, request.RestaurantName);
        }

        public async Task ResendEmailVerificationAsync(string email)
        {
            var user = await _authRepository.GetByEmailAsync(email);

            if (user == null)
            {
                _logger.LogInformation("Email verification resend requested for non-existent email: {Email}", email);
                return;
            }

            if (user.EmailVerified)
            {
                throw new InvalidOperationException("Email is already verified");
            }

            var newToken = _tokenService.GenerateEmailVerificationToken();
            user.EmailVerificationToken = newToken;
            user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);
            await _authRepository.UpdateAsync(user);

            await _emailService.SendEmailVerificationAsync(user.Email, user.Username, newToken);
            await LogAuditAsync(user.Id, "Email Verification Resent", "New verification email sent", "System", true);
        }

        public async Task ResetPasswordAsync(ResetPasswordRequest request)
        {
            var user = await _authRepository.GetByPasswordResetTokenAsync(request.Token);
            if (user == null)
                throw new InvalidOperationException("invalid token");
            if (user.PasswordResetTokenExpiry < DateTime.UtcNow)
            {
                throw new InvalidOperationException("Reset token has expired");
            }

            var validate = PasswordValidator.Validate(request.NewPassword);
            if (!validate.IsValid)
                throw new InvalidOperationException("invalid password");
            await _userSessionRepository.RevokeAllUserSessionsAsync(user.Id);
            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;
            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;
            await _authRepository.UpdateAsync(user);
            await LogAuditAsync(user.Id, "Password Reset", "Password changed via reset token", "System", true);
            _logger.LogInformation("Password reset completed for user {UserId}", user.Id);
        }

        public async Task RevokeAllTokensAsync(Guid userId)
        {
            await _userSessionRepository.RevokeAllUserSessionsAsync(userId);
            await LogAuditAsync(userId, "All Tokens Revoked", "All sessions terminated", "System", true);
            _logger.LogInformation("All sessions revoked for user {UserId}", userId);
        }

        public async Task RevokeTokenAsync(Guid userId, string refreshToken)
        {
            var session = await _userSessionRepository.GetByRefreshTokenAsync(refreshToken);
            if (session != null && session.UserId == userId)
            {
                await _userSessionRepository.RevokeSessionAsync(session.Id);
                await LogAuditAsync(userId, "Token Revoked", "User logged out", "System", true);
                _logger.LogInformation("User {UserId} logged out", userId);
            }
        }

        public async Task VerifyEmailAsync(VerifyEmailRequest request)
        {
            var user = await _authRepository.GetByEmailVerificationTokenAsync(request.Token);
            if (user == null)
                throw new NotImplementedException("Invalid Token");

            if (user.EmailVerificationTokenExpiry < DateTime.UtcNow)
            {
                throw new InvalidOperationException("Verification token has expired. Please request a new one.");
            }
            user.EmailVerificationTokenExpiry = null;
            user.EmailVerificationToken = null;
            user.EmailVerified = true;
            await _authRepository.UpdateAsync(user);
            await LogAuditAsync(user.Id, "Email Verified", "Email verification successful", "System", true);
            _logger.LogInformation("Email verified for user {UserId}", user.Id);
        }

        private async Task LogAuditAsync(Guid? userId, string action, string? details, string ipAddress, bool isSuccess)
        {
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                Details = details,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow,
                IsSuccess = isSuccess
            };

            await _auditLogRepository.CreateAsync(auditLog);
        }
    }
}