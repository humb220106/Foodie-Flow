using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Restaurant
{
    public record CreateRestaurantRequest(
       [Required(ErrorMessage = "Restaurant name is required")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Restaurant name must be between 3 and 100 characters")]
        string RestaurantName,

       [StringLength(500, ErrorMessage = "Description must not exceed 500 characters")]
        string? RestaurantDescription = null,

       [Phone(ErrorMessage = "Invalid phone number format")]
        [StringLength(20, ErrorMessage = "Phone number must not exceed 20 characters")]
        string? PhoneNumber = null,

       [StringLength(200, ErrorMessage = "Address must not exceed 200 characters")]
        string? Address = null,

       [StringLength(100, ErrorMessage = "City must not exceed 100 characters")]
        string? City = null,

       [StringLength(100, ErrorMessage = "State must not exceed 100 characters")]
        string? State = null,

       [StringLength(100, ErrorMessage = "Country must not exceed 100 characters")]
        string? Country = null,

       

       IFormFile? RestaurantLogo = null,

       IFormFile? RestaurantBanner = null
   );
}
