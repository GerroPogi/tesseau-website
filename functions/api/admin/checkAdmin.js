export async function onRequest(request, context) {
    console.log("Checking admin status...", request.request.url);
    const url = new URL(request.request.url);
    const admin_code = url.searchParams.get('admin');
    console.log("Admin code provided:", admin_code);
    return new Response(
        JSON.stringify({ isAdmin: admin_code === request.env.owner_token }),
        { headers: { 'Content-Type': 'application/json' } }
    );
}

/* example usage
fetch('/api/admin/checkAdmin?admin=12345')
    .then(res => res.json())
    .then(data => console.log(data)) // { isAdmin: true/false }
*/