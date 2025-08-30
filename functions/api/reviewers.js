// Get reviewers from the database

export async function onRequestPost(context) {
    const data = await context.request.json();
    const { creator, reviewer, title, subject, description } = data;
    const date_added = new Date().toISOString();
    const rating=0;
    const status=1; // 0 means pending, 1 means approved TODO: change this later to 0
    console.log(`Received data: ${creator}, ${reviewer}, ${title}, ${subject}, ${description}`);
    await context.env.tesseau_db
        .prepare("INSERT INTO reviewers (creator, reviewer,date_added, title, subject, description, rating, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(creator, reviewer,date_added, title, subject, description, rating, status)
        .run();
    console.log(`New data has been inputed: ${creator}, ${reviewer}, ${title}, ${subject}, ${description}`);
    
    return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
    });
}

export async function onRequestGet(context) {
    console.log("Fetching reviewers...");
    const results = await context.env.tesseau_db.prepare("SELECT * FROM reviewers").all();
    console.log(`Fetched ${results.length} reviewers.`);
    return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" },
    });
}
