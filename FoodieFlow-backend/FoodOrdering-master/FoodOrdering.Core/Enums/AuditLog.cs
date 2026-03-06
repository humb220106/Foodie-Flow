using FoodOrdering.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Core.Enums
{
    public class AuditLog
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public User? User { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string? UserAgent { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsSuccess { get; set; }
    }
}
