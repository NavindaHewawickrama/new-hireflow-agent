import { Copy } from "lucide-react";
import { ModalTitle } from "../ui/Modal";
import { Button } from "../ui/Button";
import { copyToClipboard } from "../../lib/utils";

interface OfferLetterViewProps {
  candidateName: string;
  letter: string;
}

/** Displays a generated offer letter on a white "paper" surface, mirroring
 * the original .offer-letter styling (deliberately light-on-dark contrast
 * against the rest of the app, since it represents a printable document). */
export function OfferLetterView({ candidateName, letter }: OfferLetterViewProps) {
  return (
    <div>
      <ModalTitle>Offer Letter — {candidateName}</ModalTitle>
      <div className="whitespace-pre-wrap rounded bg-white px-9 py-8 font-sans text-[13px] leading-loose text-[#1a1a1a]">
        {letter}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(letter)}>
          <Copy size={14} /> Copy
        </Button>
      </div>
    </div>
  );
}
