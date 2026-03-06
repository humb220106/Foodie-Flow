using FoodOrdering.Core.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FoodOrdering.Core.Enums;

namespace FoodOrdering.Core.Entities
{
    public class User
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public bool EmailVerified { get; set; } = false;
        public string? EmailVerificationToken { get; set; }
        public DateTime? EmailVerificationTokenExpiry { get; set; }
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
        public int FailedLoginAttempts { get; set; } = 0;
        public DateTime? LockoutEnd { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? LastLoginAt { get; set; }
        public string? LastLoginIp { get; set; }

        

        [Required]
        public string? PhoneNumber { get; set; }

        public string? Address { get; set; }

       
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();


        public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
        public ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();

        
        public bool IsLockedOut() => LockoutEnd.HasValue && LockoutEnd.Value > DateTime.UtcNow;
    }
}
