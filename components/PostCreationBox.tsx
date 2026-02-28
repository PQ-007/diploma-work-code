"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pencil, Code, BarChart3 } from "lucide-react";

type PostType = "post" | "code" | "poll";

interface PostCreationBoxProps {
  userName?: string;
  userAvatar?: string;
}

export default function PostCreationBox({
  userName = "Sarah",
  userAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
}: PostCreationBoxProps) {
  const [activeType, setActiveType] = useState<PostType>("post");

  const typeButtons: {
    type: PostType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { type: "post", label: "Post", icon: <Pencil className="h-4 w-4" /> },
    { type: "code", label: "Code", icon: <Code className="h-4 w-4" /> },
    { type: "poll", label: "Poll", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <Card className="border-border/40 p-4 mb-6">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 border border-border/40">
          <AvatarImage src={userAvatar} />
          <AvatarFallback className="text-sm font-medium">
            {userName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Input
            placeholder={`What's on your mind, ${userName}?`}
            className="bg-muted/40 border-border/40 h-10 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 ml-[52px]">
        <div className="flex items-center gap-1">
          {typeButtons.map(({ type, label, icon }) => (
            <Button
              key={type}
              variant={activeType === type ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 text-xs font-medium"
              onClick={() => setActiveType(type)}
            >
              {icon}
              {label}
            </Button>
          ))}
        </div>
        <Button size="sm" className="h-8 px-5 text-xs font-medium">
          Post
        </Button>
      </div>
    </Card>
  );
}
