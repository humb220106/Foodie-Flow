using FoodOrdering.Application.DTOs.Category;
using FoodOrdering.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Interfaces
{
    public interface ICategoryService
    {
        Task<Category> CreateCategoryAsync(string name, string? description = null, Guid? parentCategoryId = null);
        Task<Category> GetCategoryByIdAsync(Guid id);
        Task<List<Category>> GetAllCategoriesAsync();
        Task<List<Category>> GetRootCategoriesAsync();
        Task<Category> UpdateCategoryAsync(Guid id, CreateCategoryRequest request);
        Task DeleteCategoryAsync(Guid id);
    }
}
