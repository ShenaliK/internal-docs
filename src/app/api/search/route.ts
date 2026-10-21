import { NextRequest, NextResponse } from "next/server";
import { searchDocumentation } from "@/server/services/search-service";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  if (!query.trim()) {
    return NextResponse.json(
      { error: "Search query is required." },
      { status: 400 }
    );
  }

  if (query.length > 200) {
    return NextResponse.json(
      { error: "Search query must be 200 characters or fewer." },
      { status: 400 }
    );
  }

  try {
    const results = await searchDocumentation(query);

    return NextResponse.json({
      query: query.trim(),
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Documentation search failed:", error);

    return NextResponse.json(
      { error: "Unable to search documentation." },
      { status: 500 }
    );
  }
}