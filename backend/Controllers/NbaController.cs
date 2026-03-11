using backend.Data;
using backend.DTOs;
using backend.Models;   
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NbaController : ControllerBase
    {
        private readonly ILivePlayerDataService _nbaService;
        private readonly AppDbContext _context;

        public NbaController(ILivePlayerDataService nbaService, AppDbContext context)
        {
            _nbaService = nbaService;
            _context = context;
        }

        [HttpGet("scoreboard")]
        public async Task<IActionResult> GetScoreboard()
        {
            var data = await _nbaService.GetTodaysScoreboardAsync();
            return data != null ? Ok(data) : NotFound("No games found.");
        }

        [HttpGet("leagues")]
        public async Task<ActionResult<IEnumerable<NbaLeague>>> GetLeagues()
        {
            var leagues = await _context.Leagues.ToListAsync();
            return Ok(leagues);
        }

        // GET api/nba/games
        // GET api/nba/games?date=2025-03-6
        // GET api/nba/games?season=2024-25
        [HttpGet("games")]
        public async Task<ActionResult<IEnumerable<GameSummaryDto>>> GetGames(
            [FromQuery] DateOnly? date,
            [FromQuery] string? season)
        {
            var query = _context.NbaGames
                .Include(g => g.HomeTeam)
                .Include(g => g.AwayTeam)
                .AsQueryable();

            if (date.HasValue)
                query = query.Where(g => g.GameDate == date.Value);

            if (!string.IsNullOrWhiteSpace(season))
                query = query.Where(g => g.Season == season);

            var games = await query
                .OrderByDescending(g => g.GameDate)
                .Select(g => new GameSummaryDto
                {
                    GameId = g.GameId,
                    Season = g.Season,
                    GameDate = g.GameDate,
                    Status = g.Status,
                    HomeTeamId = g.HomeTeamId,
                    HomeTeam = g.HomeTeam != null ? g.HomeTeam.Abbreviation : null,
                    HomeTeamScore = g.HomeTeamScore,
                    AwayTeamId = g.AwayTeamId,
                    AwayTeam = g.AwayTeam != null ? g.AwayTeam.Abbreviation : null,
                    AwayTeamScore = g.AwayTeamScore
                })
                .ToListAsync();

            return Ok(games);
        }

        // GET api/nba/games/{gameId}/stats
        //test game id: 0022401197
        [HttpGet("games/{gameId}/stats")]
        public async Task<ActionResult<IEnumerable<PlayerGameStatsDto>>> GetGameStats(string gameId)
        {
            var gameExists = await _context.NbaGames.AnyAsync(g => g.GameId == gameId);
            if (!gameExists)
                return NotFound($"Game '{gameId}' not found.");

            var stats = await _context.NbaPlayerGameStats
                .Where(s => s.GameId == gameId)
                .Include(s => s.Player)
                .Include(s => s.Team)
                .Select(s => new PlayerGameStatsDto
                {
                    StatId = s.StatId,
                    PlayerId = s.PlayerId,
                    PlayerName = s.Player != null ? s.Player.FullName : null,
                    GameId = s.GameId,
                    TeamAbbreviation = s.Team != null ? s.Team.Abbreviation : null,
                    Minutes = s.Minutes,
                    Points = s.Points,
                    Rebounds = s.Rebounds,
                    Assists = s.Assists,
                    Steals = s.Steals,
                    Blocks = s.Blocks,
                    Turnovers = s.Turnovers,
                    PersonalFouls = s.PersonalFouls,
                    FgMade = s.FgMade,
                    FgAttempted = s.FgAttempted,
                    Fg3Made = s.Fg3Made,
                    Fg3Attempted = s.Fg3Attempted,
                    FtMade = s.FtMade,
                    FtAttempted = s.FtAttempted,
                    PlusMinus = s.PlusMinus
                })
                .ToListAsync();

            return Ok(stats);
        }

        // GET api/nba/games/{gameId}/stats/{playerId}
        //test game id: 0022401197 player id: 1642347
        [HttpGet("games/{gameId}/stats/{playerId:int}")]
        public async Task<ActionResult<PlayerGameStatsDto>> GetPlayerGameStats(string gameId, int playerId)
        {
            var stat = await _context.NbaPlayerGameStats
                .Where(s => s.GameId == gameId && s.PlayerId == playerId)
                .Include(s => s.Player)
                .Include(s => s.Team)
                .Select(s => new PlayerGameStatsDto
                {
                    StatId = s.StatId,
                    PlayerId = s.PlayerId,
                    PlayerName = s.Player != null ? s.Player.FullName : null,
                    GameId = s.GameId,
                    TeamAbbreviation = s.Team != null ? s.Team.Abbreviation : null,
                    Minutes = s.Minutes,
                    Points = s.Points,
                    Rebounds = s.Rebounds,
                    Assists = s.Assists,
                    Steals = s.Steals,
                    Blocks = s.Blocks,
                    Turnovers = s.Turnovers,
                    PersonalFouls = s.PersonalFouls,
                    FgMade = s.FgMade,
                    FgAttempted = s.FgAttempted,
                    Fg3Made = s.Fg3Made,
                    Fg3Attempted = s.Fg3Attempted,
                    FtMade = s.FtMade,
                    FtAttempted = s.FtAttempted,
                    PlusMinus = s.PlusMinus
                })
                .FirstOrDefaultAsync();

            return stat is null ? NotFound() : Ok(stat);
        }
    }
}