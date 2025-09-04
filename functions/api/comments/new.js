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
    const { author, comment, likes, date_added, reviewer_id } = body;

    if (!author || !comment || typeof likes !== 'number' || !date_added) {
        return new Response(JSON.stringify({ error: 'Missing or invalid fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        console.log(`Inserting comment into database:`, { author, comment, likes, date_added, reviewer_id });
        const row = await tesseau_db.prepare(
            'INSERT INTO reviewer_comments (author, content, likes, date_added, reviewer_id) VALUES (?, ?, ?, ?, ?)'
        ).bind(author, comment, likes, date_added, parseInt(reviewer_id, 10)).run();
        const id = row.id;
        console.log(`Comment inserted with id: ${id}`);

        return new Response(JSON.stringify({ success: true, id, author, content: comment, likes, date_added, reviewer_id }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Database insertion failed'+err }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}