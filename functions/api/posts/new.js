export async function onRequest({ request, env }) {
  try {
    let body = {};
    let file;

    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = {
        admin: formData.get("admin") || "",
        author: formData.get("author") || "",
        content: formData.get("content") || "",
        title: formData.get("title") || "",
      };
      file = formData.get("file");
    } else {
      body = await request.json().catch(() => ({}));
    }
    // check auth
    if (body.admin !== env.owner_token) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    // Fetch data
    const { author, content, title } = body;
    const date = new Date().toISOString();
    let fileKey = "";
    // Check file if File and size
    if (file instanceof File && file.size > 0) {
      // Create unique key for file
      fileKey = `${Date.now()}-${file.name}`;
      // Upload to R2
      await env.tesseau_r2.put(fileKey, file.stream());
    }
    // Insert into database
    await env.tesseau_db
      .prepare(
        "INSERT INTO posts (author, content, title, file_key, date_added) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(author, content, title, fileKey, date)
      .run();

    return new Response(
      JSON.stringify({ success: true, author, content, title, fileKey }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Post error", err);
    return new Response(
      JSON.stringify({ success: false, message: "Server error"+err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
