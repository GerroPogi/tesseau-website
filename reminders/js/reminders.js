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
    const creator = document.getElementById("creator").value || "Anonymous";

    // Admins = direct, Others = suggestion
    const apiURL = ISADMIN ? "/api/reminders/new" : "/api/reminders/suggestion";
    const successMsg = ISADMIN
      ? "Reminder added successfully!"
      : "Suggestion submitted! An admin will review it soon.";

    showToast(
      ISADMIN ? "Adding reminder..." : "Submitting suggestion...",
      "info"
    );

    fetch(apiURL, {
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
        creator,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("submit result: ", data);
        showToast(successMsg, "success");
        updateList();
        document.getElementById("uploadStatus").dataset.filekeys = "[]";
        addReminderForm.reset();
        addReminderSection.classList.add("hidden");
      })
      .catch((error) => {
        console.error("Error submitting reminder:", error);
        showToast("Error. Please try again later.", "error");
      });
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

function renderSuggestions(suggestions) {
  const wrapper = document.getElementById("suggestionsList");
  wrapper.innerHTML = "";

  // Group by subject
  const grouped = {};
  suggestions.forEach((s) => {
    if (!grouped[s.subject]) grouped[s.subject] = [];
    grouped[s.subject].push(s);
  });

  Object.keys(grouped).forEach((subject) => {
    const subjectDiv = document.createElement("div");
    subjectDiv.classList.add("reminder-subject");

    const h3 = document.createElement("h3");
    h3.textContent = subject.toUpperCase();
    subjectDiv.appendChild(h3);
    const subjectWrapper = document.createElement("div");
    subjectWrapper.classList.add("reminder-wrapper", "hidden");
    subjectDiv.appendChild(subjectWrapper);

    grouped[subject].forEach((s) => {
      const card = document.createElement("div");
      card.classList.add("reminder-card", "suggestion-card");

      card.innerHTML = `
        <div class="badge">Suggestion</div>
        <h4>${s.title}</h4>
        <p>${s.description || ""}</p>
        <small>Deadline: ${s.deadline || "None"}</small>
      `;

      // Admin-only buttons
      if (ISADMIN) {
        const btns = document.createElement("div");
        btns.style.marginTop = "8px";

        const approveBtn = document.createElement("button");
        approveBtn.textContent = "✅ Approve";
        approveBtn.onclick = () => approveSuggestion(s);

        const rejectBtn = document.createElement("button");
        rejectBtn.textContent = "❌ Reject";
        rejectBtn.onclick = () => rejectSuggestion(s.id);

        btns.appendChild(approveBtn);
        btns.appendChild(rejectBtn);
        card.appendChild(btns);
      }

      subjectWrapper.appendChild(card);
    });
    subjectDiv.onclick = () => subjectWrapper.classList.toggle("hidden");
    wrapper.appendChild(subjectDiv);
    wrapper.appendChild(subjectWrapper);
  });
}

isAdmin().then((data) => {
  console.log("data", data);
  ISADMIN = data;
  if (data) {
    console.log("Admin mode enabled");
    handle_suggestions();
    document.getElementById("creator").classList.add("hidden");
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
    }, 0);
  };
  updateList();
});

function approveSuggestion(reminder) {
  fetch("/api/reminders/new", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...reminder,
      fileKeys: reminder.file_key,
      owner_token: admin,
    }),
  })
    .then((r) => r.json())
    .then(() => {
      showToast("Suggestion approved and added!", "success");
      rejectSuggestion(reminder.id);
    })
    .catch((err) => {
      console.error("Approve failed", err);
      showToast("Error approving suggestion.", "error");
    });
}

function rejectSuggestion(id) {
  fetch("/api/reminders/suggestion/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, owner_token: admin }),
  })
    .then((r) => r.json())
    .then(() => {
      showToast("Suggestion rejected.", "info");
      updateList();
    })
    .catch((err) => {
      console.error("Reject failed", err);
      showToast("Error rejecting suggestion.", "error");
    });
}

function handle_suggestions() {
  const suggestion_div = document.getElementById("reminder-suggestions");
  suggestion_div.classList.remove("hidden");
  fetch("/api/reminders/suggestion/get")
    .then((response) => response.json())
    .then((data) => {
      renderSuggestions(data);
    })
    .catch((error) => {
      console.error("Error fetching suggestions:", error);
      showToast("Error loading suggestions. Please try again later.", "error"); // ✅ Error toast
    });
}

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
    reminders_list.innerHTML = `
      <div id="valid-reminders"><h2>Current Reminders</h2></div>
      <div id="invalid-reminders"><h2>Past Reminders</h2></div>
    `;

    console.log("Refreshing reminders");

    // 🎯 Focus logic
    const filterDate = document.getElementById("filterDate").value;

    if (filterDate) {
      // Only show reminders for that date
      data = data.filter(
        (r) =>
          new Date(r.deadline).toDateString() ===
          new Date(filterDate).toDateString()
      );
    }

    if (data.length === 0) {
      reminders_list.innerHTML = `<p>No reminders ${
        filterDate ? "for this date" : "found"
      }.</p>`;
      showToast("No reminders found.", "info");
      return;
    }

    // Sort by deadline
    data.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    // Render normal subject reminders
    handleReminders(data);

    // Add CPE and LT if no filterDate (only relevant in global focus)
    if (!filterDate) {
      await addCPE();
      await addLT();
    }

    // 🎯 If filterDate given, expand only those reminders
    if (filterDate) {
      reminders_list
        .querySelectorAll(".reminder-wrapper")
        .forEach((reminder) => {
          reminder.classList.remove("hidden");
          console.log("Showing valid reminder", reminder);
        });
    } else {
      const validReminders = document.getElementById("valid-reminders");
      if (validReminders.children.length <= 1) {
        validReminders.innerHTML += "<p>No current reminders.</p>";
      } else {
        Array.from(validReminders.children).forEach((wrapper) => {
          wrapper.querySelector(".hidden")?.classList.remove("hidden");
          console.log("Hiding valid wrapper", wrapper);
        });
      }
    }

    showToast("Reminders updated!", "success");
  } catch (error) {
    console.error("Error fetching reminders:" + error);
    document.getElementById("reminders-list").innerHTML =
      "<p>Error loading reminders. Please try again later.</p>";
    showToast("Error loading reminders!", "error");
  }

  updateTextArea();
  if (ISADMIN) handle_suggestions();
}

// Normal subject reminders
function handleReminders(data) {
  if (data.length === 0) {
    document.getElementById("valid-reminders").innerHTML =
      "<p>No current reminders.</p>";
    document.getElementById("invalid-reminders").innerHTML =
      "<p>No past reminders.</p>";
    return;
  }

  data.forEach((reminder) => {
    const isValid = isDateValid(reminder.deadline);
    addReminder(reminder, isValid);
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
function getSubjectDiv(subject, isValid) {
  const parentId = isValid ? "valid-reminders" : "invalid-reminders";
  let parentDiv = document.getElementById(parentId);

  // If subject container already exists, return it
  let existing = document.getElementById(
    `reminder-container-${subject}-${isValid ? "valid" : "invalid"}`
  );
  if (existing) return existing;

  // Create subject container
  const subjectContainer = document.createElement("div");
  subjectContainer.id = `reminder-container-${subject}-${
    isValid ? "valid" : "invalid"
  }`;
  subjectContainer.classList.add("reminder-container");

  // Subject header
  const subjectHeader = document.createElement("h3");
  subjectHeader.textContent = subject;
  subjectContainer.appendChild(subjectHeader);

  // Wrapper for reminders (collapsed by default)
  const wrapper = document.createElement("div");
  wrapper.classList.add("reminder-wrapper", "hidden");

  // ✅ Only toggle if reminders exist
  subjectHeader.onclick = () => {
    if (wrapper.children.length > 0) {
      wrapper.classList.toggle("hidden");
    }
  };

  subjectContainer.appendChild(wrapper);
  parentDiv.appendChild(subjectContainer);
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

// Store reminders globally (or inside your module)
const remindersMap = new Map();

function addReminder(reminder, isValid) {
  // Save reminder
  remindersMap.set(reminder.id, reminder);

  // Get the subject container (creates it if missing)
  const subjectDiv = getSubjectDiv(reminder.subject, isValid);

  // The wrapper is always the second child
  const subjectWrapper = subjectDiv.querySelector(".reminder-wrapper");

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
                <button onclick="editReminderDetail(${reminder.id}, 'title')">Edit</button>
               </div>
               <div class="reminder-detail-button trash-icon" id="reminder-details-${reminder.id}-delete">
                <button onclick="deleteReminder(${reminder.id})">&#x1F5D1</button>
               </div>`
            : ""
        }
      </div>
    </div>
    <div class="reminder-details" id="reminder-details-${
      reminder.id
    }-description" style="display: none;">
      <div><span class="reminder-details-header">Description:</span></div>
      <div class="reminder-detail-wrapper">
        <span contenteditable="false" class="reminder-detail">
          ${md.render(description).replace(/<p>/g, "").replace(/<\/p>/g, "")}
        </span>
        ${
          admin
            ? `<div class="reminder-detail-button">
                <button onclick="editReminderDetail(${reminder.id}, 'description')">Edit</button>
              </div>`
            : ""
        }
      </div>
    </div>
    <div class="reminder-details" id="reminder-details-${
      reminder.id
    }-type" style="display: none;">
      <div><span class="reminder-details-header">Type of Activity:</span></div>
      <div class="reminder-detail-wrapper">
        <span contenteditable="false" class="reminder-detail">${
          ACTIVITIES[type]
        }</span>
        ${
          admin
            ? `<div class="reminder-detail-button">
                <button onclick="editReminderDetail(${reminder.id}, 'type')">Edit</button>
              </div>`
            : ""
        }
      </div>
    </div>
    <div class="reminder-details" id="reminder-details-${
      reminder.id
    }-deadline" style="display: none;">
      <div><span class="reminder-details-header">Deadline:</span></div>
      <div class="reminder-detail-wrapper">
        <span contenteditable="false" class="reminder-detail">
          ${new Date(deadline).toLocaleString("default", { month: "long" })} 
          ${new Date(deadline).getDate()}, 
          ${new Date(deadline).getFullYear()} 
          (${Math.ceil(
            Math.abs(new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)
          )} days ${new Date(deadline) < new Date() ? "ago" : "left"})
        </span>
        ${
          admin
            ? `<div class="reminder-detail-button">
                <button onclick="editReminderDetail(${reminder.id}, 'deadline')">Edit</button>
              </div>`
            : ""
        }
      </div>
    </div>
    ${
      reference
        ? `<div class="reminder-details" id="reminder-details-${
            reminder.id
          }-reference" style="display: none;">
            <div><span class="reminder-details-header">Reference:</span></div>
            <div class="reminder-detail-wrapper">
              <span contenteditable="false" class="reminder-detail">${reference}</span>
              ${
                admin
                  ? `<div class="reminder-detail-button">
                      <button onclick="editReminderDetail(${reminder.id}, 'reference')">Edit</button>
                    </div>`
                  : ""
              }
            </div>
          </div>`
        : ""
    }
  `;

  // Attachments
  const fileWrapperDiv = document.createElement("div");
  fileWrapperDiv.id = `reminder-details-${reminder.id}-file`;
  fileWrapperDiv.classList.add("reminder-details");
  fileWrapperDiv.style.display = "none";
  fileWrapperDiv.innerHTML = `
    <div><span class="reminder-details-header">Attachments:</span></div>
    <div class="reminder-detail-wrapper"></div>
  `;

  if (file_key) {
    const fileDiv = document.createElement("div");
    fileDiv.classList.add("reminder-detail");
    Array.from(file_key).forEach((file) => {
      const lower = file.toLowerCase();
      if (/\.(png|jpe?g|gif|webp)$/.test(lower)) {
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

  subjectWrapper.appendChild(reminderDiv);

  // Toggle details on click
  const subjectHeader = document.getElementById(
    `reminder-header-${reminder.id}`
  );
  subjectHeader.onclick = () => {
    const details = reminderDiv.querySelectorAll(".reminder-details");
    details.forEach((detail) => {
      detail.style.display = detail.style.display === "none" ? "block" : "none";
    });
  };
}

document.getElementById("filterDate").addEventListener("change", updateList);
