import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const MDX_DIR = path.join(process.cwd(), "app", "article");

async function readFirstExisting(paths: string[]) {
  for (const p of paths) {
    try {
      const content = await fs.readFile(p, "utf8");
      return { content, path: p };
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
    }
  }
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }
  const candidates = [
    path.join(MDX_DIR, `${slug}.mdx`),
    path.join(MDX_DIR, slug),
  ];

  try {
    const result = await readFirstExisting(candidates);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ content: result.content });
  } catch (error) {
    console.error("Error reading MDX file", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
