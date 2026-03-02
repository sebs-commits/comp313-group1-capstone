using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace backend;

public class LivePlayerDataService : ILivePlayerDataService
{
    private readonly HttpClient _httpClient;

    public LivePlayerDataService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<ScoreboardDto?> GetTodaysScoreboardAsync()
    {
        var url = "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json";
        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<ScoreboardDto>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    public async Task<PlayerStatsDto?> GetPlayerCareerStatsAsync(string playerId)
    {
        return null;
    }
}