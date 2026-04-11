using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using System.Text.Json;
using System.Text; 
using System.Net.Http;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly ILivePlayerDataService _liveDataService; 
    private readonly IConfiguration _configuration;

    public NotificationController(ILivePlayerDataService liveDataService, IConfiguration configuration)
    {
        _liveDataService = liveDataService;
        _configuration = configuration;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetNotifications([FromQuery] string? userId = null)
    {
        string dateIdentifier = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var injuryReports = await _liveDataService.GetDailyInjuryReportAsync(dateIdentifier);

        if (injuryReports == null || !injuryReports.Any())
        {
            dateIdentifier = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd");
            injuryReports = await _liveDataService.GetDailyInjuryReportAsync(dateIdentifier);
        } else
        {
            return Ok(new List<NotificationDto>());
        }

        var notifications = injuryReports.Select(report => new NotificationDto
        {
            Id = Guid.NewGuid(),
            Type = "INJURY",
            Message = $"{report.Player} ({report.Team}): {report.Description} - {report.Status}",
            CreatedAt = DateTime.UtcNow
        }).ToList();

        return Ok(notifications);
    }
}