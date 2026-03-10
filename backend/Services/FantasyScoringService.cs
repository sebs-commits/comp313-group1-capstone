using backend.DTOs;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class FantasyScoringService
{
    private readonly AppDbContext _context;

    public FantasyScoringService(AppDbContext context)
    {
        _context = context;
    }

    // Returns the full score breakdown for a team(used by the score endpoint in the FantasyTeamController)
    public async Task<FantasyTeamScoreDto> GetTeamScore(FantasyTeam team, NbaLeague league)
    {
        var result = new FantasyTeamScoreDto
        {
            FantasyTeamId = team.Id,
            TeamName = team.TeamName
        };

        if (league.WeekStartDate is null || league.WeekEndDate is null)
        {
            return result;
        }

        foreach (var rosterEntry in team.Roster)
        {
            var stats = await GetStatsInWindow(
                rosterEntry.PlayerId,
                league.WeekStartDate.Value,
                league.WeekEndDate.Value,
                includePlayer: true
            );

            if (stats.Count == 0) continue;

            int points     = stats.Sum(s => s.Points ?? 0);
            int rebounds   = stats.Sum(s => s.Rebounds ?? 0);
            int assists    = stats.Sum(s => s.Assists ?? 0);
            int steals     = stats.Sum(s => s.Steals ?? 0);
            int blocks     = stats.Sum(s => s.Blocks ?? 0);
            int turnovers  = stats.Sum(s => s.Turnovers ?? 0);
            int threesMade = stats.Sum(s => s.Fg3Made ?? 0);

            result.PlayerScores.Add(new PlayerScoreDto
            {
                PlayerId      = rosterEntry.PlayerId,
                PlayerName    = stats.First().Player?.FullName,
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

    // Returns just the total points for a team(used by the leaderboard ednpoint in the FantasyTeamController)
    public async Task<decimal> GetTeamTotalPoints(FantasyTeam team, NbaLeague league)
    {
        if (league.WeekStartDate is null || league.WeekEndDate is null)
        {
            return 0;
        }

        var rosterPlayerIds = team.Roster.Select(r => r.PlayerId).ToList();

        var stats = await GetStatsInWindowForPlayers(
            rosterPlayerIds,
            league.WeekStartDate.Value,
            league.WeekEndDate.Value
        );

        decimal totalPoints = 0;

        foreach (var s in stats)
        {
            totalPoints += CalculateFantasyPoints(
                s.Points ?? 0, s.Rebounds ?? 0, s.Assists ?? 0,
                s.Steals ?? 0, s.Blocks ?? 0, s.Turnovers ?? 0, s.Fg3Made ?? 0
            );
        }

        return totalPoints;
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