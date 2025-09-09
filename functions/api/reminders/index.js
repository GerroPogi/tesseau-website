export async function onRequest(context) {
    const data = await context.env.tesseau_db.prepare('SELECT * from reminders where type!="cpe"').all();
    console.log("data", data);
    return new Response(JSON.stringify(data.results) , {
        headers: { 'Content-Type': 'application/json' },
    });
}