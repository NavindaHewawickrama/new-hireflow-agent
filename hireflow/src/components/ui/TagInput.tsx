import { useRef, useState, type KeyboardEvent } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

/**
 * "Add on Enter" tag input, ported from the original setupTagInput /
 * renderTags / removeTag trio. Local `draftValue` (the text currently being
 * typed) stays as component state since nothing outside this component
 * needs it — only the committed `tags` array is lifted up via onChange.
 */
export function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const [draftValue, setDraftValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && draftValue.trim()) {
      e.preventDefault();
      onChange([...tags, draftValue.trim()]);
      setDraftValue("");
    }
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  return (
    <div
      className="flex min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded border border-border2 bg-surface2 p-2 transition-colors focus-within:border-accent"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="flex items-center gap-1 rounded-sm border border-border2 bg-surface3 px-2 py-0.5 text-[11px] text-text"
        >
          {tag}
          <span
            className="cursor-pointer text-sm leading-none text-muted2 hover:text-danger"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(i);
            }}
          >
            ×
          </span>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={draftValue}
        onChange={(e) => setDraftValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-w-[80px] flex-1 border-none bg-transparent text-xs text-text outline-none placeholder:text-muted2"
      />
    </div>
  );
}
