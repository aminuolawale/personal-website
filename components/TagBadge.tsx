import { tagColorClass } from "@/lib/tag-colors";

interface TagBadgeProps {
  tag: string;
  colorMap: Record<string, string>;
}

export default function TagBadge({ tag, colorMap }: TagBadgeProps) {
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border rounded-sm ${tagColorClass(tag, colorMap)}`}
    >
      {tag}
    </span>
  );
}
