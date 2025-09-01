export async function onRequestGet(context) {
    const results = await context.env.tesseau_db.prepare("SELECT * FROM reviewers").all();
    console.log(results);
    return new Response(JSON.stringify(results.results), {
        headers: { "Content-Type": "application/json" },
    });
}