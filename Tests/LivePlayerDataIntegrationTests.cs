using Xunit;
using Xunit.Abstractions;
using backend;

namespace Tests;

public class LivePlayerDataIntegrationTests
{
    private readonly ITestOutputHelper _output;

    public LivePlayerDataIntegrationTests(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task GetScoreboard_ShouldReturnData()
    {
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");

        var service = new LivePlayerDataService(client);
        var result = await service.GetTodaysScoreboardAsync();

        Assert.NotNull(result);

        foreach (var game in result.Scoreboard.Games)
        {
            _output.WriteLine($"GAME: {game.AwayTeam.TeamName} @ {game.HomeTeam.TeamName}");
        }
    }
}