using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeagueController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public LeagueController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    // GET api/league
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeagueResponseDto>>> GetPublicLeagues()
    {
        var leagues = await _context.Leagues
            .Where(l => l.IsPublic)
            .Select(l => new LeagueResponseDto
            {
                Id = l.Id,
                Name = l.Name,
                Description = l.Description,
                IsPublic = l.IsPublic,
                CreatedByUserId = l.CreatedByUserId,
                MemberCount = l.Members.Count,
                WeekStartDate = l.WeekStartDate,
                WeekEndDate = l.WeekEndDate,
                DraftDate = l.DraftDate,
                ScoringType = l.ScoringType,
                MaxTeams = l.MaxTeams,
                RosterSize = l.RosterSize,
                Status = l.Status
            })
            .ToListAsync();

        return Ok(leagues);
    }

    // GET api/league/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<LeagueResponseDto>> GetLeague(int id)
    {
        var league = await _context.Leagues
            .Where(l => l.Id == id)
            .Select(l => new LeagueResponseDto
            {
                Id = l.Id,
                Name = l.Name,
                Description = l.Description,
                IsPublic = l.IsPublic,
                InviteCode = l.InviteCode,
                CreatedByUserId = l.CreatedByUserId,
                MemberCount = l.Members.Count,
                WeekStartDate = l.WeekStartDate,
                WeekEndDate = l.WeekEndDate,
                DraftDate = l.DraftDate,
                ScoringType = l.ScoringType,
                MaxTeams = l.MaxTeams,
                RosterSize = l.RosterSize,
                Status = l.Status
            })
            .FirstOrDefaultAsync();

        return league is null ? NotFound() : Ok(league);
    }

    // POST api/league
    [HttpPost]
    public async Task<ActionResult<LeagueResponseDto>> CreateLeague(CreateLeagueDto dto)
    {
        var userExists = await _context.Profiles.AnyAsync(p => p.Id == dto.CreatedByUserId);
        if (!userExists)
            return BadRequest("Invalid user.");

        var league = new NbaLeague
        {
            Name = dto.Name,
            Description = dto.Description,
            IsPublic = dto.IsPublic,
            CreatedByUserId = dto.CreatedByUserId,
            InviteCode = dto.IsPublic ? null : Guid.NewGuid().ToString("N")[..8].ToUpper(),
            DraftDate = dto.DraftDate,
            ScoringType = dto.ScoringType,
            MaxTeams = dto.MaxTeams,
            RosterSize = dto.RosterSize,
            Status = "pending"
        };

        _context.Leagues.Add(league);
        await _context.SaveChangesAsync();

        // Auto-add the creator as commissioner
        _context.LeagueMembers.Add(new LeagueMember
        {
            LeagueId = league.Id,
            UserId = dto.CreatedByUserId,
            Role = "commissioner"
        });
        await _context.SaveChangesAsync();

        var response = new LeagueResponseDto
        {
            Id = league.Id,
            Name = league.Name,
            Description = league.Description,
            IsPublic = league.IsPublic,
            InviteCode = league.InviteCode,
            CreatedByUserId = league.CreatedByUserId,
            MemberCount = 1,
            DraftDate = league.DraftDate,
            ScoringType = league.ScoringType,
            MaxTeams = league.MaxTeams,
            RosterSize = league.RosterSize,
            Status = league.Status
        };

        return CreatedAtAction(nameof(GetLeague), new { id = league.Id }, response);
    }

    // POST api/league/{id}/join
    [HttpPost("{id}/join")]
    public async Task<IActionResult> JoinLeague(int id, JoinLeagueDto dto)
    {
        var league = await _context.Leagues.FindAsync(id);
        if (league is null)
            return NotFound("League not found.");

        if (!league.IsPublic)
        {
            if (string.IsNullOrWhiteSpace(dto.InviteCode) ||
                !string.Equals(league.InviteCode, dto.InviteCode, StringComparison.OrdinalIgnoreCase))
                return BadRequest("Invalid invite code.");
        }

        var alreadyMember = await _context.LeagueMembers
            .AnyAsync(lm => lm.LeagueId == id && lm.UserId == dto.UserId);

        if (alreadyMember)
            return Conflict("User is already a member of this league.");

        _context.LeagueMembers.Add(new LeagueMember
        {
            LeagueId = id,
            UserId = dto.UserId,
            Role = "member"
        });

        await _context.SaveChangesAsync();
        return Ok("Joined league successfully.");
    }
}