export async function onRequest(context) { // TODO: Be able to find comments by reviewer id and allat im fucking TIRED
    const { request, env } = context;
    const tesseau_db = env.tesseau_db;

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const body = await request.json();
    const { author, comment, likes, date_added } = body;

    if (!author || !comment || typeof likes !== 'number' || !date_added) {
        return new Response(JSON.stringify({ error: 'Missing or invalid fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const stmt = tesseau_db.prepare(
            'INSERT INTO comments (author, content, likes, date_added) VALUES (?, ?, ?, ?)'
        );
        const id = stmt.run(author, comment, likes, date_added).id;

        return new Response(JSON.stringify({ success: true, id }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Database insertion failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}