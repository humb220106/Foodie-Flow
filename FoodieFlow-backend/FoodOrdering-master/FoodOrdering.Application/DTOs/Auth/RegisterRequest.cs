using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Auth
{
    public record RegisterRequest
    {
        [Required(ErrorMessage = "Username is required")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
        [RegularExpression(@"^[a-zA-Z0-9_-]+$", ErrorMessage = "Username can only contain letters, numbers, underscores, and hyphens")]
        public string Username { get; init; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(100, ErrorMessage = "Email must not exceed 100 characters")]
        public string Email { get; init; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters")]
        public string Password { get; init; } = string.Empty;

        [Required(ErrorMessage = "PhoneNumber is required")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters")]
        public string Phone { get; init; } = string.Empty;


        [Required(ErrorMessage = "Role is required")]
        [RegularExpression("^(Customer|Restaurant)$", ErrorMessage = "Role must be either 'Customer' or 'Restaurant'")]
        public string Role { get; init; } = string.Empty;

        public string? IpAddress { get; init; }
    }
}
