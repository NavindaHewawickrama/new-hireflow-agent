using System.Text.Json.Serialization;

namespace HireFlow.Api.Models
{
    public class Candidate
    {
        public int Id { get; set; }

        public int JobId {  get; set; }

        // Ignore navigation property during JSON serialization
        [JsonIgnore]
        public Job Job { get; set; } = null!;

        public string FileName { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string CVText {  get; set; } = string.Empty;

        public int? Score {  get; set; }
        public string? Reason {  get; set; }
        public List<string> Strengths { get; set; } = new();
        public List<string> Gaps { get; set; } = new();

        public string Status { get; set; } = "uploaded";

        public string? R1Score {  get; set; }
        public string?R2Score { get; set; }
        public string? OfferLetter { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DeletedAt { get; set; }
    }
}
