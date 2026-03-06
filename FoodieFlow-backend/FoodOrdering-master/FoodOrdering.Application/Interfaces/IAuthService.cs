using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FoodOrdering.Application.DTOs.Auth;

namespace FoodOrdering.Application.Interfaces
{
    public interface IAuthService
    {
       
        Task RegisterAsync(RegisterRequest request);

        Task RegisterRestaurantAsync(RegisterRestaurantRequest request);
        Task<TokenResponse> LoginAsync(LoginRequest request);

       
        Task<TokenResponse> RefreshTokenAsync(RefreshTokenRequest request);

       
        Task RevokeTokenAsync(Guid userId, string refreshToken);

        
        Task RevokeAllTokensAsync(Guid userId);

        Task<List<UserSessionResponse>> GetActiveSessionsAsync(Guid userId, string currentRefreshToken);

        
        Task VerifyEmailAsync(VerifyEmailRequest request);

       
        Task ResendEmailVerificationAsync(string email);

       
        Task ForgotPasswordAsync(ForgotPasswordRequest request);

        
        Task ResetPasswordAsync(ResetPasswordRequest request);

       
        Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);

        

      
        

    }
}
