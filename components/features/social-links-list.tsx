import { LinkIcon } from "lucide-react";
import type { ActorSocialLink } from "@/lib/social-links";

export function SocialLinksList({ links }: { links: ActorSocialLink[] }) {
  if (links.length === 0) return null;

  return (
    <ul className="grid gap-2">
      {links.map((link) => {
        return (
          <li key={`${link.url}-${link.title}`}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer noopener nofollow"
              aria-label={`${link.title} 링크 열기`}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <LinkIcon aria-hidden="true" className="size-4 text-muted-foreground" />
              <span className="min-w-0 truncate">{link.title}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
