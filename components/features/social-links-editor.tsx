"use client";

import * as React from "react";
import { LinkIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_SOCIAL_LINKS, type ActorSocialLink } from "@/lib/social-links";

type LinkDraft = ActorSocialLink & {
  id: string;
};

export function SocialLinksEditor({
  defaultLinks = [],
}: {
  defaultLinks?: ActorSocialLink[];
}) {
  const baseId = React.useId();
  const addedCountRef = React.useRef(defaultLinks.length);
  const [links, setLinks] = React.useState<LinkDraft[]>(() =>
    (defaultLinks.length > 0 ? defaultLinks : [{ url: "", title: "" }]).map(
      (link, index) => ({
        ...link,
        id: `${baseId}-${index}`,
      }),
    ),
  );

  function updateLink(id: string, key: "url" | "title", value: string) {
    setLinks((current) =>
      current.map((link) => (link.id === id ? { ...link, [key]: value } : link)),
    );
  }

  function addLink() {
    if (links.length >= MAX_SOCIAL_LINKS) return;

    addedCountRef.current += 1;
    setLinks((current) => [
      ...current,
      {
        id: `${baseId}-added-${addedCountRef.current}`,
        url: "",
        title: "",
      },
    ]);
  }

  function removeLink(id: string) {
    setLinks((current) => {
      if (current.length === 1) {
        return current.map((link) =>
          link.id === id ? { ...link, url: "", title: "" } : link,
        );
      }

      return current.filter((link) => link.id !== id);
    });
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">SNS 링크</legend>
      <div className="grid gap-3">
        {links.map((link, index) => (
          <div key={link.id} className="grid gap-2 md:grid-cols-[1.4fr_0.8fr_auto]">
            <div className="relative">
              <Label htmlFor={`${link.id}-url`} className="sr-only">
                링크 주소 {index + 1}
              </Label>
              <LinkIcon
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id={`${link.id}-url`}
                name="social_url"
                type="text"
                inputMode="url"
                value={link.url}
                onChange={(event) =>
                  updateLink(link.id, "url", event.target.value)
                }
                placeholder="https://www.instagram.com/username"
                className="pl-9"
              />
            </div>
            <div>
              <Label htmlFor={`${link.id}-title`} className="sr-only">
                링크 제목 {index + 1}
              </Label>
              <Input
                id={`${link.id}-title`}
                name="social_title"
                value={link.title}
                onChange={(event) =>
                  updateLink(link.id, "title", event.target.value)
                }
                placeholder="표시 이름"
                maxLength={48}
              />
            </div>
            <Button
              type="button"
              color="neutral" variant="ghost"
              size="icon"
              aria-label={`링크 ${index + 1} 삭제`}
              onClick={() => removeLink(link.id)}
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        color="secondary"
        size="sm"
        className="w-fit"
        disabled={links.length >= MAX_SOCIAL_LINKS}
        onClick={addLink}
      >
        <Plus aria-hidden="true" className="size-4" />
        링크 추가
      </Button>
    </fieldset>
  );
}
