const URLParams = new URLSearchParams(window.location.search);
const admin = URLParams.get("admin") || "";
let ISADMIN = false;

const md = window.markdownit();

document
  .getElementById(URLParams.get("section") || "all")
  .classList.add("active-section");

function add_addButton() {
  const addReminderSection = document.getElementById("add-reminder");
  addReminderSection.classList.remove("hidden");

  const addReminderForm = document.getElementById("add-reminder-form");
  addReminderForm.onsubmit = (e) => {
    console.log("Adding reminder...");
    showToast("Adding reminder...", "info"); // ✅ Feedback when form is opened
    e.preventDefault();
    const subject = document.getElementById("subject").value;
    const title = document.getElementById("title").value;
    const description = document.getElementById("content").value;
    const deadline = document.getElementById("deadline").value;
    const type = document.getElementById("type").value;
    const reference = document.getElementById("reference").value || "";
    const files = document.getElementById("uploadStatus").dataset.filekeys
      ? JSON.parse(document.getElementById("uploadStatus").dataset.filekeys)
      : [];

    addReminderSection.classList.add("hidden");
    sendReminder();
    function sendReminder() {
      fetch(ISADMIN ? "/api/reminders/new" : "/api/reminders/suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          title,
          description,
          deadline,
          type,
          reference,
          owner_token: admin,
          fileKeys: files,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("sending reminder: ", data);
          showToast(
            ISADMIN
              ? "Reminder added successfully!"
              : "This is an experimental function. Your reminder will show up eventually",
            "success"
          ); // ✅ Success toast
          updateList();
          document.getElementById("uploadStatus").dataset.filekeys = "[]";
          addReminderForm.reset();
        })
        .catch((error) => {
          console.error("Error adding reminder:", error);
          showToast("Error adding reminder. Please try again.", "error"); // ✅ Error toast
        });
    }
  };
}

function isDateValid(dateStr) {
  if (!dateStr || typeof dateStr !== "string") {
    console.warn("isDateValid called with invalid dateStr:", dateStr);
    return false;
  }

  // Expecting format YYYY-MM-DD
  const parts = dateStr.split("-");
  if (parts.length !== 3) {
    console.warn("isDateValid: unexpected date format", dateStr);
    return false;
  }

  const [year, month, day] = parts.map(Number);
  const inputDate = new Date(year, month - 1, day); // local midnight

  if (isNaN(inputDate.getTime())) {
    console.warn("isDateValid: invalid parsed date", dateStr);
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return inputDate >= today;
}

document.getElementById("tesla").onclick = () => {
  const params = new URLSearchParams(window.location.search);
  const newParams = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (key !== "section") {
      newParams.set(key, value);
    }
  }
  const newUrl = `?section=tesla&${newParams.toString()}`;
  window.location.href = newUrl;
};
document.getElementById("rousseau").onclick = () => {
  const params = new URLSearchParams(window.location.search);
  const newParams = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (key !== "section") {
      newParams.set(key, value);
    }
  }
  const newUrl = `?section=rousseau&${newParams.toString()}`;
  window.location.href = newUrl;
};

document.getElementById("all").onclick = () => {
  const params = new URLSearchParams(window.location.search);
  const newParams = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (key !== "section") {
      newParams.set(key, value);
    }
  }
  const newUrl = `?${newParams.toString()}`;
  window.location.href = newUrl;
};

function updateTextArea() {
  if (!admin) return;
  const text_area = document.getElementById("add-reminder-textarea");
  text_area.classList.remove("hidden");
  buildReminderAnnouncement().then((data) => {
    document.getElementById("add-reminder-textarea").value = data;
  });
}

isAdmin().then((data) => {
  console.log("data", data);
  ISADMIN = data;
  if (data) {
  } else {
    console.log("Admin mode disabled");
  }
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
  };
  updateList();
});

const dayOfTheWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

async function buildReminderAnnouncement() {
  console.log("making the reminder text");
  const today = new Date();
  let reminderText = `${
    dayOfTheWeek[today.getDay()]
  } ${today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })}\n\n`;
  const reminders = {};

  // First fetch
  const section = URLParams.get("section");
  const res = await fetch(`/api/reminders${section ? `/${section}` : ""}`);
  const data = await res.json();

  data.forEach((r) => {
    if (!isDateValid(r.deadline)) return;
    const subj = r.subject;
    if (!reminders[subj]) reminders[subj] = [];
    reminders[subj].push({
      ...r,
      deadline: new Date(r.deadline).toISOString().split("T")[0],
    });
  });

  for (const [subject, list] of Object.entries(reminders)) {
    reminderText += `${subject}\n`;

    list.forEach((r) => {
      const deadlineDate = new Date(r.deadline);
      const deadlineDay = dayOfTheWeek[deadlineDate.getDay()];
      const todayDate = new Date();
      const isToday = todayDate.toDateString() === deadlineDate.toDateString();
      reminderText += `- ${r.title} DL: ${r.deadline} (${
        isToday ? "Today" : deadlineDay
      })\n`;
    });
    reminderText += "\n";
  }

  // Now you can append more via other async calls
  const lts = await fetch("/api/reminders/lt").then((r) => r.json());
  const allowedLt = lts.filter((lt) => isDateValid(lt.deadline));

  if (allowedLt.length) {
    reminderText += `Long Tests\n`;
    console.log("lt", allowedLt);
    allowedLt.forEach((item) => {
      if (!isDateValid(item.deadline)) return;

      const deadlineDate = new Date(item.deadline);
      const deadlineDay = dayOfTheWeek[deadlineDate.getDay()];
      if (!isDateValid(item.deadline)) return;
      reminderText += `- ${item.subject} - ${item.deadline} (${deadlineDay})\n`;
    });
    reminderText += "\n";
  }

  const cpes = await fetch("/api/reminders/cpe").then((r) => r.json());
  const allowedCPES = cpes.filter((cpe) => isDateValid(cpe.deadline));
  for (let cpe in allowedCPES) {
    if (isDateValid(cpes[cpe].deadline)) {
      allowedCPES.push(cpes[cpe]);
    }
  }
  if (allowedCPES.length) {
    reminderText += `Check-Point Exams (CPE)\n`;
    console.log("cpe", allowedCPES);
    allowedCPES.forEach((item) => {
      if (!isDateValid(item.deadline)) return;
      const deadlineDate = new Date(item.deadline);
      const deadlineDay = dayOfTheWeek[deadlineDate.getDay()];

      reminderText += `- ${item.subject} - ${item.deadline} (${deadlineDay})\n`;
    });
    reminderText += "\n";
  }
  reminderText +=
    "More information can be found in: https://tesseau.pages.dev/reminders";
  return reminderText;
}

async function updateList() {
  try {
    const response = await fetch(
      `/api/reminders${
        URLParams.get("section") ? `/${URLParams.get("section")}` : ""
      }`
    );
    let data = await response.json();

    const reminders_list = document.getElementById("reminders-list");
    reminders_list.innerHTML = "";
    console.log("Refreshing reminders");

    const filterDate = document.getElementById("filterDate").value;
    data = data.filter((r) =>
      filterDate
        ? new Date(r.deadline).toDateString() ===
          new Date(filterDate).toDateString()
        : true
    );

    if (data.length === 0) {
      reminders_list.innerHTML = "<p>No reminders found.</p>";
      showToast("No reminders found.", "info"); // ✅ Info toast for empty list
      return;
    }

    data.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    handleReminders(data);

    await addCPE();
    await addLT();

    const subjects = Array.from(reminders_list.children);
    console.log("Subjects, CPE, and LT: ", subjects);
    subjects.forEach((subject) => {
      const wrapper = subject.querySelector(".reminder-wrapper");
      wrapper.classList.remove("hidden");
      Array.from(wrapper.children).forEach((reminder) => {
        if (reminder.id.endsWith("-valid")) {
          reminder.classList.remove("hidden");
        }
      });
    });

    showToast("Reminders updated!", "success"); // ✅ Success toast for refresh
  } catch (error) {
    console.error("Error fetching reminders:", error);
    document.getElementById("reminders-list").innerHTML =
      "<p>Error loading reminders. Please try again later.</p>";
    showToast("Error loading reminders!", "error"); // ✅ Error toast
  }

  updateTextArea();
}

// Normal subject reminders
function handleReminders(data) {
  if (data.length === 0) {
    reminders_list.innerHTML = "<p>No reminders found.</p>";
    return;
  }
  data.forEach((reminder) => {
    addReminder(reminder, isDateValid(reminder.deadline));
  });
}

// CPE

async function addCPE() {
  try {
    const response = await fetch(`/api/reminders/cpe`);
    const data = await response.json();

    const CPESubjectDiv = getSubjectDiv("Check-Point Exams (CPE)");

    const newData = data.map((reminder) => ({
      ...reminder,
      title: reminder.subject,
      subject: "Check-Point Exams (CPE)",
    }));

    newData.forEach((reminder) => {
      addReminder(reminder, isDateValid(reminder.deadline));
    });

    document.getElementById("reminders-list").appendChild(CPESubjectDiv);
  } catch (error) {
    console.error("Error handling CPE:", error);
  }
}

async function addLT() {
  try {
    const response = await fetch(`/api/reminders/lt`);
    const data = await response.json();

    const LTSubjectDiv = getSubjectDiv("Long Tests");

    const newData = data.map((reminder) => ({
      ...reminder,
      title: reminder.subject,
      subject: "Long Tests",
    }));

    newData.forEach((reminder) => {
      addReminder(reminder, isDateValid(reminder.deadline));
    });

    document.getElementById("reminders-list").appendChild(LTSubjectDiv);
  } catch (error) {
    console.error("Error handling LT:", error);
  }
}

// Helper: create a header + page pair (valid or invalid reminders)
function createReminderSection(subject, type, title) {
  const header = document.createElement("div");
  header.classList.add("reminder-page-header");
  header.innerHTML = `<h3>${title}</h3>`;

  const page = document.createElement("div");
  page.classList.add("reminder-page", "hidden");
  page.id = `reminder-page-${subject}-${type}`;
  page.innerHTML = `<div class="reminder-page-container"></div>`;

  // Toggle page visibility on header click
  header.onclick = () => page.classList.toggle("hidden");

  return { header, page };
}

// Main: create subject container
function getSubjectDiv(subject) {
  // If already exists, just return it
  let existing = document.getElementById(`reminder-container-${subject}`);
  if (existing) return existing;

  // Container for subject
  const subjectContainer = document.createElement("div");
  subjectContainer.id = `reminder-container-${subject}`;
  subjectContainer.classList.add("reminder-container");

  // Subject clickable title
  const subjectDiv = document.createElement("div");
  subjectDiv.classList.add("reminder-subject");
  subjectDiv.id = `reminder-${subject}`;
  subjectDiv.innerHTML = `<h2>${subject}</h2>`;
  subjectContainer.appendChild(subjectDiv);

  // Wrapper (holds valid + invalid sections)
  const wrapper = document.createElement("div");
  wrapper.classList.add("reminder-wrapper", "hidden");
  wrapper.id = `reminder-wrapper-${subject}`;
  subjectContainer.appendChild(wrapper);

  // Create "valid" section
  const validSection = createReminderSection(
    subject,
    "valid",
    "Current reminders"
  );
  wrapper.appendChild(validSection.header);
  wrapper.appendChild(validSection.page);

  // Create "invalid" section
  const invalidSection = createReminderSection(
    subject,
    "invalid",
    "Past reminders"
  );
  wrapper.appendChild(invalidSection.header);
  wrapper.appendChild(invalidSection.page);

  // Toggle wrapper when subject header is clicked
  subjectDiv.onclick = () => wrapper.classList.toggle("hidden");

  // Add to main list
  document.getElementById("reminders-list").appendChild(subjectContainer);

  return subjectContainer;
}

function deleteReminder(id) {
  if (!admin) {
    showToast("Not authorized to delete reminders.", "error"); // ✅ Better than alert
    return;
  }
  fetch(`/api/reminders/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, owner_token: admin }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("data", data);
      if (data.success) {
        showToast("Reminder deleted successfully.", "success"); // ✅ Success toast
        updateList();
      } else {
        showToast("Failed to delete reminder.", "error"); // ✅ Failure toast
      }
    })
    .catch((error) => {
      console.error("Error deleting reminder:", error);
      showToast("Error deleting reminder. Please try again later.", "error"); // ✅ Error toast
    });
}

const ACTIVITIES = {
  groupings: "Groupings",
  lt: "Long Test",
  cpe: "Check-Point Exam (CPE)",
  pt: "Performance Task",
  las: "Learning Activity Sheet (LAS)",
  activity: "Activity",
  requirement: "Requirement",
};

function editReminderDetail(id, field, currentValue) {
  if (!admin) {
    alert("You are not authorized to edit reminders.");
    return;
  }
  let newValue;
  switch (field) {
    case "title":
      newValue = prompt("Edit Title:", currentValue);
      break;
    case "description":
      newValue = prompt("Edit Description:", currentValue);
      break;
    case "deadline":
      newValue = prompt("Edit Deadline (YYYY-MM-DD):", currentValue);
      break;
    case "type":
      newValue = prompt(
        "Edit Type of Activity:\nOptions: groupings, lt, cpe, pt, las, activity",
        currentValue
      );
      break;
    case "reference":
      newValue = prompt("Edit Reference (Optional):", currentValue);
      break;
    default:
      newValue = prompt(`Edit ${field}:`, currentValue);
  }
  if (newValue === null || newValue === currentValue) return;
  if (field === "deadline") {
    // Check for valid date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newValue)) {
      alert("Please enter a valid date in YYYY-MM-DD format.");
      return;
    }
    // Check if date is not in the past
    const inputDate = new Date(newValue);
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
    body: JSON.stringify({ id, field, value: newValue, owner_token: admin }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        updateList();
      } else {
        alert("Failed to update reminder.");
      }
    })
    .catch((error) => {
      console.error("Error updating reminder:", error);
      alert("Error updating reminder. Please try again later.");
    });
}

function addReminder(reminder, isValid) {
  const subjectDiv = getSubjectDiv(reminder.subject);
  const subjectPageDiv = document.getElementById(
    `reminder-page-${reminder.subject}-${isValid ? "valid" : "invalid"}`
  );
  const subjectContainerDiv = subjectPageDiv.querySelector(
    ".reminder-page-container"
  );
  // subjectPageDiv.classList.add("hidden");

  const reminderDiv = document.createElement("div");
  reminderDiv.classList.add("reminder");
  reminderDiv.id = `reminder-${reminder.id}`;

  const {
    title,
    description,
    deadline,
    reference,
    type,
    file_key: file_key_str,
  } = reminder;
  const file_key = file_key_str ? JSON.parse(file_key_str) : "";

  reminderDiv.innerHTML = `
        <div class="reminder-header-wrapper">
            <div class="reminder-header" id="reminder-header-${
              reminder.id
            }" style="display: flex; align-items: center; gap: 8px;">
                <span contenteditable="false" class="reminder-title" style="flex: 1;">${title}</span>
                ${
                  admin
                    ? `<div class="reminder-title-button">
                    <button onclick="editReminderDetail(${
                      reminder.id
                    }, 'title', '${title.replace(/'/g, "\\'")}')">Edit</button>
                    
                    </div>
                <div class="reminder-detail-button trash-icon" id="reminder-details-${
                  reminder.id
                }-delete">
                <button onclick="deleteReminder(${
                  reminder.id
                })">&#x1F5D1</button>
            </div>`
                    : ""
                }
            </div>
        </div>  
        <div class="reminder-details" id="reminder-details-${
          reminder.id
        }-description" style="display: none;">
            <div>
                <span class="reminder-details-header">Description:</span>
            </div>
            <div class="reminder-detail-wrapper">
                <span contenteditable="false" class="reminder-detail">${md
                  .render(description)
                  .replace(/<p>/g, "")
                  .replace(/<\/p>/g, "")}</span>
                ${
                  admin
                    ? `<div class="reminder-detail-button">
                    <button onclick="editReminderDetail(${
                      reminder.id
                    }, 'description', '${description.replace(
                        /'/g,
                        "\\'"
                      )}')">Edit</button>
                </div>`
                    : ""
                }
            </div>
        </div>
        <div class="reminder-details" id="reminder-details-${
          reminder.id
        }-type" style="display: none;">
            <div>
                <span class="reminder-details-header">Type of Activity:</span>
            </div>
            <div class="reminder-detail-wrapper">
                <span contenteditable="false" class="reminder-detail">${
                  ACTIVITIES[type]
                }</span>
                ${
                  admin
                    ? `<div class="reminder-detail-button">
                    <button onclick="editReminderDetail(${
                      reminder.id
                    }, 'type', '${type.replace(/'/g, "\\'")}')">Edit</button>
                </div>`
                    : ""
                }
            </div>
            <div class="reminder-detail-wrapper">
            
            </div>
        </div>
        <div class="reminder-details" id="reminder-details-${
          reminder.id
        }-deadline" style="display: none;">
            <div>
                <span class="reminder-details-header">Deadline:</span>
            </div>
            <div class="reminder-detail-wrapper">
                <span contenteditable="false" class="reminder-detail">
                ${new Date(deadline).toLocaleString("default", {
                  month: "long",
                })} 
                ${new Date(deadline).getDate()}, 
                ${new Date(deadline).getFullYear()} 
                (${Math.ceil(
                  Math.abs(new Date(deadline) - new Date()) /
                    (1000 * 60 * 60 * 24)
                )} days ${new Date(deadline) < new Date() ? "ago" : "left"})
                </span>
                ${
                  admin
                    ? `<div class="reminder-detail-button">
                    <button onclick="editReminderDetail(${reminder.id}, 'deadline', '${deadline}')">Edit</button>
                </div>`
                    : ""
                }
            </div>
        </div>
        ${
          reference
            ? `
        <div class="reminder-details" id="reminder-details-${
          reminder.id
        }-reference" style="display: none;">
            <div>
                <span class="reminder-details-header">Reference:</span>
            </div>
            <div class="reminder-detail-wrapper">
                <span contenteditable="false" class="reminder-detail">${reference}</span>
                ${
                  admin
                    ? `<div class="reminder-detail-button">
                    <button onclick="editReminderDetail(${
                      reminder.id
                    }, 'reference', '${reference.replace(
                        /'/g,
                        "\\'"
                      )}')">Edit</button>
                </div>`
                    : ""
                }
            </div>
        </div>`
            : ""
        }
        
    `;
  const fileWrapperDiv = document.createElement("div");
  fileWrapperDiv.id = `reminder-details-${reminder.id}-file`;
  fileWrapperDiv.classList.add("reminder-details");
  fileWrapperDiv.style.display = "none";
  fileWrapperDiv.innerHTML = `
            <div>
                <span class="reminder-details-header">Attachments:</span>
            </div>
            <div class="reminder-detail-wrapper">
                
            </div>`;

  const fileDiv = document.createElement("div");
  fileDiv.classList.add("reminder-detail");
  if (file_key) {
    Array.from(file_key).forEach((file) => {
      console.log(
        "Doing: ",
        file,
        " for ",
        reminder.id,
        "subject",
        reminder.subject,
        " title",
        title
      );
      const lower = file.toLowerCase();
      if (
        lower.endsWith(".png") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".gif") ||
        lower.endsWith(".webp")
      ) {
        const img = document.createElement("img");
        img.src = `/api/files/${file}`;
        img.alt = "Attachment";
        img.style.maxHeight = "200px";
        img.style.maxWidth = "100%";
        img.style.objectFit = "contain";
        fileDiv.appendChild(img);
        fileDiv.appendChild(document.createElement("br"));
      } else {
        const a = document.createElement("a");
        a.href = `/api/files/${file}`;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = file.replace(/^[\d-]+-/, "");
        fileDiv.appendChild(a);
        fileDiv.appendChild(document.createElement("br"));
      }
    });

    fileWrapperDiv
      .querySelector(".reminder-detail-wrapper")
      .appendChild(fileDiv);
    reminderDiv.appendChild(fileWrapperDiv);
  }

  subjectContainerDiv.appendChild(reminderDiv);
  const subjectHeader = document.getElementById(
    `reminder-header-${reminder.id}`
  );
  subjectHeader.onclick = () => {
    const details = document
      .getElementById(`reminder-${reminder.id}`)
      .querySelectorAll(".reminder-details");
    details.forEach((detail) => {
      if (detail.style.display === "none") {
        detail.style.display = "block";
      } else {
        detail.style.display = "none";
      }
    });
  };
}

document.getElementById("filterDate").addEventListener("change", updateList);
