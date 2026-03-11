using backend.Models;
using backend.DTOs;
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
        return Guid.TryParse(sub, out var userId) ? userId : null;
    }
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> RegisterProfile([FromBody] RegisterProfileRequestDto request)
    {
        if (request.UserId == Guid.Empty)
            return BadRequest(new { message = "Invalid user ID." });

        if (string.IsNullOrWhiteSpace(request.Username))
            return BadRequest(new { message = "Username is required." });

        var existing = await _profileRepository.GetByIdAsync(request.UserId);
        if (existing != null)
            return Conflict(new { message = "Profile already exists." });

        var usernameExists = await _profileRepository.GetByUsernameAsync(request.Username);
        if (usernameExists != null)
            return Conflict(new { message = "Username already taken." });

        var profile = new Profile
        {
            Id = request.UserId,
            Username = request.Username,
            FirstName = request.FirstName,
            LastName = request.LastName,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _profileRepository.CreateAsync(profile);

        return Ok(new
        {
            message = "Profile created successfully."
        });
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
    [HttpPut]
    public async Task<IActionResult> UpdateProfile(ProfileDto request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "Invalid token" });

        var profile = await _profileRepository.GetByIdAsync(userId.Value);

        if (profile == null)
            return NotFound(new { message = "Profile not found" });

        if (request.Username != profile.Username)
        {
            var usernameExists = await _profileRepository.GetByUsernameAsync(request.Username);
            if (usernameExists != null)
                return Conflict(new { message = "Username already taken" });
        }

        profile.Username = request.Username;
        profile.FirstName = request.FirstName;
        profile.LastName = request.LastName;

        await _profileRepository.UpdateAsync(profile);

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
}