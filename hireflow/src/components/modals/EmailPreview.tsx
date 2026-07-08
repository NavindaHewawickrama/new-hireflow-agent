import { Copy } from "lucide-react";
import { ModalTitle } from "../ui/Modal";
import { Button } from "../ui/Button";
import { copyToClipboard } from "../../lib/utils";

interface EmailPreviewProps {
  candidateName: string;
  jobTitle: string;
  round: "r1" | "r2";
}

/** Renders a fake (never actually sent) interview-invite email, matching
 * the original showEmailModal() template. */
export function EmailPreview({ candidateName, jobTitle, round }: EmailPreviewProps) {
  const roundLabel = round === "r1" ? "First Round" : "Second Round";

  const bodyText = `Dear ${candidateName},

Thank you for your interest in the ${jobTitle} position at Acme Corp. We were impressed by your background and would like to invite you to a ${roundLabel} interview.

Please use the link below to select a time that works best for you:
[SCHEDULING LINK]

The interview will be approximately 60 minutes and will cover your experience, technical background, and cultural fit with our team.

If you have any questions, please don't hesitate to reach out.

Best regards,
HR Team
Acme Corp
hr@acmecorp.com`;

  const fullEmail = `To: ${candidateName} <candidate@email.com>
From: hr@acmecorp.com
Subject: Interview Invitation — ${jobTitle} (${roundLabel})

---

${bodyText}`;

  return (
    <div>
      <ModalTitle>Simulated Email — {roundLabel} Invite</ModalTitle>
      <div className="rounded border border-border bg-surface2 p-3.5 px-4 font-mono text-[11px] leading-relaxed text-muted">
        <div className="mb-2.5 border-b border-border pb-2.5">
          <p>
            <strong className="text-text">To:</strong> {candidateName} &lt;candidate@email.com&gt;
          </p>
          <p>
            <strong className="text-text">From:</strong> hr@acmecorp.com
          </p>
          <p>
            <strong className="text-text">Subject:</strong> Interview Invitation — {jobTitle} (
            {roundLabel})
          </p>
        </div>
        <div className="whitespace-pre-wrap text-text">{bodyText}</div>
      </div>
      <p className="mt-2 font-mono text-[10px] text-muted">⚠ Simulated — not actually sent</p>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(fullEmail)}>
          <Copy size={14} /> Copy
        </Button>
      </div>
    </div>
  );
}
