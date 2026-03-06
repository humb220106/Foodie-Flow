using FoodOrdering.Application.DTOs.Category;
using FoodOrdering.Application.Interfaces;
using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;
        private readonly ILogger<CategoryService> _logger;

        public CategoryService(
            ICategoryRepository categoryRepository,
            ILogger<CategoryService> logger)
        {
            _categoryRepository = categoryRepository;
            _logger = logger;
        }
        public async Task<Category> CreateCategoryAsync(string name, string? description = null, Guid? parentCategoryId = null)
        {
            var slug = GenerateSlug(name);
            var uniqueSlug = await EnsureUniqueSlugAsync(slug);

            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = name,
                Slug = uniqueSlug,
                Description = description,
                ParentCategoryId = parentCategoryId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _categoryRepository.CreateAsync(category);
            _logger.LogInformation("Category created: {CategoryName}", name);

            return category;
        }

        public async Task DeleteCategoryAsync(Guid id)
        {
            await _categoryRepository.DeleteAsync(id);
            _logger.LogInformation("Category deleted: {CategoryId}", id);
        }

        public async Task<List<Category>> GetAllCategoriesAsync()
        {
            return await _categoryRepository.GetAllAsync();
        }

        public async Task<Category> GetCategoryByIdAsync(Guid id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
            {
                throw new InvalidOperationException("Category not found");
            }
            return category;
        }

        public async Task<List<Category>> GetRootCategoriesAsync()
        {
            return await _categoryRepository.GetRootCategoriesAsync();
        }

        public async Task<Category> UpdateCategoryAsync(Guid id, CreateCategoryRequest request)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
            {
                throw new InvalidOperationException("Category not found");
            }


            
                if (!string.IsNullOrWhiteSpace(request.Name))
                {
                    category.Name = request.Name;


                    var newSlug = GenerateSlug(request.Name);
                    var uniqueSlug = await EnsureUniqueSlugAsync(newSlug, category.Id);
                    category.Slug = uniqueSlug;
                }

                if (request.Description != null)
                {
                    category.Description = request.Description;
                }

                if (request.Icon != null)
                {
                    category.Icon = request.Icon;
                }

                if (request.ParentCategoryId.HasValue)
                {

                    var parentCategory = await _categoryRepository.GetByIdAsync(request.ParentCategoryId.Value);
                    if (parentCategory != null)
                    {
                        category.ParentCategoryId = request.ParentCategoryId.Value;
                    }
                }
            

            await _categoryRepository.UpdateAsync(category);
            return category;
        }
        private string GenerateSlug(string name)
        {
            var slug = name.ToLowerInvariant();
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug, @"\s+", "-");
            slug = Regex.Replace(slug, @"-+", "-");
            return slug.Trim('-');
        }

        private async Task<string> EnsureUniqueSlugAsync(string slug)
        {
            var uniqueSlug = slug;
            var counter = 1;

            while (!await _categoryRepository.IsSlugUniqueAsync(uniqueSlug))
            {
                uniqueSlug = $"{slug}-{counter}";
                counter++;
            }

            return uniqueSlug;
        }

        private async Task<string> EnsureUniqueSlugAsync(string slug, Guid excludeCategoryId)
        {
            var uniqueSlug = slug;
            var counter = 1;

            while (!await _categoryRepository.IsSlugUniqueAsync(uniqueSlug, excludeCategoryId))
            {
                uniqueSlug = $"{slug}-{counter}";
                counter++;
            }

            return uniqueSlug;
        }
    }
}
