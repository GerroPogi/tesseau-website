export async function onRequestPost(context) {
    const { request, env } = context;
    const { id, owner_token } = await request.json();
    if (!owner_token || owner_token !== env.owner_token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    if (!id) {
        return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });
    }
    const data = await env.tesseau_db.prepare("SELECT * FROM reminders WHERE id = ?").bind(id).first();
    console.log(data)
    const deleted = await env.tesseau_db.prepare("DELETE FROM reminders WHERE id = ?").bind(id).run();



    if (deleted.success) {
        return new Response(JSON.stringify({ success: true, ...data }), { status: 200 });
    } else {
        return new Response(JSON.stringify({ error: "Delete failed" }), { status: 500 });
    }
}