using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TradeController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<TradeController> _logger;
    private readonly INotificationService _notificationService;

    public TradeController(AppDbContext context, ILogger<TradeController> logger, INotificationService notificationService)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
    }

    // Get current user's ID from JWT token
    private Guid GetCurrentUserId()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("user_id")?.Value;

        if (string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out var parsedUserId))
            throw new UnauthorizedAccessException("User ID not found");

        return parsedUserId;
    }


    [HttpPost]
    public async Task<IActionResult> CreateTrade([FromBody] CreateTradeDto request)
    {
        try
        {
            var userId = GetCurrentUserId();

            // Get the initiating team (current user's team)
            var initiatingTeam = await _context.FantasyTeams
                .FirstOrDefaultAsync(ft => ft.UserId == userId);

            if (initiatingTeam == null)
                return BadRequest("You don't have a fantasy team in this league");

            // Get the receiving team
            var receivingTeam = await _context.FantasyTeams
                .FirstOrDefaultAsync(ft => ft.Id == request.ReceivingTeamId);

            if (receivingTeam == null)
                return BadRequest("Receiving team not found");

            // Verify both teams are in the same league
            if (initiatingTeam.LeagueId != receivingTeam.LeagueId)
                return BadRequest("Teams must be in the same league");

            // Verify initiating and receiving teams are different
            if (initiatingTeam.Id == receivingTeam.Id)
                return BadRequest("Cannot trade with yourself");

            // Validate players being offered
            var offeringPlayerIds = request.ItemsOffering.Select(i => i.PlayerId).ToList();
            var offeringPlayers = await _context.FantasyRosters
                .Where(fr => fr.FantasyTeamId == initiatingTeam.Id && offeringPlayerIds.Contains(fr.PlayerId))
                .ToListAsync();

            if (offeringPlayers.Count != offeringPlayerIds.Count)
                return BadRequest("One or more players being offered are not on your team");

            // Validate players being requested
            var requestingPlayerIds = request.ItemsRequesting.Select(i => i.PlayerId).ToList();
            var requestingPlayers = await _context.FantasyRosters
                .Where(fr => fr.FantasyTeamId == receivingTeam.Id && requestingPlayerIds.Contains(fr.PlayerId))
                .ToListAsync();

            if (requestingPlayers.Count != requestingPlayerIds.Count)
                return BadRequest("One or more requested players are not on the receiving team");

            // Create the trade
            var expiryDays = request.DaysUntilExpiry > 0 ? request.DaysUntilExpiry : 3;
            var trade = new Trade
            {
                InitiatingTeamId = initiatingTeam.Id,
                ReceivingTeamId = receivingTeam.Id,
                LeagueId = initiatingTeam.LeagueId,
                Status = "pending",
                ExpiresAt = DateTime.UtcNow.AddDays(expiryDays),
                Notes = request.Notes
            };

            _context.Trades.Add(trade);
            await _context.SaveChangesAsync();

            // Add trade items
            var tradeItems = new List<TradeItem>();

            // Items being offered by initiating team
            foreach (var playerId in offeringPlayerIds)
            {
                tradeItems.Add(new TradeItem
                {
                    TradeId = trade.Id,
                    OfferingTeamId = initiatingTeam.Id,
                    PlayerId = playerId
                });
            }

            // Items being offered by receiving team
            foreach (var playerId in requestingPlayerIds)
            {
                tradeItems.Add(new TradeItem
                {
                    TradeId = trade.Id,
                    OfferingTeamId = receivingTeam.Id,
                    PlayerId = playerId
                });
            }

            _context.TradeItems.AddRange(tradeItems);
            await _context.SaveChangesAsync();

            // Notify the receiving team owner
            await _notificationService.CreateAsync(
                receivingTeam.UserId,
                "TRADE",
                $"{initiatingTeam.TeamName} has proposed a trade with your team."
            );

            return Ok(await GetTradeDto(trade.Id));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating trade");
            return StatusCode(500, "Error creating trade");
        }
    }


    [HttpGet]
    public async Task<IActionResult> GetMyTrades([FromQuery] string? status = null)
    {
        try
        {
            var userId = GetCurrentUserId();

            // Get user's teams
            var userTeams = await _context.FantasyTeams
                .Where(ft => ft.UserId == userId)
                .Select(ft => ft.Id)
                .ToListAsync();

            if (!userTeams.Any())
                return Ok(new List<TradeDto>());

            // Get trades where user is either initiating or receiving
            var query = _context.Trades
                .Where(t => userTeams.Contains(t.InitiatingTeamId) || userTeams.Contains(t.ReceivingTeamId));

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(t => t.Status == status.ToLower());
            }

            var trades = await query
                .AsNoTracking()
                .Include(t => t.InitiatingTeam)
                .Include(t => t.ReceivingTeam)
                .Include(t => t.Items)
                    .ThenInclude(ti => ti.Player)
                        .ThenInclude(p => p!.Team)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var tradeDtos = trades.Select(MapTradeToDto).ToList();

            return Ok(tradeDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user trades");
            return StatusCode(500, "Error retrieving trades");
        }
    }


    [HttpGet("{id}")]
    public async Task<IActionResult> GetTrade(int id)
    {
        try
        {
            var trade = await _context.Trades
                .AsNoTracking()
                .Include(t => t.InitiatingTeam)
                .Include(t => t.ReceivingTeam)
                .Include(t => t.Items)
                    .ThenInclude(ti => ti.Player)
                        .ThenInclude(p => p!.Team)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trade == null)
                return NotFound("Trade not found");

            return Ok(MapTradeToDto(trade));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trade");
            return StatusCode(500, "Error retrieving trade");
        }
    }


    [HttpPatch("{id:int}")]
    public async Task<IActionResult> EditTrade(int id, [FromBody] UpdateTradeDto request)
    {
        try
        {
            var userId = GetCurrentUserId();

            var trade = await _context.Trades
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trade == null)
                return NotFound(new { message = "Trade not found" });

            if (trade.Status != "pending")
                return BadRequest($"Only pending trades can be edited. Trade is {trade.Status}.");

            if (DateTime.UtcNow > trade.ExpiresAt)
                return BadRequest("This trade has expired and cannot be edited.");

            var isInitiatingManager = await _context.FantasyTeams
                .AnyAsync(ft => ft.Id == trade.InitiatingTeamId && ft.UserId == userId);

            if (!isInitiatingManager)
                return Forbid("You can only edit trades you initiated");

            trade.Notes = request.Notes;

            if (request.DaysUntilExpiry.HasValue)
            {
                if (request.DaysUntilExpiry.Value < 1 || request.DaysUntilExpiry.Value > 14)
                    return BadRequest("DaysUntilExpiry must be between 1 and 14.");

                trade.ExpiresAt = DateTime.UtcNow.AddDays(request.DaysUntilExpiry.Value);
            }

            _context.Trades.Update(trade);
            await _context.SaveChangesAsync();

            return Ok(await GetTradeDto(id));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error editing trade");
            return StatusCode(500, "Error editing trade");
        }
    }


    [HttpPost("{id:int}/accept")]
    public async Task<IActionResult> AcceptTrade(int id)
    {
        return await HandleTradeAction(id, "accept");
    }


    [HttpPost("{id:int}/decline")]
    public async Task<IActionResult> DeclineTrade(int id)
    {
        return await HandleTradeAction(id, "decline");
    }


    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> CancelTrade(int id)
    {
        return await HandleTradeAction(id, "cancel");
    }

    private async Task<IActionResult> HandleTradeAction(int id, string action)
    {
        try
        {
            var userId = GetCurrentUserId();
            var normalizedAction = action.ToLower();

            if (normalizedAction != "accept" && normalizedAction != "decline" && normalizedAction != "cancel")
                return BadRequest("Action must be 'accept', 'decline', or 'cancel'");

            var trade = await _context.Trades
                .Include(t => t.Items)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trade == null)
                return NotFound(new { message = "Trade not found" });

            if (trade.Status != "pending")
                return BadRequest($"Trade is already {trade.Status}");

            var isReceivingManager = await _context.FantasyTeams
                .AnyAsync(ft => ft.Id == trade.ReceivingTeamId && ft.UserId == userId);

            var isInitiatingManager = await _context.FantasyTeams
                .AnyAsync(ft => ft.Id == trade.InitiatingTeamId && ft.UserId == userId);

            if (normalizedAction == "cancel" && !isInitiatingManager)
                return Forbid("You can only cancel trades you initiated");

            if ((normalizedAction == "accept" || normalizedAction == "decline") && !isReceivingManager)
                return Forbid("You can only accept/decline trades as the receiving manager");

            if ((normalizedAction == "accept" || normalizedAction == "decline") && DateTime.UtcNow > trade.ExpiresAt)
            {
                trade.Status = "expired";
                trade.ResolvedAt = DateTime.UtcNow;
                _context.Trades.Update(trade);
                await _context.SaveChangesAsync();
                return BadRequest("This trade has expired");
            }

            if (normalizedAction == "accept")
            {
                // Process the trade - swap players
                var initiatingTeamId = trade.InitiatingTeamId;
                var receivingTeamId = trade.ReceivingTeamId;

                // Get all players in the trade
                var tradeItems = trade.Items.ToList();

                // Update rosters - move players
                foreach (var item in tradeItems)
                {
                    var rosterEntry = await _context.FantasyRosters
                        .FirstOrDefaultAsync(fr => fr.FantasyTeamId == item.OfferingTeamId && fr.PlayerId == item.PlayerId);

                    if (rosterEntry != null)
                    {
                        // Move player to receiving team
                        var targetTeamId = item.OfferingTeamId == initiatingTeamId ? receivingTeamId : initiatingTeamId;
                        rosterEntry.FantasyTeamId = targetTeamId;
                        _context.FantasyRosters.Update(rosterEntry);
                    }
                }

                trade.Status = "accepted";
                trade.ResolvedAt = DateTime.UtcNow;
            }
            else if (normalizedAction == "decline")
            {
                trade.Status = "declined";
                trade.ResolvedAt = DateTime.UtcNow;
            }
            else // cancel
            {
                trade.Status = "canceled";
                trade.ResolvedAt = DateTime.UtcNow;
            }

            _context.Trades.Update(trade);
            await _context.SaveChangesAsync();

            return Ok(await GetTradeDto(id));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing trade action");
            return StatusCode(500, "Error processing trade");
        }
    }


    [HttpGet("league/{leagueId}")]
    public async Task<IActionResult> GetLeagueTrades(int leagueId, [FromQuery] string? status = null)
    {
        try
        {
            var userId = GetCurrentUserId();

            // Verify user is commissioner
            var isMember = await _context.LeagueMembers
                .FirstOrDefaultAsync(lm => lm.LeagueId == leagueId && lm.UserId == userId);

            if (isMember?.Role != "commissioner")
                return Forbid("Only commissioners can view all league trades");

            var query = _context.Trades
                .Where(t => t.LeagueId == leagueId);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(t => t.Status == status.ToLower());
            }

            var trades = await query
                .AsNoTracking()
                .Include(t => t.InitiatingTeam)
                .Include(t => t.ReceivingTeam)
                .Include(t => t.Items)
                    .ThenInclude(ti => ti.Player)
                        .ThenInclude(p => p!.Team)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var tradeDtos = trades.Select(MapTradeToDto).ToList();

            return Ok(tradeDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting league trades");
            return StatusCode(500, "Error retrieving league trades");
        }
    }

    // Helper method to get a fully-loaded trade
    private async Task<Trade?> GetTradeEntity(int tradeId)
    {
        return await _context.Trades
            .AsNoTracking()
            .Include(t => t.InitiatingTeam)
            .Include(t => t.ReceivingTeam)
            .Include(t => t.Items)
            .ThenInclude(ti => ti.Player)
            .ThenInclude(p => p!.Team)
            .FirstOrDefaultAsync(t => t.Id == tradeId);
    }

    // Helper method to build TradeDto
    private static TradeDto MapTradeToDto(Trade trade)
    {
        var items = new List<TradeItemDto>();
        foreach (var item in trade.Items)
        {
            items.Add(new TradeItemDto
            {
                Id = item.Id,
                TradeId = item.TradeId,
                OfferingTeamId = item.OfferingTeamId,
                PlayerId = item.PlayerId,
                PlayerName = item.Player?.FullName,
                TeamName = item.Player?.Team?.Abbreviation,
                Position = item.Player?.Position
            });
        }

        return new TradeDto
        {
            Id = trade.Id,
            InitiatingTeamId = trade.InitiatingTeamId,
            InitiatingTeamName = trade.InitiatingTeam?.TeamName,
            ReceivingTeamId = trade.ReceivingTeamId,
            ReceivingTeamName = trade.ReceivingTeam?.TeamName,
            LeagueId = trade.LeagueId,
            Status = trade.Status,
            CreatedAt = trade.CreatedAt,
            ExpiresAt = trade.ExpiresAt,
            ResolvedAt = trade.ResolvedAt,
            Notes = trade.Notes,
            Items = items
        };
    }

    private async Task<TradeDto> GetTradeDto(int tradeId)
    {
        var trade = await GetTradeEntity(tradeId);
        return trade == null ? new TradeDto() : MapTradeToDto(trade);
    }
}
