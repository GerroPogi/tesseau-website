export async function onRequestPost(context) {
    const data = await context.request.json();
    const { creator, reviewer, title, subject, description } = data;
    const date_added = new Date().toISOString();
    const rating=0;
    const status=1; // 0 means pending, 1 means approved TODO: change this later to 0
    console.log(`Received data: ${creator}, ${reviewer}, ${title}, ${subject}, ${description}`);
    const row = await context.env.tesseau_db
        .prepare("INSERT INTO reviewers (creator, reviewer,date_added, title, subject, description, rating, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(creator, reviewer,date_added, title, subject, description, rating, status)
        .run();
    console.log(`New data has been inputed: ${creator}, ${reviewer}, ${title}, ${subject}, ${description}`);
     // Fetch the last inserted row id
    const insertedId  = row?.id;
    

    console.log(`New reviewer inserted with id=${insertedId}`);

    // Respond with the new reviewer’s details
    return new Response(JSON.stringify({
        success: true,
        id: insertedId ,
        title,
        creator,
        subject,
        description,
        date_added
    }), {
        headers: { "Content-Type": "application/json" }
    });
}