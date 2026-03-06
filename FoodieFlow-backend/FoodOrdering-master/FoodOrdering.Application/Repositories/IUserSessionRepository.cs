using FoodOrdering.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Repositories
{
    public interface IUserSessionRepository
    {
        Task<UserSession> CreateAsync(UserSession session);
        Task<UserSession?> GetByRefreshTokenAsync(string refreshToken);
        Task<List<UserSession>> GetActiveUserSessionsAsync(Guid userId);
        Task RevokeSessionAsync(Guid sessionId);
        Task RevokeAllUserSessionsAsync(Guid userId);
        Task CleanupExpiredSessionsAsync();
    }
}
