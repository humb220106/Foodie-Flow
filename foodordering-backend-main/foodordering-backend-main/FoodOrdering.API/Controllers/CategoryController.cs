


using FoodOrdering.Application.DTOs.Category;
using FoodOrdering.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodOrdering.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;
        private readonly ILogger<CategoryController> _logger;

        public CategoryController(ICategoryService categoryService, ILogger<CategoryController> logger)
        {
            _categoryService = categoryService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<CategoryResponse>>> GetAllCategories()
        {
            var categories = await _categoryService.GetAllCategoriesAsync();

            var response = categories.Select(c => new CategoryResponse(
                c.Id, c.Name, c.Slug, c.Description, c.Icon,
                c.ParentCategoryId, c.Dishes?.Count ?? 0, c.CreatedAt
            )).ToList();

            return Ok(response);
        }

        [HttpGet("root")]
        public async Task<ActionResult<List<CategoryResponse>>> GetRootCategories()
        {
            var categories = await _categoryService.GetRootCategoriesAsync();

            var response = categories.Select(c => new CategoryResponse(
                c.Id, c.Name, c.Slug, c.Description, c.Icon,
                c.ParentCategoryId, c.Dishes?.Count ?? 0, c.CreatedAt
            )).ToList();

            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryResponse>> GetCategoryById(Guid id)
        {
            try
            {
                var category = await _categoryService.GetCategoryByIdAsync(id);

                var response = new CategoryResponse(
                    category.Id, category.Name, category.Slug, category.Description,
                    category.Icon, category.ParentCategoryId, category.Dishes?.Count ?? 0, category.CreatedAt
                );

                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Create a category. Accepts multipart/form-data.
        /// - Cuisine categories: send IconFile (image) — uploaded to cloud storage.
        /// - Food types: send Icon (emoji string) — stored as plain text.
        /// </summary>
        [Authorize(Policy = "AdminOnly")]
        [HttpPost]
        public async Task<ActionResult<CategoryResponse>> CreateCategory([FromForm] CreateCategoryRequest request)
        {
            try
            {
                var category = await _categoryService.CreateCategoryAsync(request);

                var response = new CategoryResponse(
                    category.Id, category.Name, category.Slug, category.Description,
                    category.Icon, category.ParentCategoryId, 0, category.CreatedAt
                );

                return CreatedAtAction(nameof(GetCategoryById), new { id = category.Id }, response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update a category. Accepts multipart/form-data — same rules as CreateCategory.
        /// If IconFile is provided the old cloud image is deleted and replaced.
        /// </summary>
        [Authorize(Policy = "AdminOnly")]
        [HttpPut("{id}")]
        public async Task<ActionResult<CategoryResponse>> UpdateCategory(Guid id, [FromForm] CreateCategoryRequest request)
        {
            try
            {
                var category = await _categoryService.UpdateCategoryAsync(id, request);

                var response = new CategoryResponse(
                    category.Id, category.Name, category.Slug, category.Description,
                    category.Icon, category.ParentCategoryId, category.Dishes?.Count ?? 0, category.CreatedAt
                );

                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCategory(Guid id)
        {
            try
            {
                await _categoryService.DeleteCategoryAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
