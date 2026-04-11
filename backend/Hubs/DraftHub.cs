using Microsoft.AspNetCore.SignalR;

namespace backend.Hubs;

public class DraftHub : Hub
{
    public async Task JoinDraft(string leagueId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"draft-{leagueId}");
    }

    public async Task LeaveDraft(string leagueId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"draft-{leagueId}");
    }
}
