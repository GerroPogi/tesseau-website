export async function onRequestPost(context) {
    const res = await context.request.json();
    if (res?.owner_token !== context.env.owner_token) {
        return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    const { subject, title, deadline, description, type, fileKeys: fileKeys_object } = res;
    const date_added = new Date().toISOString();
    const reference = res?.reference || "";
    console.log("File keys: ", fileKeys_object);
    const fileKeys = JSON.stringify(fileKeys_object);
    console.log(`Received data: ${subject}, ${title}, ${deadline}, ${description}, ${type}, ${reference}, ${fileKeys}`);
    const row = await context.env.tesseau_db
        .prepare("INSERT INTO reminders (subject, title, deadline, description, type, date_added, reference, file_key) VALUES (?,?, ?, ?, ?, ?, ?, ?)")
        .bind(subject, title, deadline, description, type, date_added, reference, fileKeys)
        .run();
    console.log(`New data has been inputed: ${subject}, ${title}, ${deadline}, ${description}, ${type}, ${reference}, ${fileKeys}`);
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