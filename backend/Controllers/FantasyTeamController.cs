using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/fantasy-team")]
public class FantasyTeamController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly FantasyScoringService _scoring;

    public FantasyTeamController(AppDbContext context, FantasyScoringService scoring)
    {
        _context = context;
        _scoring = scoring;
    }

    // GET api/fantasy-team?userId={guid}
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FantasyTeamResponseDto>>> GetTeams([FromQuery] Guid? userId = null)
    {
        var query = _context.FantasyTeams
            .Include(ft => ft.Roster)
                .ThenInclude(fr => fr.Player)
                    .ThenInclude(p => p!.Team)
            .AsQueryable();

        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            query = query.Where(ft => ft.UserId == userId.Value);
        }

        var teams = await query
            .OrderBy(ft => ft.LeagueId)
            .ThenBy(ft => ft.TeamName)
            .Select(team => new FantasyTeamResponseDto
            {
                Id = team.Id,
                LeagueId = team.LeagueId,
                UserId = team.UserId,
                TeamName = team.TeamName,
                CreatedAt = team.CreatedAt,
                Roster = team.Roster.Select(fr => new RosterPlayerDto
                {
                    PlayerId = fr.PlayerId,
                    FullName = fr.Player != null ? fr.Player.FullName : null,
                    Position = fr.Player != null ? fr.Player.Position : null,
                    TeamAbbreviation = fr.Player != null && fr.Player.Team != null ? fr.Player.Team.Abbreviation : null,
                    AddedAt = fr.AddedAt
                }).ToList()
            })
            .ToListAsync();

        return Ok(teams);
    }

    // GET api/fantasy-team/league/{leagueId}/teams
    [HttpGet("league/{leagueId:int}/teams")]
    public async Task<ActionResult<IEnumerable<LeagueTeamSummaryDto>>> GetLeagueTeams(int leagueId)
    {
        var teams = await _context.FantasyTeams
            .Where(ft => ft.LeagueId == leagueId)
            .GroupJoin(
                _context.Profiles,
                ft => ft.UserId,
                p => p.Id,
                (ft, profiles) => new { Team = ft, Profile = profiles.FirstOrDefault() }
            )
            .Select(x => new LeagueTeamSummaryDto
            {
                Id = x.Team.Id,
                LeagueId = x.Team.LeagueId,
                UserId = x.Team.UserId,
                TeamName = x.Team.TeamName,
                ManagerName = x.Profile != null
                    ? (!string.IsNullOrWhiteSpace(x.Profile.Username)
                        ? x.Profile.Username
                        : (!string.IsNullOrWhiteSpace(x.Profile.FirstName) || !string.IsNullOrWhiteSpace(x.Profile.LastName)
                            ? ($"{x.Profile.FirstName} {x.Profile.LastName}").Trim()
                            : null))
                    : null,
                RosterCount = _context.FantasyRosters.Count(fr => fr.FantasyTeamId == x.Team.Id)
            })
            .OrderBy(t => t.TeamName)
            .ToListAsync();

        return Ok(teams);
    }

    // POST api/fantasy-team
    [HttpPost]
    public async Task<ActionResult<FantasyTeamResponseDto>> CreateTeam(CreateFantasyTeamDto dto)
    {
        var league = await _context.Leagues.FindAsync(dto.LeagueId);
        if (league is null)
        {
            return NotFound("League not found.");
        }

        var isMember = await _context.LeagueMembers
            .AnyAsync(lm => lm.LeagueId == dto.LeagueId && lm.UserId == dto.UserId);
        if (!isMember)
        {
            return BadRequest("User is not a member of this league.");
        }

        var alreadyHasTeam = await _context.FantasyTeams
            .AnyAsync(ft => ft.LeagueId == dto.LeagueId && ft.UserId == dto.UserId);
        if (alreadyHasTeam)
        {
            return Conflict("User already has a team in this league.");
        }

        var teamCount = await _context.FantasyTeams.CountAsync(ft => ft.LeagueId == dto.LeagueId);
        if (teamCount >= league.MaxTeams)
        {
            return BadRequest("This league has reached its maximum number of teams.");
        }

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
        {
            return NotFound();
        }

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
        {
            return NotFound("Team not found.");
        }

        var draftSession = await _context.DraftSessions
            .FirstOrDefaultAsync(ds => ds.LeagueId == team.LeagueId);

        if (draftSession is not null && (draftSession.Status == "active" || draftSession.Status == "completed"))
        {
            return BadRequest("Players can only be added through the draft room.");
        }

        if (team.Roster.Count >= team.League!.RosterSize)
        {
            return BadRequest($"Roster is full. Maximum size is {team.League.RosterSize}.");
        }

        if (team.Roster.Any(fr => fr.PlayerId == dto.PlayerId))
        {
            return Conflict("Player is already on your roster.");
        }

        if (team.League.UniqueRosters)
        {
            var takenByOther = await _context.FantasyRosters
                .AnyAsync(fr => fr.PlayerId == dto.PlayerId
                    && fr.FantasyTeam!.LeagueId == team.LeagueId
                    && fr.FantasyTeamId != team.Id);

            if (takenByOther)
            {
                return Conflict("This player has already been drafted by another team in this league.");
            }
        }

        if (team.League!.WeekStartDate is not null && team.League.WeekEndDate is not null)
        {
            var playerTeamId = await _context.NbaPlayers
                .Where(p => p.PlayerId == dto.PlayerId)
                .Select(p => p.TeamId)
                .FirstOrDefaultAsync();

            var hasGameInWindow = await _context.NbaGames
                .AnyAsync(g => g.GameDate >= team.League.WeekStartDate.Value
                            && g.GameDate <= team.League.WeekEndDate.Value
                            && (g.HomeTeamId == playerTeamId || g.AwayTeamId == playerTeamId));

            if (!hasGameInWindow)
            {
                return BadRequest("This player's team has no games scheduled within the league's scoring window.");
            }
        }

        var player = await _context.NbaPlayers.FindAsync(dto.PlayerId);
        if (player is null)
        {
            return NotFound("Player not found.");
        }

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
        {
            return NotFound("Player not found on this roster.");
        }

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

        var score = await _scoring.GetTeamScore(team, team.League!);
        return Ok(score);
    }

    // GET api/fantasy-team/league/{leagueId}/leaderboard
    [HttpGet("league/{leagueId:int}/leaderboard")]
    public async Task<ActionResult<List<LeaderboardEntryDto>>> GetLeaderboard(int leagueId)
    {
        var league = await _context.Leagues.FindAsync(leagueId);
        if (league is null)
        {
            return NotFound("League not found.");
        }

        var teams = await _context.FantasyTeams
            .Include(ft => ft.Roster)
            .Where(ft => ft.LeagueId == leagueId)
            .ToListAsync();

        // Score each team and build the leaderboard entries
        var leaderboard = new List<LeaderboardEntryDto>();

        foreach (var team in teams)
        {
            var totalPoints = await _scoring.GetTeamTotalPoints(team, league);

            leaderboard.Add(new LeaderboardEntryDto
            {
                FantasyTeamId = team.Id,
                TeamName      = team.TeamName,
                UserId        = team.UserId,
                TotalPoints   = totalPoints
            });
        }

        // Sort by points descending and assign ranks
        leaderboard = leaderboard.OrderByDescending(t => t.TotalPoints).ToList();

        for (int i = 0; i < leaderboard.Count; i++)
        {
            leaderboard[i].Rank = i + 1;
        }

        return Ok(leaderboard);
    }
}