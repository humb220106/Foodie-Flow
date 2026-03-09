
using FoodOrdering.Application.DTOs.Category;
using FoodOrdering.Application.Interfaces;
using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace FoodOrdering.Application.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<CategoryService> _logger;

        public CategoryService(
            ICategoryRepository categoryRepository,
            IFileStorageService fileStorageService,
            ILogger<CategoryService> logger)
        {
            _categoryRepository = categoryRepository;
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        public async Task<Category> CreateCategoryAsync(CreateCategoryRequest request)
        {
            var slug = GenerateSlug(request.Name);
            var uniqueSlug = await EnsureUniqueSlugAsync(slug);

            // Upload image if provided (cuisine categories), otherwise store emoji string (food types)
            string? iconValue = null;
            if (request.IconFile != null)
            {
                iconValue = await _fileStorageService.UploadImageAsync(request.IconFile, "categories");
            }
            else if (!string.IsNullOrWhiteSpace(request.Icon))
            {
                iconValue = request.Icon;
            }

            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Slug = uniqueSlug,
                Description = request.Description,
                Icon = iconValue,
                ParentCategoryId = request.ParentCategoryId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _categoryRepository.CreateAsync(category);
            _logger.LogInformation("Category created: {CategoryName}", request.Name);

            return category;
        }

        public async Task<Category> UpdateCategoryAsync(Guid id, CreateCategoryRequest request)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                throw new InvalidOperationException("Category not found");

            // Update name + slug if changed
            if (!string.IsNullOrWhiteSpace(request.Name) && request.Name != category.Name)
            {
                category.Name = request.Name;
                var newSlug = GenerateSlug(request.Name);
                category.Slug = await EnsureUniqueSlugAsync(newSlug, category.Id);
            }

            if (request.Description != null)
                category.Description = request.Description;

            // Image upload: new file takes priority over emoji string
            if (request.IconFile != null)
            {
                // Delete old image from cloud if it was a URL (not an emoji)
                if (!string.IsNullOrEmpty(category.Icon) && category.Icon.StartsWith("http"))
                    await _fileStorageService.DeleteImageAsync(category.Icon);

                category.Icon = await _fileStorageService.UploadImageAsync(request.IconFile, "categories");
            }
            else if (!string.IsNullOrWhiteSpace(request.Icon))
            {
                // Food type emoji update — no file storage needed
                category.Icon = request.Icon;
            }

            if (request.ParentCategoryId.HasValue)
            {
                var parentExists = await _categoryRepository.GetByIdAsync(request.ParentCategoryId.Value);
                if (parentExists != null)
                    category.ParentCategoryId = request.ParentCategoryId.Value;
            }

            await _categoryRepository.UpdateAsync(category);
            _logger.LogInformation("Category updated: {CategoryId}", id);

            return category;
        }

        public async Task DeleteCategoryAsync(Guid id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category != null && !string.IsNullOrEmpty(category.Icon) && category.Icon.StartsWith("http"))
            {
                // Clean up cloud image on delete
                await _fileStorageService.DeleteImageAsync(category.Icon);
            }

            await _categoryRepository.DeleteAsync(id);
            _logger.LogInformation("Category deleted: {CategoryId}", id);
        }

        public async Task<List<Category>> GetAllCategoriesAsync()
            => await _categoryRepository.GetAllAsync();

        public async Task<Category> GetCategoryByIdAsync(Guid id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                throw new InvalidOperationException("Category not found");
            return category;
        }

        public async Task<List<Category>> GetRootCategoriesAsync()
            => await _categoryRepository.GetRootCategoriesAsync();

        // ── Slug helpers ──────────────────────────────────────────────────────────

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