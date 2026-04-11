using backend.Data;
using backend.DTOs;
using backend.Hubs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/draft")]
public class DraftController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<DraftHub> _hub;

    public DraftController(AppDbContext context, IHubContext<DraftHub> hub)
    {
        _context = context;
        _hub = hub;
    }

    [HttpGet("{leagueId:int}")]
    public async Task<ActionResult<DraftStateDto>> GetDraftState(int leagueId)
    {
        var session = await LoadSession(leagueId);
        if (session is null)
            return NotFound("No draft session found for this league.");

        return Ok(BuildStateDto(session));
    }

    [HttpPost("{leagueId:int}/initialize")]
    public async Task<ActionResult<DraftStateDto>> Initialize(int leagueId)
    {
        var userId = GetUserId();
        if (!await IsCommissioner(leagueId, userId))
            return Forbid();

        var league = await _context.Leagues.FindAsync(leagueId);
        if (league is null)
            return NotFound("League not found.");

        var teams = await _context.FantasyTeams
            .Where(ft => ft.LeagueId == leagueId)
            .ToListAsync();

        if (teams.Count < 2)
            return BadRequest("At least 2 teams are required to start a draft.");

        var existing = await _context.DraftSessions.FirstOrDefaultAsync(ds => ds.LeagueId == leagueId);
        if (existing is not null)
        {
            _context.DraftSessions.Remove(existing);
            await _context.SaveChangesAsync();
        }

        var shuffled = teams.OrderBy(_ => Guid.NewGuid()).ToList();

        var session = new DraftSession
        {
            LeagueId = leagueId,
            Status = "pending",
            CurrentPick = 0,
            TotalPicks = league.RosterSize * teams.Count
        };

        _context.DraftSessions.Add(session);
        await _context.SaveChangesAsync();

        for (int i = 0; i < shuffled.Count; i++)
        {
            _context.DraftOrders.Add(new DraftOrder
            {
                DraftSessionId = session.Id,
                FantasyTeamId = shuffled[i].Id,
                PickPosition = i + 1
            });
        }

        await _context.SaveChangesAsync();

        var loaded = await LoadSession(leagueId);
        var state = BuildStateDto(loaded!);

        await _hub.Clients.Group($"draft-{leagueId}").SendAsync("DraftStateUpdated", state);

        return Ok(state);
    }

    [HttpPost("{leagueId:int}/start")]
    public async Task<ActionResult<DraftStateDto>> Start(int leagueId)
    {
        var userId = GetUserId();
        if (!await IsCommissioner(leagueId, userId))
            return Forbid();

        var session = await LoadSession(leagueId);
        if (session is null)
            return NotFound("Draft has not been initialized.");

        if (session.Status != "pending")
            return BadRequest("Draft is not in a pending state.");

        session.Status = "active";
        session.StartedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var state = BuildStateDto(session);
        await _hub.Clients.Group($"draft-{leagueId}").SendAsync("DraftStateUpdated", state);

        return Ok(state);
    }

    [HttpPost("{leagueId:int}/pick")]
    public async Task<ActionResult<DraftStateDto>> MakePick(int leagueId, MakePickDto dto)
    {
        var userId = GetUserId();

        var session = await LoadSession(leagueId);
        if (session is null)
            return NotFound("Draft has not been initialized.");

        if (session.Status != "active")
            return BadRequest("The draft is not currently active.");

        var ordered = session.DraftOrder.OrderBy(o => o.PickPosition).ToList();
        var currentTeamEntry = GetCurrentTeamEntry(ordered, session.CurrentPick);

        var userTeam = await _context.FantasyTeams
            .FirstOrDefaultAsync(ft => ft.LeagueId == leagueId && ft.UserId == userId);

        if (userTeam is null || userTeam.Id != currentTeamEntry.FantasyTeamId)
            return BadRequest("It is not your turn to pick.");

        var alreadyPicked = await _context.FantasyRosters
            .AnyAsync(fr => fr.PlayerId == dto.PlayerId && fr.FantasyTeam!.LeagueId == leagueId);

        if (alreadyPicked)
            return Conflict("This player has already been drafted.");

        var player = await _context.NbaPlayers.FindAsync(dto.PlayerId);
        if (player is null)
            return NotFound("Player not found.");

        int n = ordered.Count;
        int round = session.CurrentPick / n;

        _context.DraftPicks.Add(new DraftPick
        {
            DraftSessionId = session.Id,
            FantasyTeamId = currentTeamEntry.FantasyTeamId,
            PlayerId = dto.PlayerId,
            Round = round + 1,
            PickNumber = session.CurrentPick + 1
        });

        _context.FantasyRosters.Add(new FantasyRoster
        {
            FantasyTeamId = currentTeamEntry.FantasyTeamId,
            PlayerId = dto.PlayerId
        });

        session.CurrentPick++;

        if (session.CurrentPick >= session.TotalPicks)
        {
            session.Status = "completed";
            session.CompletedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        var loaded = await LoadSession(leagueId);
        var state = BuildStateDto(loaded!);

        await _hub.Clients.Group($"draft-{leagueId}").SendAsync("DraftStateUpdated", state);

        return Ok(state);
    }

    private async Task<DraftSession?> LoadSession(int leagueId)
    {
        return await _context.DraftSessions
            .Include(ds => ds.DraftOrder)
                .ThenInclude(o => o.FantasyTeam)
            .Include(ds => ds.Picks)
                .ThenInclude(p => p.FantasyTeam)
            .Include(ds => ds.Picks)
                .ThenInclude(p => p.Player)
            .FirstOrDefaultAsync(ds => ds.LeagueId == leagueId);
    }

    private static DraftOrder GetCurrentTeamEntry(List<DraftOrder> ordered, int currentPick)
    {
        int n = ordered.Count;
        int round = currentPick / n;
        int posInRound = currentPick % n;
        int index = round % 2 == 0 ? posInRound : n - 1 - posInRound;
        return ordered[index];
    }

    private static DraftStateDto BuildStateDto(DraftSession session)
    {
        var ordered = session.DraftOrder.OrderBy(o => o.PickPosition).ToList();
        int n = ordered.Count;

        DraftTeamDto? currentTeam = null;
        int currentRound = 0;
        int currentPickInRound = 0;

        if (session.Status == "active" && n > 0)
        {
            currentRound = session.CurrentPick / n;
            currentPickInRound = session.CurrentPick % n;
            var entry = GetCurrentTeamEntry(ordered, session.CurrentPick);
            currentTeam = new DraftTeamDto
            {
                TeamId = entry.FantasyTeamId,
                TeamName = entry.FantasyTeam!.TeamName,
                UserId = entry.FantasyTeam.UserId,
                PickPosition = entry.PickPosition
            };
        }

        return new DraftStateDto
        {
            SessionId = session.Id,
            LeagueId = session.LeagueId,
            Status = session.Status,
            CurrentPick = session.CurrentPick,
            TotalPicks = session.TotalPicks,
            CurrentRound = currentRound + 1,
            CurrentPickInRound = currentPickInRound + 1,
            CurrentTeam = currentTeam,
            DraftOrder = ordered.Select(o => new DraftTeamDto
            {
                TeamId = o.FantasyTeamId,
                TeamName = o.FantasyTeam!.TeamName,
                UserId = o.FantasyTeam.UserId,
                PickPosition = o.PickPosition
            }).ToList(),
            Picks = session.Picks.OrderBy(p => p.PickNumber).Select(p => new DraftPickDto
            {
                PickNumber = p.PickNumber,
                Round = p.Round,
                TeamId = p.FantasyTeamId,
                TeamName = p.FantasyTeam!.TeamName,
                PlayerId = p.PlayerId,
                PlayerName = p.Player?.FullName ?? string.Empty,
                PlayerPosition = p.Player?.Position,
                PickedAt = p.PickedAt
            }).ToList()
        };
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }

    private async Task<bool> IsCommissioner(int leagueId, Guid userId)
    {
        return await _context.LeagueMembers
            .AnyAsync(lm => lm.LeagueId == leagueId && lm.UserId == userId && lm.Role == "commissioner");
    }
}
