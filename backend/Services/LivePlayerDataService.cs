using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using backend.DTOs;
using Microsoft.Extensions.Configuration;
using System.Linq;

namespace backend;

public class LivePlayerDataService : ILivePlayerDataService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration? _configuration;

    public LivePlayerDataService(HttpClient httpClient, IConfiguration? configuration = null)
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

    public async Task<BoxScoreDto?> GetLiveBoxScoreAsync(string gameId)
    {
        var url = $"https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{gameId}.json";
        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<BoxScoreDto>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    public async Task<PlayerStatsDto?> GetPlayerCareerStatsAsync(string playerId)
    {
        return null;
    }

    public async Task<List<TeamDto>> GetAllTeamsAsync()
    {
        var season = GetCurrentSeason();
        var url = $"https://stats.nba.com/stats/commonteamslist?LeagueID=00&Season={season}";
        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode) return new List<TeamDto>();

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var resultSets = doc.RootElement.GetProperty("resultSets");
        var teamListSet = resultSets.EnumerateArray()
            .FirstOrDefault(rs => rs.GetProperty("name").GetString() == "CommonTeamList");

        if (teamListSet.ValueKind == JsonValueKind.Undefined)
            return new List<TeamDto>();

        var headers = teamListSet.GetProperty("headers").EnumerateArray()
            .Select(h => h.GetString()).ToList();

        int teamIdIdx    = headers.IndexOf("TEAM_ID");
        int abbrevIdx    = headers.IndexOf("ABBREVIATION");
        int nicknameIdx  = headers.IndexOf("NICKNAME");
        int cityIdx      = headers.IndexOf("CITY");

        var teams = new List<TeamDto>();
        foreach (var row in teamListSet.GetProperty("rowSet").EnumerateArray())
        {
            var cols = row.EnumerateArray().ToList();
            teams.Add(new TeamDto
            {
                TeamId       = cols[teamIdIdx].GetInt32(),
                FullName     = $"{cols[cityIdx].GetString()} {cols[nicknameIdx].GetString()}",
                Abbreviation = cols[abbrevIdx].GetString()
            });
        }

        return teams.OrderBy(t => t.FullName).ToList();
    }

    public async Task<List<PlayerDto>> GetTeamRosterAsync(int teamId)
    {
        var season = GetCurrentSeason();
        var url = $"https://stats.nba.com/stats/commonteamroster?TeamID={teamId}&Season={season}";
        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode) return new List<PlayerDto>();

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var resultSets = doc.RootElement.GetProperty("resultSets");
        var rosterSet = resultSets.EnumerateArray()
            .FirstOrDefault(rs => rs.GetProperty("name").GetString() == "CommonTeamRoster");

        if (rosterSet.ValueKind == JsonValueKind.Undefined)
            return new List<PlayerDto>();

        var headers = rosterSet.GetProperty("headers").EnumerateArray()
            .Select(h => h.GetString()).ToList();

        int playerIdIdx  = headers.IndexOf("PLAYER_ID");
        int playerIdx    = headers.IndexOf("PLAYER");
        int numIdx       = headers.IndexOf("NUM");
        int posIdx       = headers.IndexOf("POSITION");

        var players = new List<PlayerDto>();
        foreach (var row in rosterSet.GetProperty("rowSet").EnumerateArray())
        {
            var cols = row.EnumerateArray().ToList();
            players.Add(new PlayerDto
            {
                PlayerId     = cols[playerIdIdx].GetInt32(),
                FullName     = cols[playerIdx].GetString(),
                Position     = cols[posIdx].GetString(),
                JerseyNumber = cols[numIdx].GetString()
            });
        }

        return players.OrderBy(p => p.FullName).ToList();
    }

    private static string GetCurrentSeason()
    {
        var now = DateTime.UtcNow;
        int startYear = now.Month >= 10 ? now.Year : now.Year - 1;
        return $"{startYear}-{(startYear + 1) % 100:D2}";
    }
}