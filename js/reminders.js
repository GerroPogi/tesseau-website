
const URLParams = new URLSearchParams(window.location.search);
const owner_token = URLParams.get("admin") || "";

function handleReminders(data){
    console.log("data", data);
    if (data.length === 0){
        reminders_list.innerHTML = "<p>No reminders found.</p>";
        return;
    }
    data.forEach(reminder => {

        addReminder(reminder);

    });
}

function addReminder(reminder){
    const reminders_list = document.getElementById("reminders-list");

    const reminderDiv = document.createElement("div");
    reminderDiv.classList.add("reminder");
    reminderDiv.innerHTML = `<div class="reminder-dropdown">
        <div class="reminder-header" style="cursor:pointer;" id="reminder-${reminder.id}">
            <h2>${reminder.title}</h2>
        </div>
        <div class="reminder-details" style="display:none;" id="reminder-details-${reminder.id}">
            <p class = "reminder-detail">${reminder.description}</p>
            <p class = "reminder-detail">Deadline: ${reminder.deadline}</p>
            <p class = "reminder-detail">Type: ${reminder.type}</p>
        </div>
    </div>
    `;
    const reminderHeader = reminderDiv.querySelector(`#reminder-${reminder.id}`);
    reminderHeader.onclick = () => {
        const details = reminderDiv.querySelector(`#reminder-details-${reminder.id}`);
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
    };
    reminders_list.appendChild(reminderDiv);
}

fetch(`api/reminders${URLParams.get("section") ? `/section=${URLParams.get("section")}` : ""}`)
    .then(response => response.json())
    .then(data => {
        handleReminders(data);
    })
    .catch(error => {
        console.error("Error fetching reminders:", error);
        const reminders_list = document.getElementById("reminders-list");
        reminders_list.innerHTML = "<p>Error loading reminders. Please try again later.</p>";
    });

isAdmin().then(data => {
    console.log("data", data);
    if (data){
        console.log("Admin mode enabled");
        // Show admin features
        // alert("You have admin commands. Please be careful with your actions :)");
        // Unhide the add reminder section
        const addReminderSection = document.getElementById("add-reminder");
        addReminderSection.classList.remove("hidden");
        addReminderSection.innerHTML = `
            <h2>Add Reminder</h2>
            <form id="add-reminder-form">
                <input type="text" id="title" name="title" required placeholder="Title"><br>
                <textarea id="description" name="description" required placeholder="Description"></textarea><br>
                <select id="subject" name="subject" required>
                    <option value="">Filter by subject</option>
                    <option>Intro to Philosophy</option>
                    <option>Earth and Space Science 1</option>
                    <option>Finite Math 1</option>
                    <option>English</option>
                    <option>Filipino</option>
                    <option>General Math</option>
                    <option>General Science</option>
                    <option>Life and Career Skills</option>
                    <option>Pag-aaral ng Kasaysayan at Lipunang Pilipino</option>
                </select><br>
                <input type="date" id="deadline" name="deadline" required placeholder="Deadline"><br>
                <input type="text" id="reference" name="reference" placeholder="Reference (Optional)"><br>
                <select id="type" name="type" required>
                    <option value="">Select Type of Activity</option>
                    <option value="groupings">Groupings</option>
                    <option value="lt">Long Test</option>
                    <option value="cpe">Check-Point Exam (CPE)</option>
                    <option value="pt">Peformance Task</option>
                    <option value="las">Learning Activity Sheet (LAS)</option>
                    <option value="activity">Activity</option>
                </select><br>
                <button type="submit">Add Reminder</button>
            </form>
            `;
        
        const addReminderForm = document.getElementById("add-reminder-form");
        addReminderForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const subject = document.getElementById("subject").value;
            const title = document.getElementById("title").value;
            const description = document.getElementById("description").value;
            const deadline = document.getElementById("deadline").value;
            const type = document.getElementById("type").value;
            const reference = document.getElementById("reference").value || "";
            fetch("/api/reminders/new", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, title, description, deadline, type, reference, owner_token})
            })
            .then(response => response.json())
            .then(data => {
                console.log("data", data);
                addReminder(data);
            })
            .catch(error => {
                console.error("Error adding reminder:", error);
            });
        });
    } else{
        console.log("Admin mode disabled");
    }
});

