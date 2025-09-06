export async function onRequest(context) {
    const data = await context.env.tesseau_db.prepare('SELECT * from reminders where subject != "Earth and Space 1" AND subject != "Finite Math 1"').all();
    return new Response(JSON.stringify(data.results), {
        headers: { 'Content-Type': 'application/json' },
    });
}