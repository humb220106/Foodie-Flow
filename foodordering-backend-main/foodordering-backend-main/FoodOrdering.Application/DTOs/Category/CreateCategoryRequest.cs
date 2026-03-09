


using Microsoft.AspNetCore.Http;

namespace FoodOrdering.Application.DTOs.Category
{
    public class CreateCategoryRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid? ParentCategoryId { get; set; }

        /// <summary>
        /// For cuisine categories: an uploaded image file (sent as multipart/form-data).
        /// For food types: leave null and pass the emoji via Icon instead.
        /// </summary>
        public IFormFile? IconFile { get; set; }

        /// <summary>
        /// For food types: the emoji string (e.g. "🌿").
        /// For cuisine categories: leave null and use IconFile.
        /// If IconFile is provided this field is ignored.
        /// </summary>
        public string? Icon { get; set; }
    }
}