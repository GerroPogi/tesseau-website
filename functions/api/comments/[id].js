export async function onRequestGet(context) {
  const { params, env } = context;
  const reviewerId = params.id;

  try {
    const result = await env.tesseau_db
      .prepare("SELECT * FROM reviewer_comments WHERE reviewer_id = ?")
      .bind(reviewerId)
      .all();

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Reviewer not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

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
