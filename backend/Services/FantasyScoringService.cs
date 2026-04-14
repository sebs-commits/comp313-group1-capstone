using backend.DTOs;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class FantasyScoringService
{
    private readonly AppDbContext _context;
    private readonly ILivePlayerDataService _nba;

    public FantasyScoringService(AppDbContext context, ILivePlayerDataService nba)
    {
        _context = context;
        _nba = nba;
    }

    // Public helper so controllers can pre-fetch window stats once and pass them to GetTeamTotalPoints
    public Task<Dictionary<int, CdnPlayerStatsDto>> FetchWindowStatsAsync(DateOnly start, DateOnly end)
        => _nba.GetPlayerStatsForWindowAsync(start, end);

    // Returns the full score breakdown for a team (used by the score endpoint in the FantasyTeamController)
    public async Task<FantasyTeamScoreDto> GetTeamScore(FantasyTeam team, NbaLeague league)
    {
        var result = new FantasyTeamScoreDto
        {
            FantasyTeamId = team.Id,
            TeamName = team.TeamName
        };

        if (league.WeekStartDate is null || league.WeekEndDate is null)
            return result;

        var start = league.WeekStartDate.Value;
        var end   = league.WeekEndDate.Value;

        // Try CDN box scores first (covers 2025-26 regular season + playoffs)
        var cdnStats = await _nba.GetPlayerStatsForWindowAsync(start, end);

        foreach (var rosterEntry in team.Roster)
        {
            int points, rebounds, assists, steals, blocks, turnovers, threesMade;
            string? playerName = null;

            if (cdnStats.TryGetValue(rosterEntry.PlayerId, out var cdn))
            {
                points     = cdn.Points;
                rebounds   = cdn.Rebounds;
                assists    = cdn.Assists;
                steals     = cdn.Steals;
                blocks     = cdn.Blocks;
                turnovers  = cdn.Turnovers;
                threesMade = cdn.ThreePointersMade;
            }
            else
            {
                // Fallback to DB
                var dbStats = await GetStatsInWindow(rosterEntry.PlayerId, start, end, includePlayer: true);
                if (dbStats.Count == 0) continue;

                points     = dbStats.Sum(s => s.Points ?? 0);
                rebounds   = dbStats.Sum(s => s.Rebounds ?? 0);
                assists    = dbStats.Sum(s => s.Assists ?? 0);
                steals     = dbStats.Sum(s => s.Steals ?? 0);
                blocks     = dbStats.Sum(s => s.Blocks ?? 0);
                turnovers  = dbStats.Sum(s => s.Turnovers ?? 0);
                threesMade = dbStats.Sum(s => s.Fg3Made ?? 0);
                playerName = dbStats.First().Player?.FullName;
            }

            if (playerName is null)
            {
                var player = await _context.NbaPlayers.FindAsync(rosterEntry.PlayerId);
                playerName = player?.FullName;
            }

            result.PlayerScores.Add(new PlayerScoreDto
            {
                PlayerId      = rosterEntry.PlayerId,
                PlayerName    = playerName,
                FantasyPoints = CalculateFantasyPoints(points, rebounds, assists, steals, blocks, turnovers, threesMade),
                Points        = points,
                Rebounds      = rebounds,
                Assists       = assists,
                Steals        = steals,
                Blocks        = blocks,
                Turnovers     = turnovers,
                Fg3Made       = threesMade
            });
        }

        result.TotalPoints = result.PlayerScores.Sum(p => p.FantasyPoints);
        return result;
    }

    // Returns just the total points for a team. Accepts pre-fetched CDN stats to avoid
    // re-fetching box scores on every call when scoring multiple teams (like leaderboard).
    public async Task<decimal> GetTeamTotalPoints(
        FantasyTeam team,
        NbaLeague league,
        Dictionary<int, CdnPlayerStatsDto>? cdnStats = null)
    {
        if (league.WeekStartDate is null || league.WeekEndDate is null)
            return 0;

        var start = league.WeekStartDate.Value;
        var end   = league.WeekEndDate.Value;

        // Use pre-fetched CDN stats if provided, otherwise fetch now
        cdnStats ??= await _nba.GetPlayerStatsForWindowAsync(start, end);

        if (cdnStats.Count > 0)
        {
            var rosterIds = team.Roster.Select(r => r.PlayerId).ToHashSet();
            return cdnStats.Values
                .Where(s => rosterIds.Contains(s.PlayerId))
                .Sum(s => CalculateFantasyPoints(
                    s.Points, s.Rebounds, s.Assists,
                    s.Steals, s.Blocks, s.Turnovers, s.ThreePointersMade));
        }

        // Fallback to DB
        var rosterPlayerIds = team.Roster.Select(r => r.PlayerId).ToList();
        var dbStats = await GetStatsInWindowForPlayers(rosterPlayerIds, start, end);

        return dbStats.Sum(s => CalculateFantasyPoints(
            s.Points ?? 0, s.Rebounds ?? 0, s.Assists ?? 0,
            s.Steals ?? 0, s.Blocks ?? 0, s.Turnovers ?? 0, s.Fg3Made ?? 0));
    }


    public static decimal CalculateFantasyPoints(
        int points, int rebounds, int assists,
        int steals, int blocks, int turnovers, int threesMade)
    {
        return (points     * 1.0m)
             + (rebounds   * 1.2m)
             + (assists    * 1.5m)
             + (steals     * 3.0m)
             + (blocks     * 3.0m)
             + (turnovers  * -1.0m)
             + (threesMade * 0.5m);
    }

    // Fetches game stats for a single player within a specific date range
    private async Task<List<NbaPlayerGameStats>> GetStatsInWindow(
        int playerId, DateOnly start, DateOnly end, bool includePlayer = false)
    {
        var query = _context.NbaPlayerGameStats
            .Include(s => s.Game)
            .Where(s => s.PlayerId == playerId
                && s.Game!.GameDate >= start
                && s.Game.GameDate <= end);

        if (includePlayer)
        {
            query = query.Include(s => s.Player);
        }

        return await query.ToListAsync();
    }

    // Fetches game stats for multiple players within a date range
    private async Task<List<NbaPlayerGameStats>> GetStatsInWindowForPlayers(
        List<int> playerIds, DateOnly start, DateOnly end)
    {
        return await _context.NbaPlayerGameStats
            .Include(s => s.Game)
            .Where(s => playerIds.Contains(s.PlayerId)
                && s.Game!.GameDate >= start
                && s.Game.GameDate <= end)
            .ToListAsync();
    }
}