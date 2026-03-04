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

    private Guid GetUserId()
    {
        var sub = User.FindFirst("sub")?.Value;
        return Guid.Parse(sub!);
    }

    [HttpGet("user")]
    public async Task<IActionResult> GetMyProfile()
    {
        var profile = await _profileRepository.GetByIdAsync(GetUserId());

        if (profile == null)
            return NotFound(new { message = "Profile not found" });

        return Ok(new ProfileDto()
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