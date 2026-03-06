using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Auth
{
    public record UserSessionResponse(
    Guid Id,
    string IpAddress,
    string? UserAgent,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    bool IsCurrentSession
);
}
