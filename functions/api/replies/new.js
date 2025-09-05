export async function onRequest(context) { 
    const { request, env } = context;
    const tesseau_db = env.tesseau_db;

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const body = await request.json();
    const { author, content, likes, date_added, comment_id } = body;

    if (!author || !content || typeof likes !== 'number' || !date_added || !comment_id) {
        return new Response(JSON.stringify({ error: 'Missing or invalid fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }   

    try {
        console.log(`Inserting comment into database:`, { author, content, likes, date_added, comment_id });
        const row = await tesseau_db.prepare(
            'INSERT INTO reviewer_comment_replies (author, content, likes, date_added, comment_id) VALUES (?, ?, ?, ?, ?)'
        ).bind(author, content, likes, date_added, parseInt(comment_id)).run();
        const id = row.meta.last_row_id;
        console.log(`Comment inserted with id: ${id}`);

        return new Response(JSON.stringify({ success: true, id, author, content: content, likes, date_added, comment_id }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Database insertion failed '+err }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}