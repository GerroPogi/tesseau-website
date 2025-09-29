// === CONFIG ===
const developerKey = "";
const clientId =
  "661671724651-g991at5eiurrroi8aojjnmj8jit9agas.apps.googleusercontent.com";
const appId = "661671724651";
const scope = "https://www.googleapis.com/auth/drive.file";

let oauthToken;
let tokenClient;
let pickerApiLoaded = false;
let selectedFiles = [];
let allReviewers = [];

// === INIT LIBRARIES ===
function gapiLoaded() {
  gapi.load("picker", () => {
    pickerApiLoaded = true;
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
  tokenClient.callback = (tokenResponse) => {
    if (tokenResponse.error) return;
    oauthToken = tokenResponse.access_token;
    createPicker();
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
    selectedFiles.forEach((file) => {
      const li = document.createElement("li");
      li.textContent = `${file.name} (${file.id})`;
      fileList.appendChild(li);
    });
  }
}

window.onload = () => {
  gapiLoaded();
  gisLoaded();
};
