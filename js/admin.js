// This basically handles everything in the admin dashboard
// Including adding, editing, deleting notes and reminders

// Check if the user is an admin
function isAdmin() {
    const urlParams = new URLSearchParams(window.location.search);
    console.log(urlParams.get('admin'));
    return fetch(`/api/admin/checkAdmin?admin=${urlParams.get('admin')}`)
        .then(res => res.json())
        .then(data => data.isAdmin);
}