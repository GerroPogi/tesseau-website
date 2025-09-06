export async function onRequestPost(context) {
    const res = await context.request.json();
    if (res?.owner_token !== context.env.owner_token) {
        return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    const { subject, title, deadline, description, type } = res;
    const date_added = new Date().toISOString();
    const reference = res?.reference || "";
    console.log(`Received data: ${subject}, ${title}, ${deadline}, ${description}, ${type}, ${reference}`);
    const row = await context.env.tesseau_db
        .prepare("INSERT INTO reminders (subject, title, deadline, description, type, date_added, reference) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(subject, title, deadline, description, type, date_added, reference)
        .run();
    console.log(`New data has been inputed: ${subject}, ${title}, ${deadline}, ${description}, ${type}, ${reference}`);
    // Fetch the last inserted row id safely
    const insertedId  = row?.meta?.last_row_id ?? null;
    console.log(`Inserted row:`, row);
    console.log(`New reminder inserted with id=${insertedId}`);
    // Respond with the new reminder’s details
    return new Response(JSON.stringify({
        success: true,
        id: insertedId ,
        subject,
        title,
        deadline,
        description,
        type,
        date_added,
        reference
    }), {
        headers: { "Content-Type": "application/json" }
    });
}