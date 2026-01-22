// === Constants ===
const BASE = "https://fsa-crud-2aa9294fe819.herokuapp.com/api";
const COHORT = "/2511-FTB-CT-WEB-PT-Justin"; // ✅ REQUIRED: set this to your cohort, ex: "/2511-FTB-CT-WEB-PT"
const API = BASE + COHORT;

// === State ===
let parties = [];
let selectedParty;
let rsvps = [];
let guests = [];

// Small helper: rerender after state changes
function rerender() {
  render();
}

// === API Calls (State Updaters) ===

/** Updates state with all parties from the API */
async function getParties() {
  try {
    const response = await fetch(API + "/events");
    const result = await response.json();

    parties = result.data ?? [];
    rerender();
  } catch (e) {
    console.error("getParties error:", e);
  }
}

/** Updates state with a single party from the API */
async function getParty(id) {
  try {
    const response = await fetch(API + "/events/" + id);
    const result = await response.json();

    selectedParty = result.data;
    rerender();
  } catch (e) {
    console.error("getParty error:", e);
  }
}

/** Updates state with all RSVPs from the API */
async function getRsvps() {
  try {
    const response = await fetch(API + "/rsvps");
    const result = await response.json();

    rsvps = result.data ?? [];
    rerender();
  } catch (e) {
    console.error("getRsvps error:", e);
  }
}

/** Updates state with all guests from the API */
async function getGuests() {
  try {
    const response = await fetch(API + "/guests");
    const result = await response.json();

    guests = result.data ?? [];
    rerender();
  } catch (e) {
    console.error("getGuests error:", e);
  }
}

/** Creates a new party via POST, then refreshes parties */
async function addParty(partyData) {
  try {
    const response = await fetch(API + "/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partyData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("addParty failed:", result);
      alert(result?.error?.message ?? "Failed to add party.");
      return;
    }

    // Refresh parties list
    await getParties();

    // Optional: auto-select newly created party if returned
    // selectedParty = result.data;
    // rerender();
  } catch (e) {
    console.error("addParty error:", e);
  }
}

/** Deletes a party via DELETE, then refreshes parties */
async function deleteParty(id) {
  try {
    const response = await fetch(API + "/events/" + id, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("deleteParty failed:", result);
      alert(result?.error?.message ?? "Failed to delete party.");
      return;
    }

    // Clear selection if the selected party was deleted
    if (selectedParty?.id === id) selectedParty = undefined;

    await getParties();
    rerender();
  } catch (e) {
    console.error("deleteParty error:", e);
  }
}

// === Components ===

/** Party name that shows more details about the party when clicked */
function PartyListItem(party) {
  const $li = document.createElement("li");

  if (party.id === selectedParty?.id) {
    $li.classList.add("selected");
  }

  $li.innerHTML = `<a href="#selected">${party.name}</a>`;
  $li.addEventListener("click", () => getParty(party.id));

  return $li;
}

/** A list of names of all parties */
function PartyList() {
  const $ul = document.createElement("ul");
  $ul.classList.add("parties");

  const $items = parties.map(PartyListItem);
  $ul.replaceChildren(...$items);

  return $ul;
}

/** Form to create a new party */
function PartyForm() {
  const $form = document.createElement("form");

  $form.innerHTML = `
    <h2>Add a New Party</h2>

    <label>
      Name
      <input name="name" required />
    </label>

    <label>
      Description
      <input name="description" required />
    </label>

    <label>
      Date
      <input name="date" type="date" required />
    </label>

    <label>
      Location
      <input name="location" required />
    </label>

    <button type="submit">Add Party</button>
  `;

  $form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData($form);
    const name = (formData.get("name") ?? "").toString().trim();
    const description = (formData.get("description") ?? "").toString().trim();
    const dateFromForm = (formData.get("date") ?? "").toString(); // "YYYY-MM-DD"
    const location = (formData.get("location") ?? "").toString().trim();

    // ✅ API requires ISO string
    const isoDate = new Date(dateFromForm).toISOString();

    await addParty({
      name,
      description,
      date: isoDate,
      location,
    });

    $form.reset();
  });

  return $form;
}

/** Detailed information about the selected party */
function SelectedParty() {
  if (!selectedParty) {
    const $p = document.createElement("p");
    $p.textContent = "Please select a party to learn more.";
    return $p;
  }

  const $party = document.createElement("section");
  $party.innerHTML = `
    <h3>${selectedParty.name} #${selectedParty.id}</h3>
    <time datetime="${selectedParty.date}">
      ${selectedParty.date?.slice?.(0, 10) ?? ""}
    </time>
    <address>${selectedParty.location}</address>
    <p>${selectedParty.description}</p>

    <button id="delete">Delete Party</button>

    <GuestList></GuestList>
  `;

  $party.querySelector("#delete").addEventListener("click", () => {
    deleteParty(selectedParty.id);
  });

  $party.querySelector("GuestList").replaceWith(GuestList());

  return $party;
}

/** List of guests attending the selected party */
function GuestList() {
  const $ul = document.createElement("ul");

  // If nothing is selected, show nothing (SelectedParty handles message)
  if (!selectedParty) return $ul;

  const guestsAtParty = guests.filter((guest) =>
    rsvps.find(
      (rsvp) => rsvp.guestId === guest.id && rsvp.eventId === selectedParty.id
    )
  );

  const $guestLis = guestsAtParty.map((guest) => {
    const $li = document.createElement("li");
    $li.textContent = guest.name;
    return $li;
  });

  $ul.replaceChildren(...$guestLis);
  return $ul;
}

// === Render ===
function render() {
  const $app = document.querySelector("#app");
  $app.innerHTML = `
    <h1>Party Planner</h1>
    <main>
      <section>
        <h2>Upcoming Parties</h2>
        <PartyList></PartyList>
      </section>

      <section>
        <PartyForm></PartyForm>
      </section>

      <section id="selected">
        <h2>Party Details</h2>
        <SelectedParty></SelectedParty>
      </section>
    </main>
  `;

  $app.querySelector("PartyList").replaceWith(PartyList());
  $app.querySelector("PartyForm").replaceWith(PartyForm());
  $app.querySelector("SelectedParty").replaceWith(SelectedParty());
}

// === Init ===
async function init() {
  await getParties();
  await getRsvps();
  await getGuests();
  render();
}

init();
