using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using backend.DTOs;
using Microsoft.Extensions.Configuration;

namespace backend;

public class LivePlayerDataService : ILivePlayerDataService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public LivePlayerDataService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<ScoreboardDto?> GetTodaysScoreboardAsync()
    {
        var url = "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json";
        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<ScoreboardDto>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    public async Task<List<InjuryReportDto>?> GetDailyInjuryReportAsync(string date)
    {
        // The RapidAPI URL structure from your snippet
        var url = $"https://nba-injuries-reports.p.rapidapi.com/injuries/nba/{date}";

        var request = new HttpRequestMessage
        {
            Method = HttpMethod.Get,
            RequestUri = new Uri(url),
            Headers =
        {
            { "x-rapidapi-key", _configuration["RapidAPI:Key"] },
            { "x-rapidapi-host", _configuration["RapidAPI:Host"] },
        },
        };

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<InjuryReportDto>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    public async Task<PlayerStatsDto?> GetPlayerCareerStatsAsync(string playerId)
    {
        return null;
    }
}