using backend.Data;
using backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/player")]
public class PlayerController : ControllerBase
{
    private readonly AppDbContext _context;

    public PlayerController(AppDbContext context)
    {
        _context = context;
    }

    
     
    // Check league exists
    // Check all active players
    // If league has UniqueRosters = true, exclude players taken
    // GET /api/player/available/{leagueId}?search=lebron
    [HttpGet("available/{leagueId:int}")]
    public async Task<ActionResult<List<PlayerDto>>> GetAvailablePlayers(
        int leagueId,
        [FromQuery] string? search)
    {
        var league = await _context.Leagues.FindAsync(leagueId);
        if (league is null)
        {
            return NotFound("League not found.");
        }

        var query = _context.NbaPlayers
            .Include(p => p.Team)
            .Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p => p.FullName!.ToLower().Contains(search.ToLower()));
        }

        if (league.UniqueRosters)
        {
            var draftedPlayerIds = await _context.FantasyRosters
                .Where(fr => fr.FantasyTeam!.LeagueId == leagueId)
                .Select(fr => fr.PlayerId)
                .ToListAsync();

            query = query.Where(p => !draftedPlayerIds.Contains(p.PlayerId));
        }

        var players = await query
            .OrderBy(p => p.FullName)
            .Select(p => new PlayerDto
            {
                PlayerId = p.PlayerId,
                FullName = p.FullName,
                Position = p.Position,
                TeamName = p.Team != null ? p.Team.FullName : null,
                TeamAbbreviation = p.Team != null ? p.Team.Abbreviation : null,
                JerseyNumber = p.JerseyNumber
            })
            .ToListAsync();

        return Ok(players);
    }
}