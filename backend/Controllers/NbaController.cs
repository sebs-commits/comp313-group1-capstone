using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;     
using backend.Models;   


namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NbaController : ControllerBase
    {
        private readonly ILivePlayerDataService _nbaService;
        private readonly AppDbContext _context;

        public NbaController(ILivePlayerDataService nbaService, AppDbContext context)
        {
            _nbaService = nbaService;
            _context = context;
        }

        [HttpGet("scoreboard")]
        public async Task<IActionResult> GetScoreboard()
        {
            var data = await _nbaService.GetTodaysScoreboardAsync();
            return data != null ? Ok(data) : NotFound("No games found.");
        }

        [HttpGet("leagues")]
        public async Task<ActionResult<IEnumerable<NbaLeague>>> GetLeagues()
        {
            var leagues = await _context.Leagues.ToListAsync();
            return Ok(leagues);
        }
    }
}