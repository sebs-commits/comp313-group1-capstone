using backend.Data;
using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

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
    
    public async Task<Profile?> GetByUsernameAsync(string username)
    {
        return await _dbContext.Profiles
            .FirstOrDefaultAsync(p => p.Username == username);
    }
    
    public async Task<Profile> CreateAsync(Profile profile)
    {
        _dbContext.Profiles.Add(profile);
        await _dbContext.SaveChangesAsync();
        return profile;
    }
    // TODO: UPDATE Profile
    public async Task<Profile> UpdateAsync(Profile profile)
    {
        _dbContext.Profiles.Update(profile);
        await _dbContext.SaveChangesAsync();
        return profile;
    }
}