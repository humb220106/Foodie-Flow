using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Auth
{
    public record VerifyEmailRequest
    {
        [Required(ErrorMessage = "Verification token is required")]
        public string Token { get; init; } = string.Empty;
    }
}
