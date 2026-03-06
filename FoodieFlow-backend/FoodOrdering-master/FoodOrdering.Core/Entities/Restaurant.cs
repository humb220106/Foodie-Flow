using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Core.Entities
{
    public class Restaurant
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

       
        public string RestaurantName { get; set; } = string.Empty;
        public string? RestaurantSlug { get; set; } = string.Empty;
        public string? RestaurantDescription { get; set; }
        public string? RestaurantLogo { get; set; } 
        public string? RestaurantBanner { get; set; } 

        // Verification
        public bool IsVerified { get; set; } = false;
        public DateTime? VerifiedAt { get; set; }
        public Guid? VerifiedBy { get; set; } // Admin who verified
        public string? VerificationNotes { get; set; }

        // Business Details
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; }
        public string? PostalCode { get; set; }

        // Statistics
        public int TotalListings { get; set; } = 0;
        public int TotalSales { get; set; } = 0;
        public decimal TotalRevenue { get; set; } = 0;
        public decimal AverageRating { get; set; } = 0;
        public int ReviewCount { get; set; } = 0;
        public int TotalReviews { get; set; } = 0;

        // Status
        public bool IsActive { get; set; } = true;
        public bool IsSuspended { get; set; } = false;
        public string? SuspensionReason { get; set; }
        public DateTime? SuspendedAt { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public ICollection<Dish> Dishes { get; set; } = new List<Dish>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
