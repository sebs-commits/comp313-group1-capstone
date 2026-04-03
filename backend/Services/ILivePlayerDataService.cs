using System;
using System.Threading.Tasks;
using backend;
using backend.DTOs;

namespace backend;

public interface ILivePlayerDataService
{
    Task<PlayerStatsDto?> GetPlayerCareerStatsAsync(string playerId);
    Task<ScoreboardDto?> GetTodaysScoreboardAsync();
    Task<List<InjuryReportDto>?> GetDailyInjuryReportAsync(string reportIdentifier);
}