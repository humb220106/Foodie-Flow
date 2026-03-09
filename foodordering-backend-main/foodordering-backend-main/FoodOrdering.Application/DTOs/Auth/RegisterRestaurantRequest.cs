using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Auth
{
    public record RegisterRestaurantRequest
    {
        [Required(ErrorMessage = "Username is required")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
        [RegularExpression(@"^[a-zA-Z0-9_-]+$", ErrorMessage = "Username can only contain letters, numbers, underscores, and hyphens")]
        public string Username { get; init; } = string.Empty;

        [Required(ErrorMessage = "Restaurant name is required")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Restaurant name must be between 3 and 100 characters")]
        public string RestaurantName { get; init; } = string.Empty;

        public string? RestaurantDescription { get; init; }

        [StringLength(50, ErrorMessage = "Tax ID must not exceed 50 characters")]
        public string? TaxID { get; init; }

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(100, ErrorMessage = "Email must not exceed 100 characters")]
        public string Email { get; init; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters")]
        public string Password { get; init; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required")]
        [StringLength(20, MinimumLength = 8, ErrorMessage = "Phone number must be between 8 and 20 characters")]
        [Phone(ErrorMessage = "Invalid phone number format")]
        public string Phone { get; init; } = string.Empty;

        [StringLength(20, ErrorMessage = "Restaurant phone must not exceed 20 characters")]
        [Phone(ErrorMessage = "Invalid phone number format")]
        public string? RestaurantPhone { get; init; }

        // Location fields
        [StringLength(200, ErrorMessage = "Address must not exceed 200 characters")]
        public string? Address { get; init; }

        [StringLength(100, ErrorMessage = "City must not exceed 100 characters")]
        public string? City { get; init; }

        [StringLength(100, ErrorMessage = "State must not exceed 100 characters")]
        public string? State { get; init; }

        [StringLength(100, ErrorMessage = "Country must not exceed 100 characters")]
        public string? Country { get; init; }

        [StringLength(20, ErrorMessage = "Postal code must not exceed 20 characters")]
        public string? PostalCode { get; init; }

        // Image uploads
        public IFormFile? RestaurantLogo { get; init; }
        public IFormFile? RestaurantBanner { get; init; }

        // Role is always "Restaurant" for this endpoint, but kept for consistency
        public string Role { get; init; } = "Restaurant";

        // Metadata
        public string? IpAddress { get; init; }
    }
}
