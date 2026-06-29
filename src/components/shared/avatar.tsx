import { cn } from "@/lib/utils";
import type { Member } from "@/types/domain";

function initials(name: string): string {
  const cleaned = name.replace(/\s+/g, "");
  return cleaned.slice(0, 1);
}

const SIZES = { sm: 24, md: 28, lg: 36 } as const;

export function Avatar({
  member,
  size = "md",
  className,
}: {
  member: Pick<Member, "name" | "color" | "avatarUrl">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full text-white font-semibold ring-2 ring-white shrink-0",
        className,
      )}
      style={{
        width: px,
        height: px,
        backgroundColor: member.color,
        fontSize: px * 0.42,
      }}
      title={member.name}
      aria-label={member.name}
    >
      {initials(member.name)}
    </span>
  );
}

export function AvatarGroup({
  members,
  max = 3,
  size = "md",
}: {
  members: Pick<Member, "id" | "name" | "color" | "avatarUrl">[];
  max?: number;
  size?: keyof typeof SIZES;
}) {
  const shown = members.slice(0, max);
  const rest = members.length - shown.length;
  const px = SIZES[size];
  return (
    <div className="flex items-center">
      {shown.map((m, i) => (
        <span key={m.id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i }}>
          <Avatar member={m} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-surface-muted text-ink-soft font-semibold ring-2 ring-white"
          style={{ width: px, height: px, marginLeft: -8, fontSize: px * 0.38 }}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
