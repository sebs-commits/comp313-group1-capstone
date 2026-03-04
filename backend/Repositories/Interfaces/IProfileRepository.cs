using backend.Models;

namespace backend.Repositories.Interfaces;

public interface IProfileRepository
{
    Task<Profile?> GetByIdAsync(Guid id);
}