using backend.Data;
using backend.Models;
using backend.Repositories.Interfaces;

namespace backend.Repositories;

public class ProfileRepository : IProfileRepository
{
    private readonly AppDbContext _dbContext;
    
    public ProfileRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Profile?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Profiles.FindAsync(id);
    }
    // TODO: GET username
    // TODO: Create, Update
}