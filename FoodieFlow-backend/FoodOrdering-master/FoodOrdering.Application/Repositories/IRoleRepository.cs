using FoodOrdering.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Repositories
{
    public interface IRoleRepository
    {
        Task<Role?> GetByNameAsync(string name);
        Task<List<Role>> GetAllAsync();
        Task<List<string>> GetUserRolesAsync(Guid userId);
        Task AssignRoleToUserAsync(Guid userId, Guid roleId);
        Task RemoveRoleFromUserAsync(Guid userId, Guid roleId);
        Task<bool> UserHasRoleAsync(Guid userId, string roleName);
    }
}
