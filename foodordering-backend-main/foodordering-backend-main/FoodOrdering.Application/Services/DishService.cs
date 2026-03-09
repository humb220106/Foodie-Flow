using FoodOrdering.Application.DTOs.Dish;
using FoodOrdering.Application.Interfaces;
using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using FoodOrdering.Core.Enums;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Services
{
    public class DishService : IDishService
    {
        private readonly IDishRepository _dishRepository;
        private readonly IRestaurantRepository _restaurantRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<DishService> _logger;

        public DishService(
            IDishRepository dishRepository,
            IRestaurantRepository restaurantRepository,
            ICategoryRepository categoryRepository,
            IAuditLogRepository auditLogRepository,
            IFileStorageService fileStorageService,
            ILogger<DishService> logger)
        {
            _dishRepository = dishRepository;
            _restaurantRepository = restaurantRepository;
            _categoryRepository = categoryRepository;
            _fileStorageService = fileStorageService;
            _auditLogRepository = auditLogRepository;
            _logger = logger;
        }

        public async Task<Dish> CreateDishAsync(Guid RestaurantId, CreateDishRequest request)
        {
            var restaurant = await _restaurantRepository.GetByIdAsync(RestaurantId);
            if (restaurant == null)
            {
                throw new InvalidOperationException("Restaurant not found.");
            }

            var category = await _categoryRepository.GetByIdAsync(request.CategoryId);
            if (category == null)
            {
                throw new InvalidOperationException("Category not found.");
            }

            string? primaryImageUrl = null;
            if (request.PrimaryImage != null)
            {
                primaryImageUrl = await _fileStorageService.UploadImageAsync(request.PrimaryImage, "products");
            }

            List<string>? additionalImageUrls = null;
            if (request.Images != null && request.Images.Any())
            {
                additionalImageUrls = await _fileStorageService.UploadImagesAsync(request.Images, "products");
            }

            var slug = GenerateSlug(request.Title);
            var uniqueSlug = await EnsureUniqueSlugAsync(slug);

            var dish = new Dish
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Description = request.Description,
                Price = request.Price,
                PrimaryImage = primaryImageUrl,
                Images = additionalImageUrls != null ? System.Text.Json.JsonSerializer.Serialize(additionalImageUrls) : null,
                RestaurantId = RestaurantId,
                CategoryId = request.CategoryId,
                VideoUrl = request.Video != null ? await _fileStorageService.UploadImageAsync(request.Video, "products/videos") : null,
                Slug = uniqueSlug,
                Tags = request.Tags,
                IsActive = true,
                IsAvailable = true,
                CreatedAt = DateTime.UtcNow
            };

            if (restaurant != null)
            {
                restaurant.TotalListings++;
                await _restaurantRepository.UpdateAsync(restaurant);
            }

            var createdDish = await _dishRepository.CreateAsync(dish);
            await LogAuditAsync(restaurant.UserId, "Dish Created", $"Product: {request.Title}", "System", true);
            _logger.LogInformation("Created new dish {DishName} with ID {DishId} for restaurant {RestaurantId}", createdDish.Title, createdDish.Id, RestaurantId);

            return createdDish;
        }

        public async Task<Dish> GetDishByIdAsync(Guid id)
        {
            var dish = await _dishRepository.GetByIdAsync(id);
            if (dish == null)
            {
                throw new InvalidOperationException("Dish not found.");
            }

            return dish;
        }

        public async Task<Dish> GetDishBySlugAsync(string slug)
        {
            var dish = await _dishRepository.GetBySlugAsync(slug);
            if (dish == null)
            {
                throw new InvalidOperationException("Dish not found.");
            }

            return dish;
        }

        public async Task<List<Dish>> GetRestaurantDishesAsync(Guid restaurantId, int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var dishes = await _dishRepository.GetByRestaurantIdAsync(restaurantId, skip, pageSize);

            return dishes;
        }

        public async Task<Dish> UpdateDishAsync(Guid dishId, Guid restaurantId, UpdateDishRequest request)
        {
            var dish = await _dishRepository.GetByIdAsync(dishId);
            if (dish == null)
            {
                throw new InvalidOperationException("Dish not found.");
            }

            if (dish.RestaurantId != restaurantId)
            {
                throw new UnauthorizedAccessException("You don't have permission to update this dish.");
            }

            // Update title and slug if changed
            if (!string.IsNullOrWhiteSpace(request.Title) && request.Title != dish.Title)
            {
                dish.Title = request.Title;
                var newSlug = GenerateSlug(request.Title);
                var uniqueSlug = await EnsureUniqueSlugAsync(newSlug, dish.Id);
                dish.Slug = uniqueSlug;
            }

            // Update description
            if (!string.IsNullOrWhiteSpace(request.Description))
            {
                dish.Description = request.Description;
            }

            // Update short description
            if (!string.IsNullOrWhiteSpace(request.ShortDescription))
            {
                dish.ShortDescription = request.ShortDescription;
            }

            // Update price
            if (request.Price > 0)
            {
                dish.Price = request.Price;
            }

            // Update preparation time
            if (request.preparationTimeInMinutes > 0)
            {
                dish.PreparationTimeMinutes = request.preparationTimeInMinutes;
            }

            // Update category
            if (request.CategoryId != Guid.Empty && request.CategoryId != dish.CategoryId)
            {
                var category = await _categoryRepository.GetByIdAsync(request.CategoryId);
                if (category == null)
                {
                    throw new InvalidOperationException("Category not found.");
                }
                dish.CategoryId = request.CategoryId;
            }

            // Handle primary image upload
            if (request.PrimaryImage != null)
            {
                // Delete old primary image if exists
                if (!string.IsNullOrEmpty(dish.PrimaryImage))
                {
                    await _fileStorageService.DeleteImageAsync(dish.PrimaryImage);
                }

                // Upload new primary image
                dish.PrimaryImage = await _fileStorageService.UploadImageAsync(request.PrimaryImage, "products");
            }

            // Handle additional images upload
            if (request.Images != null && request.Images.Any())
            {
                // Delete old additional images if exist
                if (!string.IsNullOrEmpty(dish.Images))
                {
                    var oldImages = System.Text.Json.JsonSerializer.Deserialize<List<string>>(dish.Images);
                    if (oldImages != null)
                    {
                        foreach (var imageUrl in oldImages)
                        {
                            await _fileStorageService.DeleteImageAsync(imageUrl);
                        }
                    }
                }

                // Upload new additional images
                var newImageUrls = await _fileStorageService.UploadImagesAsync(request.Images, "products");
                dish.Images = System.Text.Json.JsonSerializer.Serialize(newImageUrls);
            }

            // Handle video upload
            if (request.Video != null)
            {
                // Delete old video if exists
                if (!string.IsNullOrEmpty(dish.VideoUrl))
                {
                    await _fileStorageService.DeleteVideoAsync(dish.VideoUrl);
                }

                // Upload new video
                dish.VideoUrl = await _fileStorageService.UploadVideoAsync(request.Video, "products/videos");
            }

            // Update tags
            if (!string.IsNullOrWhiteSpace(request.Tags))
            {
                dish.Tags = request.Tags;
            }

            // Update availability
            dish.IsAvailable = request.isAvailable;

            await _dishRepository.UpdateAsync(dish);

            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId);
            await LogAuditAsync(restaurant.UserId, "Dish Updated", $"Product: {dish.Title} (ID: {dishId})", "System", true);

            _logger.LogInformation("Updated dish {DishId} for restaurant {RestaurantId}", dishId, restaurantId);

            return dish;
        }

        public async Task DeleteDishAsync(Guid dishId, Guid restaurantId)
        {
            var dish = await _dishRepository.GetByIdAsync(dishId);
            if (dish == null)
            {
                throw new InvalidOperationException("Dish not found.");
            }

            if (dish.RestaurantId != restaurantId)
            {
                throw new UnauthorizedAccessException("You don't have permission to delete this dish.");
            }

            // Delete images from storage
            if (!string.IsNullOrEmpty(dish.PrimaryImage))
            {
                await _fileStorageService.DeleteImageAsync(dish.PrimaryImage);
            }

            if (!string.IsNullOrEmpty(dish.Images))
            {
                var imageUrls = System.Text.Json.JsonSerializer.Deserialize<List<string>>(dish.Images);
                if (imageUrls != null)
                {
                    foreach (var imageUrl in imageUrls)
                    {
                        await _fileStorageService.DeleteImageAsync(imageUrl);
                    }
                }
            }

            // Soft delete: Set IsActive to false instead of hard delete
            dish.IsActive = false;
            dish.UpdatedAt = DateTime.UtcNow;
            await _dishRepository.UpdateAsync(dish);

            // Update restaurant listing count
            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId);
            if (restaurant != null)
            {
                restaurant.TotalListings = Math.Max(0, restaurant.TotalListings - 1);
                await _restaurantRepository.UpdateAsync(restaurant);
            }

            await LogAuditAsync(restaurant.UserId, "Dish Deleted", $"Product: {dish.Title} (ID: {dishId})", "System", true);

            _logger.LogInformation("Deleted dish {DishId} from restaurant {RestaurantId}", dishId, restaurantId);
        }

        public async Task<List<Dish>> SearchDishesAsync(string searchTerm, Guid? categoryId = null, decimal? minPrice = null, decimal? maxPrice = null, int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var dishes = await _dishRepository.SearchAsync(searchTerm, categoryId, minPrice, maxPrice, skip, pageSize);

            return dishes;
        }

        public async Task IncrementDishViewAsync(Guid dishId)
        {
            try
            {
                await _dishRepository.IncrementViewCountAsync(dishId);
                _logger.LogInformation("Incremented view count for dish {DishId}", dishId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error incrementing view count for dish {DishId}", dishId);
                // Don't throw - view count is not critical
            }
        }

        private string GenerateSlug(string title)
        {
            var slug = title.ToLowerInvariant();
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug, @"\s+", "-");
            slug = Regex.Replace(slug, @"-+", "-");
            return slug.Trim('-');
        }

        private async Task<string> EnsureUniqueSlugAsync(string slug)
        {
            var uniqueSlug = slug;
            var counter = 1;

            while (!await _dishRepository.IsSlugUniqueAsync(uniqueSlug))
            {
                uniqueSlug = $"{slug}-{counter}";
                counter++;
            }

            return uniqueSlug;
        }

        private async Task<string> EnsureUniqueSlugAsync(string slug, Guid excludeProductId)
        {
            var uniqueSlug = slug;
            var counter = 1;

            while (!await _dishRepository.IsSlugUniqueAsync(uniqueSlug, excludeProductId))
            {
                uniqueSlug = $"{slug}-{counter}";
                counter++;
            }

            return uniqueSlug;
        }

        private async Task LogAuditAsync(Guid userId, string action, string details, string ipAddress, bool isSuccess)
        {
            var auditLog = new Core.Entities.AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                Details = details,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow,
                IsSuccess = isSuccess
            };

            await _auditLogRepository.CreateAsync(auditLog);
        }
    }
}