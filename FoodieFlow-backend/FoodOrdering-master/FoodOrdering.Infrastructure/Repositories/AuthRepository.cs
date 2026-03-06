using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using FoodOrdering.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Infrastructure.Repositories
{
    public class AuthRepository : IAuthRepository
    {
        private readonly AppDbContext _context;

        public AuthRepository(AppDbContext context)
        {
            _context = context;
        }   
        public async Task<User> CreateAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task DeleteAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
           return await _context.Users.Include(u=> u.UserRoles).ThenInclude(ur => ur.Role).
                 FirstOrDefaultAsync(u => u.Email == email);
                                        
               
        }

        public async Task<User?> GetByEmailVerificationTokenAsync(string token)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
        }

        public async Task<User?> GetByIdAsync(Guid id)
        {
            return await _context.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role).
                  FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<User?> GetByPasswordResetTokenAsync(string token)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.PasswordResetToken == token);    
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            return await _context.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role).
                  FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<List<string>> GetUserRolesAsync(Guid userId)
        {
            return await _context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Select(ur => ur.Role.Name)
                .ToListAsync();
        }

        public async Task UpdateAsync(User user)
        {
            user.UpdatedAt = DateTime.UtcNow;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }
        public async Task<List<User>> GetAllAsync(int skip, int take)
        {
            return await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .OrderByDescending(u => u.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<int> GetTotalCountAsync()
        {
            return await _context.Users.CountAsync();
        }
    }
}
