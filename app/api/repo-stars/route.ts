import { NextResponse } from "next/server";

import { SITE_REPO } from "@/lib/site";

export async function GET() {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "pokegit",
    };
    const token = process.env.GITHUB_TOKEN;
    if (token && !token.startsWith("ghp_your_token")) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Always hit GitHub so starring + returning the tab updates promptly.
    const response = await fetch(
      `https://api.github.com/repos/${SITE_REPO.owner}/${SITE_REPO.name}`,
      { headers, cache: "no-store" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { stars: null, error: "upstream" },
        { status: 502 },
      );
    }

    const data = (await response.json()) as { stargazers_count?: number };
    const stars =
      typeof data.stargazers_count === "number" ? data.stargazers_count : null;

    return NextResponse.json(
      { stars },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { stars: null, error: "fetch_failed" },
      { status: 502 },
    );
  }
}
