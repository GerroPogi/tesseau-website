export async function onRequestPost({ env, request }) {
  try {
    // --- Read body only once ---
    const body = await request.json().catch(() => ({}));
    const { admin, id, title, content, file_key, author, date_added } = body;

    // --- Authorization ---
    if (admin !== env.owner_token) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- Build SQL dynamically ---
    const fields = [];
    const values = [];

    // Use `!== undefined` so empty string ("") is allowed
    if (title !== undefined) {
      fields.push("title = ?");
      values.push(title);
    }
    if (date_added !== undefined) {
      fields.push("date_added = ?");
      values.push(date_added);
    }
    if (content !== undefined) {
      fields.push("content = ?");
      values.push(content);
    }
    if (author !== undefined) {
      fields.push("author = ?");
      values.push(author);
    }
    if (file_key !== undefined) {
      fields.push("file_key = ?");
      values.push(file_key);
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
