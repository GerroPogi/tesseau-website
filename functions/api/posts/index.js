export async function onRequestGet(context){
    const data = await context.env.tesseau_db.prepare("SELECT * from posts").all();
    return new Response(JSON.stringify(data.results),{
        headers: {"Content-Type": "application/json"}
    });
}