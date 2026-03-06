using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Enums;
using FoodOrdering.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Infrastructure.Repositories
{
    public class UserSessionRepository : IUserSessionRepository
    {
        private readonly AppDbContext _context;

        public UserSessionRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task CleanupExpiredSessionsAsync()
        {
           var expiredsessions= await _context.UserSessions.Where(s => s.ExpiresAt < DateTime.UtcNow||s.RevokedAt !=null).
                Where(s => s.CreatedAt < DateTime.UtcNow.AddDays(-30)).
                ToListAsync();
            _context.UserSessions.RemoveRange(expiredsessions);
            await _context.SaveChangesAsync();
        }

        public async Task<UserSession> CreateAsync(UserSession session)
        {
            _context.UserSessions.Add(session);
            await _context.SaveChangesAsync();
            return session;
        }

        public async Task<List<UserSession>> GetActiveUserSessionsAsync(Guid userId)
        {
            return await _context.UserSessions
           .Where(s => s.UserId == userId && s.RevokedAt == null && s.ExpiresAt > DateTime.UtcNow)
           .OrderByDescending(s => s.CreatedAt)
           .ToListAsync();
        }

        public async Task<UserSession?> GetByRefreshTokenAsync(string refreshToken)
        {
            return await _context.UserSessions.FirstOrDefaultAsync(s => s.RefreshToken == refreshToken);
        }

        public async Task RevokeAllUserSessionsAsync(Guid userId)
        {
            var sessions = await _context.UserSessions.Where(s => s.UserId == userId && s.RevokedAt == null).ToListAsync();
            foreach (var session in sessions) { 
            session.RevokedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
        }

        public async Task RevokeSessionAsync(Guid sessionId)
        {
          var session = await _context.UserSessions.FindAsync(sessionId);
            if (session != null)
            {
                session.RevokedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
    }
}
