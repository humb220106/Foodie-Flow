using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using FoodOrdering.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FoodOrdering.Infrastructure.Services
{
    public class FileStorageService : IFileStorageService
    {
        private readonly Cloudinary _cloudinary;
        private readonly ILogger<FileStorageService> _logger;

        private readonly string[] _allowedImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        private readonly string[] _allowedVideoExtensions = { ".mp4", ".mov", ".avi", ".mkv", ".webm" };
        private readonly string[] _allowedImageMimeTypes = { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
        private readonly string[] _allowedVideoMimeTypes = { "video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm" };

        private const long MaxImageSize = 5 * 1024 * 1024;   // 5MB
        private const long MaxVideoSize = 100 * 1024 * 1024; // 100MB

        public FileStorageService(IOptions<CloudinarySettings> config, ILogger<FileStorageService> logger)
        {
            var settings = config.Value;
            if (string.IsNullOrEmpty(settings.CloudName) ||
        string.IsNullOrEmpty(settings.ApiKey) ||
        string.IsNullOrEmpty(settings.ApiSecret))
            {
                throw new InvalidOperationException(
                    "Cloudinary configuration is incomplete. Ensure 'Cloudinary:CloudName', " +
                    "'Cloudinary:ApiKey', and 'Cloudinary:ApiSecret' are set in appsettings.json.");
            }

            var account = new Account(settings.CloudName, settings.ApiKey, settings.ApiSecret);
            _cloudinary = new Cloudinary(account);
            _cloudinary.Api.Secure = true;
            _logger = logger;
        }

        public async Task<string> UploadImageAsync(IFormFile file, string folder)
        {
            ValidateFile(file, _allowedImageExtensions, _allowedImageMimeTypes, MaxImageSize, "image");

            using var stream = file.OpenReadStream();

            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = folder,
                Transformation = new Transformation()
                    .Width(1920).Height(1920).Crop("limit")
                    .Quality("auto").FetchFormat("auto"),
                UseFilename = false,
                UniqueFilename = true,
                Overwrite = false
            };

            var result = await _cloudinary.UploadAsync(uploadParams);

            if (result.Error != null)
            {
                _logger.LogError("Cloudinary image upload error: {Error}", result.Error.Message);
                throw new InvalidOperationException($"Image upload failed: {result.Error.Message}");
            }

            _logger.LogInformation("Image uploaded to Cloudinary: {PublicId}", result.PublicId);
            return result.SecureUrl.ToString();
        }

        public async Task<List<string>> UploadImagesAsync(List<IFormFile> files, string folder)
        {
            var uploadedUrls = new List<string>();

            foreach (var file in files)
            {
                try
                {
                    var url = await UploadImageAsync(file, folder);
                    uploadedUrls.Add(url);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error uploading image {FileName}", file.FileName);
                   
                }
            }

            return uploadedUrls;
        }

        public async Task<string> UploadVideoAsync(IFormFile file, string folder)
        {
            ValidateFile(file, _allowedVideoExtensions, _allowedVideoMimeTypes, MaxVideoSize, "video");

            using var stream = file.OpenReadStream();

            var uploadParams = new VideoUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = folder,
                Transformation = new Transformation()
                    .Quality("auto"),
                UseFilename = false,
                UniqueFilename = true,
                Overwrite = false
            };

            var result = await _cloudinary.UploadAsync(uploadParams);

            if (result.Error != null)
            {
                _logger.LogError("Cloudinary video upload error: {Error}", result.Error.Message);
                throw new InvalidOperationException($"Video upload failed: {result.Error.Message}");
            }

            _logger.LogInformation("Video uploaded to Cloudinary: {PublicId}", result.PublicId);
            return result.SecureUrl.ToString();
        }

        public async Task<bool> DeleteImageAsync(string imageUrl)
        {
            return await DeleteAssetAsync(imageUrl, ResourceType.Image);
        }

        public async Task<bool> DeleteVideoAsync(string videoUrl)
        {
            return await DeleteAssetAsync(videoUrl, ResourceType.Video);
        }

        public async Task<bool> DeleteImagesAsync(List<string> imageUrls)
        {
            var allDeleted = true;
            foreach (var url in imageUrls)
            {
                if (!await DeleteImageAsync(url)) allDeleted = false;
            }
            return allDeleted;
        }

      

        private async Task<bool> DeleteAssetAsync(string url, ResourceType resourceType)
        {
            try
            {
                if (string.IsNullOrEmpty(url))
                {
                    _logger.LogWarning("Attempted to delete asset with empty URL");
                    return false;
                }

                var publicId = ExtractPublicId(url);
                if (string.IsNullOrEmpty(publicId))
                {
                    _logger.LogWarning("Could not extract public ID from URL: {Url}", url);
                    return false;
                }

                var deleteParams = new DeletionParams(publicId) { ResourceType = resourceType };
                var result = await _cloudinary.DestroyAsync(deleteParams);

                if (result.Result == "ok")
                {
                    _logger.LogInformation("Deleted Cloudinary asset: {PublicId}", publicId);
                    return true;
                }

                _logger.LogWarning("Cloudinary delete returned: {Result} for {PublicId}", result.Result, publicId);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting asset: {Url}", url);
                return false;
            }
        }

        
        private static string ExtractPublicId(string url)
        {
            try
            {
                var uri = new Uri(url);
                var segments = uri.AbsolutePath.Split('/');

                // Find the "upload" segment index
                var uploadIndex = Array.IndexOf(segments, "upload");
                if (uploadIndex < 0 || uploadIndex + 1 >= segments.Length)
                    return string.Empty;

                // Skip the version segment (v1234567) if present
                var startIndex = uploadIndex + 1;
                if (segments[startIndex].StartsWith("v") && long.TryParse(segments[startIndex][1..], out _))
                    startIndex++;

                var publicIdWithExtension = string.Join("/", segments[startIndex..]);
                return Path.ChangeExtension(publicIdWithExtension, null); // strip extension
            }
            catch
            {
                return string.Empty;
            }
        }

        private static void ValidateFile(IFormFile file, string[] allowedExtensions, string[] allowedMimeTypes, long maxSize, string fileType)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException($"{fileType} file is empty.");

            if (file.Length > maxSize)
                throw new ArgumentException($"{fileType} size exceeds the {maxSize / 1024 / 1024}MB limit.");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                throw new ArgumentException($"Invalid {fileType} type. Allowed: {string.Join(", ", allowedExtensions)}");

            if (!allowedMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
                throw new ArgumentException($"Invalid {fileType} MIME type: {file.ContentType}");
        }
    }
}