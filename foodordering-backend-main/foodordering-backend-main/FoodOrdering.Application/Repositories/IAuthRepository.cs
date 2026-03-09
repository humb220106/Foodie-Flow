using FoodOrdering.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Repositories
{
     public interface IAuthRepository
    {
        Task<User?> GetByUsernameAsync(string username);
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByIdAsync(Guid id);
        Task<User?> GetByEmailVerificationTokenAsync(string token);
        Task<User?> GetByPasswordResetTokenAsync(string token);
        Task<User> CreateAsync(User user);
        Task UpdateAsync(User user);
        Task<List<string>> GetUserRolesAsync(Guid userId);
        Task DeleteAsync(Guid userId);
        Task<List<User>> GetAllAsync(int skip, int take);
        Task<int> GetTotalCountAsync();
    }
}
