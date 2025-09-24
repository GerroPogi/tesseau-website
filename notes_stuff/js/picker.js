// === CONFIG ===
const developerKey = "";
const clientId =
  "661671724651-g991at5eiurrroi8aojjnmj8jit9agas.apps.googleusercontent.com";
const appId = "661671724651";
const scope = "https://www.googleapis.com/auth/drive";

let oauthToken;
let tokenClient;
let pickerApiLoaded = false;
let selectedFiles = [];

// === INIT LIBRARIES ===
function gapiLoaded() {
  gapi.load("client:picker", async () => {
    pickerApiLoaded = true;
    await gapi.client.load("drive", "v3");
  });
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: scope,
    callback: () => {},
  });
}

// === AUTH + PICKER ===
function handleAuthClick() {
  if (!tokenClient) return;
  showToast("Authenticating...", "info");
  tokenClient.callback = (tokenResponse) => {
    if (tokenResponse.error) return;
    oauthToken = tokenResponse.access_token;
    createPicker();
    showToast("Authentication successful!", "success");
  };
  tokenClient.requestAccessToken({ prompt: "consent" });
}

function createPicker() {
  if (!pickerApiLoaded || !oauthToken) return;
  const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
    .setIncludeFolders(true)
    .setSelectFolderEnabled(true);

  const picker = new google.picker.PickerBuilder()
    .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    .setAppId(appId)
    .setOAuthToken(oauthToken)
    .setDeveloperKey(developerKey)
    .addView(view)
    .setCallback(pickerCallback)
    .build();

  picker.setVisible(true);
}

async function pickerCallback(data) {
  if (data.action === google.picker.Action.PICKED) {
    const docs = data.docs;
    selectedFiles = docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      mimeType: doc.mimeType,
    }));

    const fileList = document.getElementById("pickedFiles");
    fileList.innerHTML = "";

    for (const file of selectedFiles) {
      const li = document.createElement("li");
      li.textContent = `${file.name} (${file.id})`;
      fileList.appendChild(li);

      // Ensure public view-only
      await ensureViewOnly(file.id);
    }
  }
}

// === DRIVE API HELPER ===
async function ensureViewOnly(fileId) {
  try {
    const res = await gapi.client.drive.permissions.list({
      fileId: fileId,
      fields: "permissions(id, type, role)",
    });

    const perms = res.result.permissions || [];
    const anyonePerm = perms.find((p) => p.type === "anyone");

    if (anyonePerm) {
      if (
        anyonePerm.role === "reader" ||
        anyonePerm.role === "commenter" ||
        anyonePerm.role === "writer"
      ) {
        console.log("Already public:", anyonePerm.role);
        return;
      }
    }

    await gapi.client.drive.permissions.create({
      fileId: fileId,
      role: "reader", // view-only
      type: "anyone",
    });

    console.log("Set to Anyone with link (view-only)");
    showToast("Sharing set: Anyone with link (view-only)", "success");
  } catch (err) {
    console.error("Error updating sharing:", err);
    showToast("Failed to update sharing: " + err.message, "danger");
  }
}

window.onload = () => {
  gapiLoaded();
  gisLoaded();
};
