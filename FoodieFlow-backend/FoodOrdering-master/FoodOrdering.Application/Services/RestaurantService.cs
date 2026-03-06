using FoodOrdering.Application.DTOs.Restaurant;
using FoodOrdering.Application.Interfaces;
using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using FoodOrdering.Core.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Services
{
    public class RestaurantService : IRestaurantService
    {
        private readonly IRestaurantRepository _restaurantRepository;
        private readonly IAuthRepository _authRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<RestaurantService> _logger;

        public RestaurantService(
            IRestaurantRepository restaurantRepository,
            IAuthRepository authRepository,
            IAuditLogRepository auditLogRepository,
            IFileStorageService fileStorageService,
            ILogger<RestaurantService> logger)
        {
            _restaurantRepository = restaurantRepository;
            _authRepository = authRepository;
            _auditLogRepository = auditLogRepository;
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        public async Task<Restaurant> CreateRestaurantAsync(Guid userId, CreateRestaurantRequest request)
        {



            var restaurant  = await _restaurantRepository.GetByUserIdAsync(userId);
            if (restaurant != null)
                throw new InvalidOperationException("User already has a restaurant");
            var user = await _authRepository.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("User not found");

            var userrole=await _authRepository.GetUserRolesAsync(userId);
            if(!userrole.Contains("Restaurant"))
                throw new InvalidOperationException("User does not have permission to create a restaurant");

          

            var slug = GenerateSlug(request.RestaurantName);
            slug = await EnsureUniqueSlugAsync(slug);

            string? restaurantUrl = null;
            if (request.RestaurantLogo != null)
            {
                restaurantUrl = await _fileStorageService.UploadImageAsync(request.RestaurantLogo, "restaurants/logos");
            }

            // Upload store banner if provided
            string? bannerUrl = null;
            if (request.RestaurantBanner != null)
            {
                bannerUrl = await _fileStorageService.UploadImageAsync(request.RestaurantBanner, "restaurants/banners");
            }

            var newRestaurant = new Restaurant
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                RestaurantName = request.RestaurantName,
                RestaurantDescription = request.RestaurantDescription,
                RestaurantSlug = slug,
                RestaurantLogo = restaurantUrl,
                RestaurantBanner = bannerUrl,
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                City = request.City,
                State = request.State,
                Country = request.Country,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await _restaurantRepository.CreateAsync(newRestaurant);
            await LogAuditAsync(userId, "Vendor Store Created", $"Store: {request.RestaurantName}", "System", true);

            _logger.LogInformation("Vendor store created for user {UserId}: {StoreName}", userId, request.RestaurantName);

            return newRestaurant;

        }

        public async Task<Restaurant> GetRestaurantByIdAsync(Guid id)
        {
            var restaurant = await _restaurantRepository.GetByIdAsync(id);
            if (restaurant == null)
                throw new InvalidOperationException("Restaurant not found");
            return restaurant;
        }

        public async Task<Restaurant?> GetRestaurantByUserIdAsync(Guid userId)
        {
           var restaurant = await _restaurantRepository.GetByUserIdAsync(userId);
            if (restaurant == null)
                throw new InvalidOperationException("User has no Restaurant");
            return restaurant;
        }

        public async Task<Restaurant> GetRestaurantBySlugAsync(string slug)
        {
          var restaurant = await _restaurantRepository.GetBySlugAsync(slug);
            if (restaurant == null)
                throw new InvalidOperationException("Restaurant not found");
            return restaurant;
        }

        public async Task<Restaurant> UpdateRestaurantAsync(Guid restaurantId, Guid userId, UpdateRestaurantRequest request)
        {
            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId);
            if (restaurant == null)
            {
                throw new InvalidOperationException("Restaurant not found");
            }

            if (restaurant.UserId != userId)
            {
                throw new UnauthorizedAccessException("You don't have permission to update this restaurant");
            }

           
                // Update store name and slug
                if (!string.IsNullOrWhiteSpace(request.RestaurantName))
                {
                    restaurant.RestaurantName = request.RestaurantName;

                    var newSlug = GenerateSlug(request.RestaurantName);
                    var uniqueSlug = await EnsureUniqueSlugAsync(newSlug, restaurant.Id);
                    restaurant.RestaurantSlug = uniqueSlug;
                }

                if (!string.IsNullOrWhiteSpace(request.RestaurantDescription))
                {
                    restaurant.RestaurantDescription = request.RestaurantDescription;
                }

                // Handle store logo upload
                if (request.RestaurantLogo != null)
                {
                    // Delete old logo if exists
                    if (!string.IsNullOrEmpty(restaurant.RestaurantLogo))
                    {
                        await _fileStorageService.DeleteImageAsync(restaurant.RestaurantLogo);
                    }

                    // Upload new logo
                    restaurant.RestaurantLogo = await _fileStorageService.UploadImageAsync(request.RestaurantLogo, "restaurants/logos");
                }

                // Handle store banner upload
                if (request.RestaurantBanner != null)
                {
                    // Delete old banner if exists
                    if (!string.IsNullOrEmpty(restaurant.RestaurantBanner))
                    {
                        await _fileStorageService.DeleteImageAsync(restaurant.RestaurantBanner);
                    }

                    // Upload new banner
                    restaurant.RestaurantBanner = await _fileStorageService.UploadImageAsync(request.RestaurantBanner, "restaurants/banners");
                }

                // Update other fields
                if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
                {
                    restaurant.PhoneNumber = request.PhoneNumber;
                }

                if (!string.IsNullOrWhiteSpace(request.Address))
                {
                    restaurant.Address = request.Address;
                }

                if (!string.IsNullOrWhiteSpace(request.City))
                {
                    restaurant.City = request.City;
                }

                if (!string.IsNullOrWhiteSpace(request.State))
                {
                    restaurant.State = request.State;
                }

                if (!string.IsNullOrWhiteSpace(request.Country))
                {
                    restaurant.Country = request.Country;
                }
            

            await _restaurantRepository.UpdateAsync(restaurant);
            await LogAuditAsync(userId, "Vendor Store Updated", $"Restaurant: {restaurantId}", "System", true);

            return restaurant;
        }

        public async Task<List<Restaurant>> SearchRestaurantsAsync(string searchTerm, int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            return await _restaurantRepository.SearchRestaurantAsync(searchTerm, skip, pageSize);
        }

        private string GenerateSlug(string storeName)
        {
            var slug = storeName.ToLowerInvariant();
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug, @"\s+", "-");
            slug = Regex.Replace(slug, @"-+", "-");
            return slug.Trim('-');
        }

        private async Task<string> EnsureUniqueSlugAsync(string slug, Guid? currentVendorId = null)
        {
            var uniqueSlug = slug;
            var counter = 1;

            while (!await _restaurantRepository.IsSlugUniqueAsync(uniqueSlug))
            {
                uniqueSlug = $"{slug}-{counter}";
                counter++;
            }

            return uniqueSlug;
        }
        private async Task LogAuditAsync(Guid userId, string action, string details, string ipAddress, bool isSuccess)
        {
            var auditLog = new AuditLog
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
