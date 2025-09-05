export async function onRequestGet(context) {
  const { params, env } = context;
  const comment_id = params.id;

  try {
    const result = await env.tesseau_db
      .prepare("SELECT * FROM reviewer_comment_replies WHERE comment_id = ?")
      .bind(comment_id)
      .all();

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Reviewer not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("reply result: ", result);
    return new Response(
      JSON.stringify(result),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
