using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/player")]
public class PlayerController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILivePlayerDataService _nba;

    public PlayerController(AppDbContext context, ILivePlayerDataService nba)
    {
        _context = context;
        _nba = nba;
    }

    // GET /api/player/teams/{leagueId}
    // Returns NBA teams that have at least one game within the league's scoring window.
    [HttpGet("teams/{leagueId:int}")]
    public async Task<ActionResult<List<TeamDto>>> GetTeamsInWindow(int leagueId)
    {
        var league = await _context.Leagues.FindAsync(leagueId);
        if (league is null)
            return NotFound("League not found.");

        if (league.WeekStartDate is null || league.WeekEndDate is null)
            return Ok(new List<TeamDto>());

        var teamIds = await GetTeamIdsInWindow(league);

        var teams = await _context.NbaTeams
            .Where(t => teamIds.Contains(t.TeamId))
            .OrderBy(t => t.FullName)
            .Select(t => new TeamDto
            {
                TeamId = t.TeamId,
                FullName = t.FullName,
                Abbreviation = t.Abbreviation
            })
            .ToListAsync();

        return Ok(teams);
    }

    // GET /api/player/available/{leagueId}?teamId=1610612747
    // Returns active players for the given team that are available to draft.
    // If the league has UniqueRosters enabled, already-drafted players are excluded.
    [HttpGet("available/{leagueId:int}")]
    public async Task<ActionResult<List<PlayerDto>>> GetAvailablePlayers(
        int leagueId,
        [FromQuery] int? teamId)
    {
        var league = await _context.Leagues.FindAsync(leagueId);
        if (league is null)
        {
            return NotFound("League not found.");
        }

        var query = _context.NbaPlayers
            .Include(p => p.Team)
            .Where(p => p.IsActive);

        if (teamId is not null)
        {
            query = query.Where(p => p.TeamId == teamId);
        }
        else if (league.WeekStartDate is not null && league.WeekEndDate is not null)
        {
            var teamIds = await GetTeamIdsInWindow(league);
            query = query.Where(p => p.TeamId != null && teamIds.Contains(p.TeamId.Value));
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

    // GET /api/player/nba-teams
    // Returns all current NBA teams. Tries stats.nba.com first; falls back to the DB.
    [HttpGet("nba-teams")]
    public async Task<ActionResult<List<TeamDto>>> GetNbaTeams()
    {
        var teams = await _nba.GetAllTeamsAsync();

        if (!teams.Any())
        {
            teams = await _context.NbaTeams
                .OrderBy(t => t.FullName)
                .Select(t => new TeamDto
                {
                    TeamId = t.TeamId,
                    FullName = t.FullName,
                    Abbreviation = t.Abbreviation
                })
                .ToListAsync();
        }

        return Ok(teams);
    }

    // GET /api/player/nba-roster/{teamId}?leagueId=X
    // Returns the current roster for an NBA team. Tries stats.nba.com first; falls back to the DB.
    // Already-drafted players for the given league are excluded.
    [HttpGet("nba-roster/{teamId:int}")]
    public async Task<ActionResult<List<PlayerDto>>> GetNbaRoster(int teamId, [FromQuery] int leagueId)
    {
        var players = await _nba.GetTeamRosterAsync(teamId);

        if (!players.Any())
        {
            players = await _context.NbaPlayers
                .Include(p => p.Team)
                .Where(p => p.IsActive && p.TeamId == teamId)
                .OrderBy(p => p.FullName)
                .Select(p => new PlayerDto
                {
                    PlayerId = p.PlayerId,
                    FullName = p.FullName,
                    Position = p.Position,
                    JerseyNumber = p.JerseyNumber,
                    TeamName = p.Team != null ? p.Team.FullName : null,
                    TeamAbbreviation = p.Team != null ? p.Team.Abbreviation : null
                })
                .ToListAsync();
        }

        if (players.Any())
        {
            var league = await _context.Leagues.FindAsync(leagueId);
            if (league is not null && league.UniqueRosters)
            {
                var draftedIds = await _context.FantasyRosters
                    .Where(fr => fr.FantasyTeam!.LeagueId == leagueId)
                    .Select(fr => fr.PlayerId)
                    .ToListAsync();

                players = players.Where(p => !draftedIds.Contains(p.PlayerId)).ToList();
            }
        }

        return Ok(players);
    }

    // Returns the IDs of all NBA teams that have at least one game in the league's scoring window.
    private async Task<List<int>> GetTeamIdsInWindow(NbaLeague league)
    {
        var gamesInWindow = await _context.NbaGames
            .Where(g => g.GameDate >= league.WeekStartDate!.Value
                     && g.GameDate <= league.WeekEndDate!.Value)
            .Select(g => new { g.HomeTeamId, g.AwayTeamId })
            .ToListAsync();

        return gamesInWindow
            .SelectMany(g => new[] { g.HomeTeamId, g.AwayTeamId })
            .Where(id => id != null)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();
    }
}
