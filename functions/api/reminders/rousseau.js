export async function onRequest(context) {
    const data = await context.env.tesseau_db.prepare('SELECT * from reminders where subject not in ("Earth and Space Science 1", "Finite Math 1")').all();
    console.log("Data fetched:", data);
    return new Response(JSON.stringify(data.results), {
        headers: { 'Content-Type': 'application/json' },
    });
}