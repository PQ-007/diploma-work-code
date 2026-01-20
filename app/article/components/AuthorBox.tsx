import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, Github, Twitter } from "lucide-react";
import Link from "next/link";

type Props = {
  author: {
    name: string;
    avatar: string;
    verified?: boolean;
    role: string;
    username: string;
    bio: string;
    twitter?: string;
    github?: string;
  };
};

export default function AuthorBox({ author }: Props) {
  const profileHref = author.username
    ? `/profile/${author.username.replace(/^@/, "")}`
    : "";

  return (
    <Card className="p-6  bg-muted/30 border-primary/20">
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src={author.avatar} />
          <AvatarFallback>{author.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h3 className="text-xl font-bold flex items-center gap-2">
            {author.name}
            {author.verified && (
              <Check className="w-4 h-4 text-primary fill-primary/20" />
            )}
          </h3>
          <p className="text-sm text-primary font-medium">{author.role}</p>
          <p className="text-xs text-muted-foreground">{author.username}</p>
          <div className="pt-1">
            <Button
              asChild={Boolean(profileHref)}
              variant="default"
              size="sm"
              className="gap-2"
              disabled={!profileHref}
              aria-label="Follow author"
            >
              {profileHref ? (
                <Link href={profileHref}>Follow</Link>
              ) : (
                <span>Follow</span>
              )}
            </Button>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {author.bio || "This author has not added a bio yet."}
      </p>
      <div className="flex gap-3">
        {author.twitter && (
          <a
            href={`https://twitter.com/${author.twitter}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-blue-400 border-blue-400 hover:bg-blue-50/50"
            >
              <Twitter className="w-4 h-4" />
              Follow
            </Button>
          </a>
        )}
        {author.github && (
          <a
            href={`https://github.com/${author.github}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-foreground/80 hover:bg-muted"
            >
              <Github className="w-4 h-4" />
              GitHub
            </Button>
          </a>
        )}
      </div>
    </Card>
  );
}
