using FoodOrdering.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Interfaces
{
    public interface ITokenService
    {
        string GenerateAccessToken(User user, List<string> roles);
        string GenerateRefreshToken();
        string GenerateEmailVerificationToken();
        string GeneratePasswordResetToken();
        ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    }
}
