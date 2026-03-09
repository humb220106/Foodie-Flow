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
   public class AuditLogRepository : IAuditLogRepository
    {
        private readonly AppDbContext _context;

        public AuditLogRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(AuditLog auditLog)
        {
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }

        public async Task<List<AuditLog>> GetUserAuditLogsAsync(Guid userId, int take = 50)
        {
            return await _context.AuditLogs
           .Where(a => a.UserId == userId)
           .OrderByDescending(a => a.CreatedAt)
           .Take(take)
           .ToListAsync();
        }
        public async Task<List<AuditLog>> GetAllAsync(int skip, int take)
        {
            return await _context.AuditLogs
                .OrderByDescending(a => a.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<int> GetTotalCountAsync()
        {
            return await _context.AuditLogs.CountAsync();
        }

        public async Task<List<AuditLog>> GetByUserIdAsync(Guid userId, int skip, int take)
        {
            return await _context.AuditLogs
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<int> GetCountByUserIdAsync(Guid userId)
        {
            return await _context.AuditLogs.CountAsync(a => a.UserId == userId);
        }
    }
}

