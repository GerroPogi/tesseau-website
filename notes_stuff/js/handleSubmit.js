function handleSubmit(event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const title = document.getElementById("title").value;
    const subject = document.getElementById("subject").value;
    const description = document.getElementById("description").value;

    const reviewData = {
        creator: name,
        title: title,
        subject: subject,
        description: description,
        reviewer: JSON.stringify(selectedFiles)
    };

    fetch('/api/reviewers/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
    })
    .then(response => response.json())
    .then(data => {
        // Reset
        document.getElementById("name").value = "";
        document.getElementById("title").value = "";
        document.getElementById("subject").value = "";
        document.getElementById("description").value = "";
        document.getElementById("pickedFiles").innerHTML = "";
        selectedFiles = [];

        allReviewers.push(data);
        renderReviewers(allReviewers);
    })
    .catch(err => console.error('Error:', err));
}