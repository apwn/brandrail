/** RETIRED: the unverified email-claim flow. It let anyone attach any email to
 * a workspace with zero proof of ownership — a backdoor around verification.
 * Sign-in is /api/auth/magic-link → /api/auth/verify now. */
export async function POST() {
  return Response.json(
    { error: "this sign-in flow was replaced by magic links — POST /api/auth/magic-link with {email}" },
    { status: 410 },
  );
}
