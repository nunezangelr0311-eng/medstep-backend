// api/mcp/route.js

import { NextResponse } from "next/server";

// Lista de tools disponibles para ChatGPT
const tools = [
  {
    name: "analyze_nbme",
    description: "Analyze NBME input JSON",
    parameters: {
      type: "object",
      properties: {
        json: { type: "string" }
      },
      required: ["json"]
    }
  },
  {
    name: "generate_plan",
    description: "Generate a 30-day plan",
    parameters: {
      type: "object",
      properties: {
        json: { type: "string" }
      },
      required: ["json"]
    }
  },
  {
    name: "save_state",
    description: "Save updated student state",
    parameters: {
      type: "object",
      properties: {
        json: { type: "string" }
      },
      required: ["json"]
    }
  }
];

// GET → ChatGPT carga tools
export async function GET() {
  return NextResponse.json({
    mcp: "MedStep Engine",
    tools
  });
}

// POST → ChatGPT envía commands
export async function POST(req) {
  try {
    const body = await req.json();

    return NextResponse.json({
      ok: true,
      received: body
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
