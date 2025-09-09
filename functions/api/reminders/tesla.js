export async function onRequest(context) {
    console.log("Fetching reminders for Tesla section");
    const data = await context.env.tesseau_db.prepare('SELECT * from reminders where subject != "Intro to Philosophy" and type!="cpe"').all();
    console.log("Data fetched:", data);
    return new Response(JSON.stringify(data.results), {
        headers: { 'Content-Type': 'application/json' },
    });
}