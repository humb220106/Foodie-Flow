using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Order
{
    public class AddOrderReviewRequest
    {
        [Required]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [Required]
        [MinLength(10, ErrorMessage = "Review must be at least 10 characters")]
        [MaxLength(2000, ErrorMessage = "Review must not exceed 2000 characters")]
        public string Review { get; set; } = string.Empty;
    }
}
