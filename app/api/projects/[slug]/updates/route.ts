import { NextResponse } from "next/server";

const MESSAGE = "Project updates are no longer managed in showcase mode.";

export async function GET() {
  return NextResponse.json({ error: MESSAGE }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: MESSAGE }, { status: 410 });
}

export async function PUT() {
  return NextResponse.json({ error: MESSAGE }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ error: MESSAGE }, { status: 410 });
}
