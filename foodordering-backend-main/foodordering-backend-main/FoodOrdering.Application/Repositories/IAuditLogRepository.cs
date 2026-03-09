using FoodOrdering.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Repositories
{
    public interface IAuditLogRepository
    {
        Task CreateAsync(AuditLog auditLog);
        Task<List<AuditLog>> GetUserAuditLogsAsync(Guid userId, int take = 50);
        Task<List<AuditLog>> GetAllAsync(int skip, int take);
        Task<int> GetTotalCountAsync();
        Task<List<AuditLog>> GetByUserIdAsync(Guid userId, int skip, int take);
        Task<int> GetCountByUserIdAsync(Guid userId);
    }
}
