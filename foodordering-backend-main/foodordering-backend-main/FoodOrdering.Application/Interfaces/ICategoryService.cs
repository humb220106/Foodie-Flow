

using FoodOrdering.Application.DTOs.Category;
using FoodOrdering.Core.Entities;

namespace FoodOrdering.Application.Interfaces
{
    public interface ICategoryService
    {
        Task<Category> CreateCategoryAsync(CreateCategoryRequest request);
        Task<Category> GetCategoryByIdAsync(Guid id);
        Task<List<Category>> GetAllCategoriesAsync();
        Task<List<Category>> GetRootCategoriesAsync();
        Task<Category> UpdateCategoryAsync(Guid id, CreateCategoryRequest request);
        Task DeleteCategoryAsync(Guid id);
    }
}