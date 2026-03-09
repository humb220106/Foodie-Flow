using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailVerificationAsync(string email, string username, string token);
        Task SendPasswordResetAsync(string email, string username, string token);
        Task SendLoginNotificationAsync(string email, string username, string ipAddress);
    }
}
