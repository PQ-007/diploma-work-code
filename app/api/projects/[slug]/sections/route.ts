import { NextResponse } from "next/server";

const MESSAGE = "Section editing has been retired from showcase mode.";

export async function PUT() {
  return NextResponse.json({ error: MESSAGE }, { status: 410 });
}
