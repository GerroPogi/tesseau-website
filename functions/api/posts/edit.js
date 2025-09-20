export async function onRequestPost({ env, request }) {
  try {
    // --- Authorization ---
    const { admin } = await request.json().catch(() => ({}));
    if (admin !== env.owner_token) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { id, title, content, fileKey } = body;
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- Build SQL dynamically ---
    const fields = [];
    const values = [];

    if (title) {
      fields.push("title = ?");
      values.push(title);
    }
    if (content) {
      fields.push("content = ?");
      values.push(content);
    }
    if (fileKey) {
      fields.push("file_key = ?");
      values.push(fileKey);
    }

    if (!fields.length) {
      return new Response(
        JSON.stringify({ success: false, message: "No fields to update" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sql = `UPDATE posts SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    const result = await env.tesseau_db
      .prepare(sql)
      .bind(...values)
      .run();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, message: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
