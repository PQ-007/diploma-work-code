import { NextResponse } from "next/server";

const MESSAGE =
  "Milestone management has been retired from the showcase module.";

export async function POST() {
  return NextResponse.json({ error: MESSAGE }, { status: 410 });
}

export async function PUT() {
  return NextResponse.json({ error: MESSAGE }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ error: MESSAGE }, { status: 410 });
}
