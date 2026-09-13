import { NextResponse } from "next/server";
import { runChecks } from "../../../lib/checks";

function normalizeUrl(input) {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  return url;
}

export async function POST(request) {
  const { url } = await request.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Enter a URL to scan." }, { status: 400 });
  }

  const target = normalizeUrl(url);

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
  }

  try {
    const res = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "header-scan/1.0 (+security header checker)",
      },
      signal: AbortSignal.timeout(10000),
    });

    const result = runChecks(res.headers, res.url || parsed.toString());

    return NextResponse.json({
      target: res.url || parsed.toString(),
      status: res.status,
      ...result,
    });
  } catch (err) {
    const message =
      err.name === "TimeoutError"
        ? "The site took too long to respond."
        : "Couldn't reach that URL. Check it's correct and publicly accessible.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
