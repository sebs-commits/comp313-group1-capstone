using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IProfileRepository _profileRepository;

    public ProfileController(IProfileRepository profileRepository)
    {
        _profileRepository = profileRepository;
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;
    
        if (string.IsNullOrEmpty(sub)) return null;
        return Guid.Parse(sub);
    }

    [HttpGet("user")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "Invalid token" });

        var profile = await _profileRepository.GetByIdAsync(userId.Value);

        if (profile == null)
            return NotFound(new { message = "Profile not found" });

        return Ok(new ProfileDto
        {
            Id = profile.Id,
            Username = profile.Username,
            FirstName = profile.FirstName,
            LastName = profile.LastName,
            CreatedAt = profile.CreatedAt,
            IsActive = profile.IsActive
        });
    }
    [HttpPost]
    public async Task<IActionResult> CreateProfile(ProfileDto request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "Invalid token" });

        var existing = await _profileRepository.GetByIdAsync(userId.Value);
        if (existing != null)
            return Conflict(new { message = "Profile already exists" });

        var usernameExists = await _profileRepository.GetByUsernameAsync(request.Username);
        if (usernameExists != null)
            return Conflict(new { message = "Username already taken" });

        var profile = new Profile
        {
            Id = userId.Value,
            Username = request.Username,
            FirstName = request.FirstName,
            LastName = request.LastName,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _profileRepository.CreateAsync(profile);

        return Created($"/api/profile/me", new ProfileDto
        {
            Id = profile.Id,
            Username = profile.Username,
            FirstName = profile.FirstName,
            LastName = profile.LastName,
            CreatedAt = profile.CreatedAt,
            IsActive = profile.IsActive
        });
    }
}