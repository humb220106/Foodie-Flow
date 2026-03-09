using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Dish
{
    public record UpdateDishRequest(
   string Title,
   string Description,
   decimal Price,
  bool isAvailable,
   Guid CategoryId,
   string? ShortDescription = null,
   string? Tags = null,
   int preparationTimeInMinutes = 0,
   IFormFile? PrimaryImage = null,
   List<IFormFile>? Images = null,
   IFormFile? Video = null
);
}
