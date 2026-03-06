using backend.Models;

namespace backend.Repositories.Interfaces;

public interface IProfileRepository
{
    Task<Profile?> GetByIdAsync(Guid id);
    // Getusername
    Task<Profile?> GetByUsernameAsync(string username);
    // Createprofile
    Task<Profile?> CreateAsync(Profile profile);
    // Update profile
}