using System;
using System.Threading.Tasks;
using backend;

namespace backend;

public interface ILivePlayerDataService
{
    Task<PlayerStatsDto?> GetPlayerCareerStatsAsync(string playerId);
    Task<ScoreboardDto?> GetTodaysScoreboardAsync();
}