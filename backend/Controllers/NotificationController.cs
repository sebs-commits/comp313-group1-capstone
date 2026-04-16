using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly ILivePlayerDataService _liveDataService;
    private readonly AppDbContext _context;

    public NotificationController(ILivePlayerDataService liveDataService, AppDbContext context)
    {
        _liveDataService = liveDataService;
        _context = context;
    }

    private Guid? GetCurrentUserId()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out var parsedUserId))
            return null;

        return parsedUserId;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetNotifications()
    {
        var notifications = new List<NotificationDto>();

        // Fetch trade notifications for authenticated users
        var userId = GetCurrentUserId();
        if (userId.HasValue)
        {
            var tradeNotifications = await _context.Notifications
                .Where(n => n.UserId == userId.Value)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Type = n.Type,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                })
                .ToListAsync();

            notifications.AddRange(tradeNotifications);
        }

        // Fetch injury notifications
        string dateIdentifier = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var injuryReports = await _liveDataService.GetDailyInjuryReportAsync(dateIdentifier);

        if (injuryReports == null || !injuryReports.Any())
        {
            dateIdentifier = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd");
            injuryReports = await _liveDataService.GetDailyInjuryReportAsync(dateIdentifier);
        }

        if (injuryReports != null && injuryReports.Any())
        {
            var injuryNotifications = injuryReports.Select(report => new NotificationDto
            {
                Id = Guid.NewGuid(),
                Type = "INJURY",
                Message = $"{report.Player} ({report.Team}): {report.Description} - {report.Status}",
                CreatedAt = DateTime.UtcNow
            });

            notifications.AddRange(injuryNotifications);
        }

        return Ok(notifications.OrderByDescending(n => n.CreatedAt));
    }

    [HttpPatch("{id:guid}/read")]
    [Authorize]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId.Value);

        if (notification == null)
            return NotFound();

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteNotification(Guid id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId.Value);

        if (notification == null)
            return NotFound();

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
