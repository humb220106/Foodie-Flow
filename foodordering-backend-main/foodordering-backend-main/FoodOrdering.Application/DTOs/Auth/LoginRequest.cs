using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Auth
{
    public record LoginRequest
    {
        [Required(ErrorMessage = "Username is required")]
        [StringLength(50, ErrorMessage = "Username must not exceed 50 characters")]
        public string Username { get; init; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [StringLength(100, ErrorMessage = "Password must not exceed 100 characters")]
        public string Password { get; init; } = string.Empty;

        public string? IpAddress { get; init; }
        public string? UserAgent { get; init; }
        public string? FcmToken { get; set; }
       
    }
}
