using Microsoft.AspNetCore.Mvc;
using backend;

[ApiController]
[Route("api/[controller]")]
public class NbaController : ControllerBase
{
    private readonly ILivePlayerDataService _nbaService;

    public NbaController(ILivePlayerDataService nbaService)
    {
        _nbaService = nbaService;
    }

    [HttpGet("scoreboard")]
    public async Task<IActionResult> GetScoreboard()
    {
        var data = await _nbaService.GetTodaysScoreboardAsync();
        return data != null ? Ok(data) : NotFound("No games found.");
    }
}