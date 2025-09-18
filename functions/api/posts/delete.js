export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    let body = await request.json();

    if (body.admin !== env.owner_token) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    // Fetch data
    const { id } = body;

    // Get data from server before deleting
    const { author, content, title, fileKey } = await env.tesseau_db
      .prepare("SELECT * from posts WHERE id = ?")
      .bind(id)
      .first();

    await env.tesseau_db
      .prepare("DELETE FROM posts WHERE id = ?")
      .bind(id)
      .run();

    return new Response(
      JSON.stringify({ success: true, author, content, title, fileKey }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Post error", err);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" + err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
