using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace HireFlow.Api.Models
{
    public class Job
    {
        public int Id { get; set; }

        [Required(ErrorMessage ="Job title is required")]
        [MaxLength(100,ErrorMessage ="Title cannot moreor less than 100 charachters")]
        public string Title { get; set; } = string.Empty;

        public string? Department { get; set; }

        [Required]
        public string Description { get; set; } = string.Empty;

        public List<string> Skills { get; set; } = new();
        public List<string> Qualifications { get; set; } = new();

        public string? SalaryRange { get; set; }
        public int Threshold { get; set; } = 60;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DeletedAt { get; set; }


        // Navigation - ignore during JSON serialization to avoid circular references
        [JsonIgnore]
        public List<Candidate> Candidates { get; set; } = new();
    }
}