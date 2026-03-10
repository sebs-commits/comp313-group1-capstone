using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/fantasy-team")]
public class FantasyTeamController : ControllerBase
{
    private readonly AppDbContext _context;

    public FantasyTeamController(AppDbContext context)
    {
        _context = context;
    }

    // POST api/fantasy-team
    [HttpPost]
    public async Task<ActionResult<FantasyTeamResponseDto>> CreateTeam(CreateFantasyTeamDto dto)
    {
        var league = await _context.Leagues.FindAsync(dto.LeagueId);
        if (league is null)
            return NotFound("League not found.");

        var isMember = await _context.LeagueMembers
            .AnyAsync(lm => lm.LeagueId == dto.LeagueId && lm.UserId == dto.UserId);
        if (!isMember)
            return BadRequest("User is not a member of this league.");

        var alreadyHasTeam = await _context.FantasyTeams
            .AnyAsync(ft => ft.LeagueId == dto.LeagueId && ft.UserId == dto.UserId);
        if (alreadyHasTeam)
            return Conflict("User already has a team in this league.");

        var teamCount = await _context.FantasyTeams.CountAsync(ft => ft.LeagueId == dto.LeagueId);
        if (teamCount >= league.MaxTeams)
            return BadRequest("This league has reached its maximum number of teams.");

        var team = new FantasyTeam
        {
            LeagueId = dto.LeagueId,
            UserId = dto.UserId,
            TeamName = dto.TeamName
        };

        _context.FantasyTeams.Add(team);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTeam), new { id = team.Id }, new FantasyTeamResponseDto
        {
            Id = team.Id,
            LeagueId = team.LeagueId,
            UserId = team.UserId,
            TeamName = team.TeamName,
            CreatedAt = team.CreatedAt,
            Roster = new List<RosterPlayerDto>()
        });
    }

    // GET api/fantasy-team/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<FantasyTeamResponseDto>> GetTeam(int id)
    {
        var team = await _context.FantasyTeams
            .Include(ft => ft.Roster)
                .ThenInclude(fr => fr.Player)
                    .ThenInclude(p => p!.Team)
            .FirstOrDefaultAsync(ft => ft.Id == id);

        if (team is null)
            return NotFound();

        var roster = team.Roster.Select(fr => new RosterPlayerDto
        {
            PlayerId = fr.PlayerId,
            FullName = fr.Player?.FullName,
            Position = fr.Player?.Position,
            TeamAbbreviation = fr.Player?.Team?.Abbreviation,
            AddedAt = fr.AddedAt
        }).ToList();

        return Ok(new FantasyTeamResponseDto
        {
            Id = team.Id,
            LeagueId = team.LeagueId,
            UserId = team.UserId,
            TeamName = team.TeamName,
            CreatedAt = team.CreatedAt,
            Roster = roster
        });
    }
}