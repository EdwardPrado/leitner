const TIMEOUT = 2000
const form = document.getElementById("leitnerForm")

form.addEventListener("submit", async (event) => {
  event.preventDefault()

  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }

  const inputName = document.getElementById("libraryName")
  const inputLink = document.getElementById("libraryLink")

  await chrome.storage.local.set({
    libraryInfo: {
      name: inputName.value,
      link: inputLink.value,
    },
  })

  const saveButton = document.getElementById("save-btn")

  saveButton.value = "Saved"
  saveButton.classList.add("saved")

  setTimeout(() => {
    saveButton.value = "Save"
    saveButton.classList.remove("saved")
  }, TIMEOUT)
})

async function popup() {
  const libraryInfo = await chrome.storage.local
    .get("libraryInfo")
    .then((res) => res.libraryInfo)

  if (libraryInfo) {
    document.getElementById("libraryName").value = libraryInfo.name
    document.getElementById("libraryLink").value = libraryInfo.link
  }
}

popup()
