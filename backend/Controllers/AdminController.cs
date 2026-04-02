using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IProfileRepository _profileRepository;
    private readonly AppDbContext _dbContext;

    public AdminController(IProfileRepository profileRepository, AppDbContext dbContext)
    {
        _profileRepository = profileRepository;
        _dbContext = dbContext;
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(sub)) return null;
        return Guid.TryParse(sub, out var userId) ? userId : null;
    }

    private async Task<Profile?> GetCurrentProfile()
    {
        var userId = GetUserId();
        if (userId == null) return null;
        return await _profileRepository.GetByIdAsync(userId.Value);
    }

    private async Task<bool> IsAdmin()
    {
        var current = await GetCurrentProfile();
        return current?.IsAdmin == true;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        if (!await IsAdmin()) return Forbid();

        var users = await _profileRepository.GetAllAsync();

        return Ok(users.Select(u => new
        {
            u.Id,
            u.Username,
            u.FirstName,
            u.LastName,
            u.IsActive,
            u.IsAdmin,
            u.BanReason,
            u.BannedUntil,
            u.IsPermanentlyBanned
        }));
    }

    [HttpPost("warn")]
    public async Task<IActionResult> WarnUser([FromBody] CreateWarningDto request)
    {
        if (!await IsAdmin()) return Forbid();

        var user = await _profileRepository.GetByIdAsync(request.UserId);
        if (user == null) return NotFound(new { message = "User not found!" });

        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { message = "A warning message is needed inorder to successful warn the user!" });

        var warning = new Warning
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Message = request.Message,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Warnings.Add(warning);
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Warning has been issued successfully!" });
    }

    [HttpPost("ban")]
    public async Task<IActionResult> BanUser([FromBody] BanUserDto request)
    {
        if (!await IsAdmin()) return Forbid();

        var user = await _profileRepository.GetByIdAsync(request.UserId);
        if (user == null) return NotFound(new { message = "User not found! Please try again." });

        user.BanReason = request.Reason;
        user.IsPermanentlyBanned = request.Permanent;
        user.BannedUntil = request.Permanent ? null : request.BannedUntil;
        user.IsActive = false;

        await _profileRepository.UpdateAsync(user);

        return Ok(new { message = "User has been banned successfully!" });
    }

    [HttpPost("unban/{userId}")]
    public async Task<IActionResult> UnbanUser(Guid userId)
    {
        if (!await IsAdmin()) return Forbid();

        var user = await _profileRepository.GetByIdAsync(userId);
        if (user == null) return NotFound(new { message = "User not found! Please try again." });

        user.BanReason = null;
        user.BannedUntil = null;
        user.IsPermanentlyBanned = false;
        user.IsActive = true;

        await _profileRepository.UpdateAsync(user);

        return Ok(new { message = "User has been unbanned successfully!" });
    }

    [HttpGet("warnings/{userId}")]
    public async Task<IActionResult> GetWarnings(Guid userId)
    {
        if (!await IsAdmin()) return Forbid();

        var warnings = await _dbContext.Warnings
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return Ok(warnings);
    }
}