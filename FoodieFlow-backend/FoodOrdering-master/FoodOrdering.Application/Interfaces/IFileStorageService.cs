using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Interfaces
{
    public interface IFileStorageService
    {

        Task<string> UploadImageAsync(IFormFile file, string folder);

        Task<bool> DeleteVideoAsync(string videoUrl);
        Task<string> UploadVideoAsync(IFormFile file, string folder);
        Task<List<string>> UploadImagesAsync(List<IFormFile> files, string folder);


        Task<bool> DeleteImageAsync(string imageUrl);


        Task<bool> DeleteImagesAsync(List<string> imageUrls);
    }
}
