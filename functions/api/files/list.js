// api/files/list.js
export async function onRequest(context) {
  const { env, request } = context;

  try {
    const listResult = await env.tesseau_r2.list();

    // Build a base URL for your worker (protocol + host)
    const origin = new URL(request.url).origin;

    const files = listResult.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      contentType: obj.httpMetadata?.contentType || null,
      url: `${origin}/api/files/${encodeURIComponent(obj.key)}`, // direct link
    }));

    return new Response(JSON.stringify({ success: true, files }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error listing files:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
