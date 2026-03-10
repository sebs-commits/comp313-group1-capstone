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

    // POST api/fantasy-team/{id}/roster
    [HttpPost("{id:int}/roster")]
    public async Task<IActionResult> AddPlayer(int id, AddRosterPlayerDto dto)
    {
        var team = await _context.FantasyTeams
            .Include(ft => ft.Roster)
            .Include(ft => ft.League)
            .FirstOrDefaultAsync(ft => ft.Id == id);

        if (team is null)
            return NotFound("Team not found.");

        if (team.Roster.Count >= team.League!.RosterSize)
            return BadRequest($"Roster is full. Maximum size is {team.League.RosterSize}.");

        if (team.Roster.Any(fr => fr.PlayerId == dto.PlayerId))
            return Conflict("Player is already on your roster");

        if (team.League.UniqueRosters)
        {
            var takenByOther = await _context.FantasyRosters
                .AnyAsync(fr => fr.PlayerId == dto.PlayerId
                    && fr.FantasyTeam!.LeagueId == team.LeagueId
                    && fr.FantasyTeamId != team.Id);

            if (takenByOther)
                return Conflict("This player has already been drafted by another team in this league.");
        }

        var player = await _context.NbaPlayers.FindAsync(dto.PlayerId);
        if (player is null)
            return NotFound("Player not found.");

        _context.FantasyRosters.Add(new FantasyRoster
        {
            FantasyTeamId = id,
            PlayerId = dto.PlayerId
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = $"{player.FullName} added to roster." });
    }

    // DELETE api/fantasy-team/{id}/roster/{playerId}
    [HttpDelete("{id:int}/roster/{playerId:int}")]
    public async Task<IActionResult> RemovePlayer(int id, int playerId)
    {
        var entry = await _context.FantasyRosters
            .FirstOrDefaultAsync(fr => fr.FantasyTeamId == id && fr.PlayerId == playerId);

        if (entry is null)
            return NotFound("Player not found on this roster.");

        _context.FantasyRosters.Remove(entry);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Player removed from the roster." });
    }

    // GET api/fantasy-team/{id}/score
    [HttpGet("{id:int}/score")]
    public async Task<ActionResult<FantasyTeamScoreDto>> GetScore(int id)
    {
        var team = await _context.FantasyTeams
            .Include(ft => ft.Roster)
            .Include(ft => ft.League)
            .FirstOrDefaultAsync(ft => ft.Id == id);

        if (team is null)
        {
            return NotFound("Team not found.");
        }

        // If the league has no scoring window well return 0
        if (team.League!.WeekStartDate is null || team.League.WeekEndDate is null)
        {
            return Ok(new FantasyTeamScoreDto { FantasyTeamId = team.Id, TeamName = team.TeamName });
        }
            

        var playerScores = new List<PlayerScoreDto>();
        
        foreach (var rosterEntry in team.Roster)
        {
            // Get all game stats for this player within the scoring window
            var stats = await _context.NbaPlayerGameStats
                .Include(s => s.Player)
                .Include(s => s.Game)
                .Where(s => s.PlayerId == rosterEntry.PlayerId
                    && s.Game!.GameDate >= team.League.WeekStartDate
                    && s.Game.GameDate <= team.League.WeekEndDate)
                .ToListAsync();

            if (stats.Count == 0) continue;

            // Add al the stats from all games
            int points     = stats.Sum(s => s.Points ?? 0);
            int rebounds   = stats.Sum(s => s.Rebounds ?? 0);
            int assists    = stats.Sum(s => s.Assists ?? 0);
            int steals     = stats.Sum(s => s.Steals ?? 0);
            int blocks     = stats.Sum(s => s.Blocks ?? 0);
            int turnovers  = stats.Sum(s => s.Turnovers ?? 0);
            int threesMade = stats.Sum(s => s.Fg3Made ?? 0);

            // Apply the scores
            decimal fantasyPoints = (points     * 1.0m)
                                  + (rebounds   * 1.2m)
                                  + (assists    * 1.5m)
                                  + (steals     * 3.0m)
                                  + (blocks     * 3.0m)
                                  + (turnovers  * -1.0m)
                                  + (threesMade * 0.5m);

            playerScores.Add(new PlayerScoreDto
            {
                PlayerId = rosterEntry.PlayerId,
                PlayerName = stats.First().Player?.FullName,
                FantasyPoints = fantasyPoints,
                Points = points,
                Rebounds = rebounds,
                Assists = assists,
                Steals = steals,
                Blocks = blocks,
                Turnovers = turnovers,
                Fg3Made = threesMade
            });
        }

        return Ok(new FantasyTeamScoreDto
        {
            FantasyTeamId = team.Id,
            TeamName = team.TeamName,
            TotalPoints = playerScores.Sum(p => p.FantasyPoints),
            PlayerScores = playerScores
        });
    }
}