import { NextResponse } from "next/server";
import { getUsuarioAutenticado } from "@/lib/auth";

export async function GET() {
  const usuario = await getUsuarioAutenticado();
  return NextResponse.json({ usuario });
}
