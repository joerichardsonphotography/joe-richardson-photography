import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Prismic calls this URL (configured as a webhook in the repo's settings)
 * whenever content is published, unpublished, or a scheduled release goes
 * live. It clears the "prismic" cache tag that every Prismic fetch in this
 * app is tagged with (see src/prismicio.ts), so the next request rebuilds
 * that page with fresh content instead of serving the indefinitely cached
 * version from `cache: "force-cache"`.
 *
 * Protected by a shared secret (PRISMIC_WEBHOOK_SECRET) so only Prismic's
 * webhook — not anyone who finds the URL — can trigger revalidation.
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!process.env.PRISMIC_WEBHOOK_SECRET) {
    return NextResponse.json(
      { message: "PRISMIC_WEBHOOK_SECRET is not configured on the server." },
      { status: 500 },
    );
  }

  if (secret !== process.env.PRISMIC_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Invalid secret." }, { status: 401 });
  }

  revalidateTag("prismic", "max");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
