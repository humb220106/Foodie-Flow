using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
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
    public class RoleRepository : IRoleRepository
    {
        private readonly AppDbContext _context;

        public RoleRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task AssignRoleToUserAsync(Guid userId, Guid roleId)
        {
            var ExistingUserRole = await _context.UserRoles.FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId);
            if (ExistingUserRole == null)
            {
                var userRole = new UserRole
                {
                    UserId = userId,
                    RoleId = roleId
                };
                _context.UserRoles.Add(userRole);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<Role>> GetAllAsync()
        {
            return await _context.Roles.ToListAsync();
        }

        public async Task<Role?> GetByNameAsync(string name)
        {
           return await _context.Roles.FirstOrDefaultAsync(r => r.Name == name);
        }

        public async Task<List<string>> GetUserRolesAsync(Guid userId)
        {
            return await _context.UserRoles.Where(ur => ur.UserId == userId)
                 .Include(ur => ur.Role)
                 .Select(ur => ur.Role.Name)
                 .ToListAsync();
        }

        public async Task RemoveRoleFromUserAsync(Guid userId, Guid roleId)
        {
           var userRole = await _context.UserRoles.FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId);
            if (userRole != null)
            {
                _context.UserRoles.Remove(userRole);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> UserHasRoleAsync(Guid userId, string roleName)
        {
            return await _context.UserRoles
              .AnyAsync(ur => ur.UserId == userId && ur.Role.Name == roleName);
        }
    }
}
