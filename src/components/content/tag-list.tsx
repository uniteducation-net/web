import { cn } from "@/lib/utils";

interface TagListProps {
  tags?: string[];
  className?: string;
}

const TagList = ({ tags, className }: TagListProps) => {
  if (!tags?.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
};

export { TagList };
