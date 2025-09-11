export async function onRequest(context) {
  const { request, env } = context;

  // Handle FormData if it’s a file upload, else JSON
  let body, file = null;
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const formData = await request.formData();
    body = {
      admin: formData.get("admin"),
      author: formData.get("author"),
      content: formData.get("content"),
      title: formData.get("title"),
    };
    file = formData.get("file"); // optional file
  } else {
    body = await request.json();
  }

  // Admin token check
  if (body.admin !== env.owner_token) {
    return new Response(
      JSON.stringify({ success: false, message: "Unauthorized" }),
      { headers: { "Content-Type": "application/json" }, status: 401 }
    );
  }

  const { author, content, title } = body;
  const date = new Date().toISOString();
  let fileKey = null;

  // If a file was uploaded, store it in R2
  if (file) {
    fileKey = `${Date.now()}-${file.name}`;
    await env.tesseau_r2.put(fileKey, file.stream());
  } else {
    fileKey = "";
  }

  // Insert into D1 database
  const data = await env.tesseau_db
    .prepare("INSERT INTO posts (author, content, title, file_key, date_added) VALUES (?, ?, ?, ?, ?)")
    .bind(author, content, title, fileKey, date)
    .run();

  const id = data.meta.last_row_id;

  return new Response(
    JSON.stringify({ success: true, id, author, content, title, fileKey }),
    { headers: { "Content-Type": "application/json" } }
  );
}
