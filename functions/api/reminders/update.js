// POST handler for /api/reminders/update
export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await request.json();
    const { id, field, value, owner_token } = body;

    if (!id || !field || typeof value === 'undefined' || !owner_token) {
        return new Response(JSON.stringify({ error: 'Missing id, field, value, or owner_token' }), { status: 400 });
    }

    // Check owner_token
    if (owner_token !== env.owner_token) {
        return new Response(JSON.stringify({ error: 'Invalid owner_token' }), { status: 403 });
    }

    try {
        // Use env.DB for D1 binding
        const sql = `UPDATE reminders SET ${field} = ? WHERE id = ?`;
        console.log(`Executing SQL: ${sql} with values: ${value}, ${id}`);
        const result = await env.tesseau_db.prepare(sql).bind(value, parseInt(id)).run();

        if (result.changes === 0) {
            return new Response(JSON.stringify({ error: 'Reminder not found' }), { status: 404 });
        }
        console.log(`Updated reminder id=${id}, set ${field}=${value}`);
        const row = await env.tesseau_db.prepare("SELECT * FROM reminders WHERE id = ?").bind(parseInt(id)).first();
        console.log("Updated row:", row);

        return new Response(JSON.stringify(Object.assign({ success: true }, row)), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Database error', details: err.message }), { status: 500 });
    }
}
