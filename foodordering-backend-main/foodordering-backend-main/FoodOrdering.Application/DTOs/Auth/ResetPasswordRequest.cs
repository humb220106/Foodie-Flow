using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Auth
{
   public record ResetPasswordRequest
    {
        [Required(ErrorMessage = "Reset token is required")]
        public string Token { get; init; } = string.Empty;

        [Required(ErrorMessage = "New password is required")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters")]
        public string NewPassword { get; init; } = string.Empty;
    }
}
