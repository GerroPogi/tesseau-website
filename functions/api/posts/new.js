export async function onRequest(context){
    const {request, env} = context;
    const res = await request.json();

    console.log(res);
    if (res.admin!=env.owner_token){
        return new Response(JSON.stringify({success: false, message:"Unauthorized"}),
    {headers: { "Content-Type": "application/json" }})
    }
    const {author, content, title} = res;
    const date= new Date().toISOString();

    const data = await env.tesseau_db.prepare("INSERT INTO posts (author, content, title, date_added) VALUES (?, ?, ?, ?)").bind(author, content, title, date).run();
    const id = data.meta.last_row_id;
    return new Response(JSON.stringify({success: true, id, author, content, title}), {headers: { "Content-Type": "application/json" }});


}