using FoodOrdering.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Repositories
{
    public interface ICategoryRepository
    {
        Task<Category?> GetByIdAsync(Guid id);
        Task<Category?> GetBySlugAsync(string slug);
        Task<List<Category>> GetAllAsync();
        Task<List<Category>> GetRootCategoriesAsync();
        Task<List<Category>> GetSubCategoriesAsync(Guid parentId);
        Task<Category> CreateAsync(Category category);
        Task UpdateAsync(Category category);
        Task DeleteAsync(Guid id);
        Task<bool> IsSlugUniqueAsync(string slug, Guid? excludeCategoryId = null);
    }
}
