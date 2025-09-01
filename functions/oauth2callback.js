export async function onRequest(context) {
  const url = new URL(context.request.url);
    const code = url.searchParams.get("code");

  if (!code) {
    return new Response("No code received", { status: 400 });
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: context.env.GOOGLE_CLIENT_ID,
      client_secret: context.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: "https://tesseau.pages.dev/oauth2callback",
      grant_type: "authorization_code",
    }),
  });

  const data = await tokenRes.json();

  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
