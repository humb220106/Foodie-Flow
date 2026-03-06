using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Order
{
    public class CancelOrderRequest
    {
        [Required]
        [MinLength(5, ErrorMessage = "Reason must be at least 5 characters")]
        public string Reason { get; set; } = string.Empty;
    }
}
