using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Restaurant
{
    public record UpdateRestaurantRequest(
      string RestaurantName,
      string RestaurantDescription,
      string? PhoneNumber = null,
      string? Address = null,
      string? City = null,
      string? State = null,
      string? Country = null,
      IFormFile? RestaurantLogo = null,
     IFormFile? RestaurantBanner = null
  );
}
