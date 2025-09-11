export async function onRequest(context) {
  const { params, env } = context;
  const key = params.key; // comes from the URL /api/files/:key

  if (!key) {
    return new Response("Missing key", { status: 400 });
  }

  try {
    // Get file from R2
    const object = await env.tesseau_r2.get(key);

    if (!object) {
      return new Response("File not found", { status: 404 });
    }

    // Stream file to client with correct headers
    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
        "Content-Length": object.size,
        "Cache-Control": "public, max-age=31536000", // cache for 1 year
      },
    });
  } catch (err) {
    console.error("Error retrieving file:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
