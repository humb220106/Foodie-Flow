using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Category
{
    public record CreateCategoryRequest(
   string Name,
   string? Description = null,
   Guid? ParentCategoryId = null,
   string? Icon = null
);
}
