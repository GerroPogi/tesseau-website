export async function onRequest(context) {
    const data = await context.env.tesseau_db.prepare('SELECT * from reminders where type="lt"').all();
    console.log("Data fetched:", data);
    return new Response(JSON.stringify(data.results), {
        headers: { 'Content-Type': 'application/json' },
    });
}