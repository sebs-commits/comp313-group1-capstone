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
    Task<BoxScoreDto?> GetLiveBoxScoreAsync(string gameId);
    Task<List<TeamDto>> GetAllTeamsAsync();
    Task<List<PlayerDto>> GetTeamRosterAsync(int teamId);
    Task<List<int>> GetTeamIdsWithGamesInWindowAsync(DateOnly start, DateOnly end);
    Task<Dictionary<int, CdnPlayerStatsDto>> GetPlayerStatsForWindowAsync(DateOnly start, DateOnly end);
}