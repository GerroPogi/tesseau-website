
const URLParams = new URLSearchParams(window.location.search);
const owner_token = URLParams.get("admin") || "";
let admin= false;

document.getElementById(URLParams.get("section") || "all").classList.add("active-section");

function add_addButton(){
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
        addReminderSection.classList.add("hidden");
        fetch("/api/reminders/new", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, title, description, deadline, type, reference, owner_token})
        })
        .then(response => response.json())
        .then(data => {
            console.log("data", data);
            updateList();
            addReminderForm.reset();
        })
        .catch(error => {
            console.error("Error adding reminder:", error);
        });
    });
}

document.getElementById("tesla").onclick = () => {
    const params = new URLSearchParams(window.location.search);
    const newParams = new URLSearchParams();
    for (const [key, value] of params.entries()){
        if (key !== "section"){
            newParams.set(key, value);
        }
    }
    const newUrl = `reminders.html?section=tesla&${newParams.toString()}`;
    window.location.href =newUrl;
}
document.getElementById("rousseau").onclick = () => {
    const params = new URLSearchParams(window.location.search);
    const newParams = new URLSearchParams();
    for (const [key, value] of params.entries()){
        if (key !== "section"){
            newParams.set(key, value);
        }
    }
    const newUrl = `reminders.html?section=rousseau&${newParams.toString()}`;
    window.location.href =newUrl;
}

document.getElementById("all").onclick = () => {
    const params = new URLSearchParams(window.location.search);
    const newParams = new URLSearchParams();
    for (const [key, value] of params.entries()){
        if (key !== "section"){
            newParams.set(key, value);
        }
    }
    const newUrl = `reminders.html?${newParams.toString()}`;
    window.location.href =newUrl;
}

isAdmin().then(data => {
    console.log("data", data);
    admin = data;
    if (data){
        add_reminder_btn = document.getElementById("addReminderBtn");
        // Show admin features
        add_reminder_btn.classList.remove("hidden");
        // Unhide the add reminder section
        add_reminder_btn.onclick = () => {
            
            // Focus on the form after showing it
            setTimeout(() => {
                add_addButton();
                document.getElementById("add-reminder-form").focus();
            }, 0); 
        }
    } else{
        console.log("Admin mode disabled");
    }
    updateList();
});

function updateList(){
    fetch(`api/reminders${URLParams.get("section") ? `/${URLParams.get("section")}` : ""}`)
    .then(response => response.json())
    .then(data => {
        const reminders_list = document.getElementById("reminders-list");
        reminders_list.innerHTML = "";
        if (data.length === 0){
            reminders_list.innerHTML = "<p>No reminders found.</p>";
            return;
        }
        handleReminders(data);
    })
    .catch(error => {
        console.error("Error fetching reminders:", error);
        const reminders_list = document.getElementById("reminders-list");
        reminders_list.innerHTML = "<p>Error loading reminders. Please try again later.</p>";
    });
}


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

function getSubjectDiv(subject){
    if (document.getElementById(`reminder-${subject}`)){
        return document.getElementById(`reminder-page-${subject}`);
    } else{
        let subjectContainer = document.createElement("div");
        subjectContainer.id = `reminder-container-${subject}`;
        subjectContainer.classList.add("reminder-container");
        

        let subjectDiv = document.createElement("div");
        subjectDiv.classList.add("reminder-subject");
        subjectDiv.id = `reminder-${subject}`;
        subjectDiv.innerHTML = `<h2>${subject}</h2>`;

        subjectContainer.appendChild(subjectDiv);
        reminder_page= document.createElement("div");
        reminder_page.classList.add("reminder-page");
        reminder_page.id = `reminder-page-${subject}`;
        

        subjectContainer.appendChild(reminder_page);
        document.getElementById("reminders-list").appendChild(subjectContainer);
        subjectDiv.onclick = (e) => {
            const reminders = document.getElementById(`reminder-page-${subject}`);
            reminders.classList.toggle("hidden");
        };
        return subjectContainer;
    }
}

function deleteReminder(id){
    if (!admin){
        alert("You are not authorized to delete reminders.");
        return;
    }
    fetch(`/api/reminders/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, owner_token })
    })
    .then(response => response.json())
    .then(data => {
        console.log("data", data);
        if (data.success){
            updateList();
        }
    })
    .catch(error => {
        console.error("Error deleting reminder:", error)
        alert("Error deleting reminder. Please try again later.")
        });
}

const ACTIVITIES={
    "groupings": "Groupings",
    "lt": "Long Test",
    "cpe": "Check-Point Exam (CPE)",
    "pt": "Performance Task",
    "las": "Learning Activity Sheet (LAS)",
    "activity": "Activity",
}

function editReminderDetail(id, field, currentValue) {
    if (!admin) {
        alert("You are not authorized to edit reminders.");
        return;
    }
    let newValue = prompt(`Edit ${field}:`, currentValue);
    if (newValue === null || newValue === currentValue) return;
    if (field === "deadline") {
        // Check for valid date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(newValue)) {
            alert("Please enter a valid date in YYYY-MM-DD format.");
            return;
        }
        // Check if date is not in the past
        const inputDate = new Date(newValue);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (inputDate < today) {
            alert("Deadline cannot be in the past.");
            return;
        }
    }
    if (field === "title") {
        if (!newValue.trim()) {
            alert("Title cannot be empty.");
            return;
        }
        if (newValue.length > 100) {
            alert("Title is too long (max 100 characters).");
            return;
        }
    }
    if (field === "description") {
        if (!newValue.trim()) {
            alert("Description cannot be empty.");
            return;
        }
        if (newValue.length > 1000) {
            alert("Description is too long (max 1000 characters).");
            return;
        }
    }
    if (field === "type") {
        const allowedTypes = ["groupings", "lt", "cpe", "pt", "las", "activity"];
        if (!allowedTypes.includes(newValue)) {
            alert("Invalid type selected.");
            return;
        }
    }
    if (field === "reference") {
        if (newValue.length > 200) {
            alert("Reference is too long (max 200 characters).");
            return;
        }
    }

    fetch(`/api/reminders/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, field, value: newValue, owner_token })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateList();
        } else {
            alert("Failed to update reminder.");
        }
        updateList();
    })
    .catch(error => {
        console.error("Error updating reminder:", error);
        alert("Error updating reminder. Please try again later."    );
    });
}

function addReminder(reminder){ 
    const subjectDiv = getSubjectDiv(reminder.subject);
    const subjectPageDiv = document.getElementById(`reminder-page-${reminder.subject}`);
    subjectPageDiv.classList.add("hidden");

    const reminderDiv = document.createElement("div");
    reminderDiv.classList.add("reminder");
    reminderDiv.id = `reminder-${reminder.id}`;
    
    const { title, description, deadline, reference, type } = reminder;

    reminderDiv.innerHTML = `
        <div class="reminder-header-wrapper">
            <div class="reminder-header" id="reminder-header-${reminder.id}" style="display: flex; align-items: center; gap: 8px;">
                <span contenteditable="false" class="reminder-title" style="flex: 1;">${title}</span>
                ${ admin ? `<div class="reminder-title-button">
                    <button onclick="editReminderDetail(${reminder.id}, 'title', '${title.replace(/'/g, "\\'")}')">Edit</button>
                    
                    </div>
                <div class="reminder-detail-button trash-icon" id="reminder-details-${reminder.id}-delete">
                <button onclick="deleteReminder(${reminder.id})">&#x1F5D1</button>
            </div>` : "" }
            </div>
        </div>  
        <div class="reminder-details" id="reminder-details-${reminder.id}-description" style="display: none;">
            <div>
                <span class="reminder-details-header">Description:</span>
            </div>
            <div class="reminder-detail-wrapper">
                <span contenteditable="false" class="reminder-detail">${description}</span>
                ${ admin ? `<div class="reminder-detail-button">
                    <button onclick="editReminderDetail(${reminder.id}, 'description', '${description.replace(/'/g, "\\'")}')">Edit</button>
                </div>` : "" }
            </div>
        </div>
        <div class="reminder-details" id="reminder-details-${reminder.id}-type" style="display: none;">
            <div>
                <span class="reminder-details-header">Type of Activity:</span>
            </div>
            <div class="reminder-detail-wrapper">
                <span contenteditable="false" class="reminder-detail">${ACTIVITIES[type]}</span>
                ${ admin ? `<div class="reminder-detail-button">
                    <button onclick="editReminderDetail(${reminder.id}, 'type', '${type.replace(/'/g, "\\'")}')">Edit</button>
                </div>` : "" }
            </div>
        </div>
        <div class="reminder-details" id="reminder-details-${reminder.id}-deadline" style="display: none;">
            <div>
                <span class="reminder-details-header">Deadline:</span>
            </div>
            <div class="reminder-detail-wrapper">
                <span contenteditable="false" class="reminder-detail">
                ${new Date(deadline).toLocaleString('default', { month: 'long' })} 
                ${new Date(deadline).getDate()}, 
                ${new Date(deadline).getFullYear()} 
                (${Math.ceil(Math.abs(new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))} days left)
                </span>
                ${ admin ? `<div class="reminder-detail-button">
                    <button onclick="editReminderDetail(${reminder.id}, 'deadline', '${deadline}')">Edit</button>
                </div>` : "" }
            </div>
        </div>
        ${reference ? `
        <div class="reminder-details" id="reminder-details-${reminder.id}-reference" style="display: none;">
            <div>
                <span class="reminder-details-header">Reference:</span>
            </div>
            <div class="reminder-detail-wrapper">
                <span contenteditable="false" class="reminder-detail">${reference}</span>
                ${ admin ? `<div class="reminder-detail-button">
                    <button onclick="editReminderDetail(${reminder.id}, 'reference', '${reference.replace(/'/g, "\\'")}')">Edit</button>
                </div>` : "" }
            </div>
        </div>` : ""
        }
    `;
   
    subjectPageDiv.appendChild(reminderDiv);
    const subjectHeader = document.getElementById(`reminder-header-${reminder.id}`);
    subjectHeader.onclick =() => {
        const details = document.getElementById(`reminder-${reminder.id}`).querySelectorAll(".reminder-details");
        details.forEach(detail => {
            if (detail.style.display === "none"){
                detail.style.display = "block";
            } else{
                detail.style.display = "none";
            }
        });
    }
}


