using System;

namespace backend;

public class PlayerStatsDto
{
    public string Resource { get; set; } = string.Empty;
    public List<ResultSet> ResultSets { get; set; } = new();
}

public class ResultSet
{
    public string Name { get; set; } = string.Empty;
    public List<string> Headers { get; set; } = new();
    public List<List<object>> RowSet { get; set; } = new();
}