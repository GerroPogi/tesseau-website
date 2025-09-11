// api/posts/upload.js
export async function onRequest(context) {
    const { request, env } = context;
    const formData = await request.formData();
    const admin = formData.get("admin");
    const file = formData.get("file");

    if (admin !== env.owner_token) {
        return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
        headers: { "Content-Type": "application/json" },
        status: 401,
        });
    }

    if (!file) {
        return new Response(JSON.stringify({ success: false, message: "No file provided" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
        });
    }

    const fileKey = `${Date.now()}-${file.name}`;
    await env.tesseau_r2.put(fileKey, file.stream(), {
        httpMetadata: { contentType: file.type },
    });

    return new Response(
        JSON.stringify({
        success: true,
        url: `/api/files/${fileKey}`,
        fileKey,
        }),
        { headers: { "Content-Type": "application/json" } }
    );
}
