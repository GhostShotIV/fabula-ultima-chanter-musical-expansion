function insertSongFieldsV2(app, rootEl) {
  // Resize (ApplicationV2: use the window element, not setPosition from v1)
  const win = rootEl.closest(".window-app");
  if (win) {
    win.style.width = "703px";
    win.style.height = "675px";
  } else if (app?.window?.setSize) {
    // Some v13 builds expose setSize on the window wrapper
    app.window.setSize(703, 675);
  }

  // Find the details tab
  const detailsTab = rootEl.querySelector('.tab.active[data-tab="details"] .resource-content.flexcol');
  if (!detailsTab) return;

  // Find all select elements for ordering
  const selects = [
    detailsTab.querySelector('select[name="system.data.type"]'),
    detailsTab.querySelector('select[name="system.data.status"]'),
    detailsTab.querySelector('select[name="system.data.attribute"]'),
    detailsTab.querySelector('select[name="system.data.resource"]'),
  ].filter(Boolean);

  const lastSelect = selects.at(-1);
  if (!lastSelect) return;

  // Tone/Tune fields with localization keys
  const songFields = [
    { label: game.i18n.localize("FU.ChanterExpansionCalmTone"),      flag: "calmToneSong" },
    { label: game.i18n.localize("FU.ChanterExpansionEnergeticTone"), flag: "energeticToneSong" },
    { label: game.i18n.localize("FU.ChanterExpansionFranticTone"),   flag: "franticToneSong" },
    { label: game.i18n.localize("FU.ChanterExpansionHauntingTune"),  flag: "hauntingTuneSong" },
    { label: game.i18n.localize("FU.ChanterExpansionLivelyTone"),    flag: "livelyToneSong" },
    { label: game.i18n.localize("FU.ChanterExpansionMenacingTone"),  flag: "menacingToneSong" },
    { label: game.i18n.localize("FU.ChanterExpansionSolemnTone"),    flag: "solemnToneSong" },
  ];

  let inputBlock = `
    <div class="resource-content flexcol gap-5">
      <div class="resource-label-l" style="font-weight:bold; margin-bottom:4px;">
        ${game.i18n.localize("FU.ChanterExpansionSongTitleHeader")}
      </div>
  `;

  for (const field of songFields) {
    const value = app.item.getFlag("fabula-ultima-chanter-musical-expansion", field.flag) ?? "";
    console.log(`Loaded ${field.flag}: "${value}"`);
    inputBlock += `
      <div class="flexrow align-center">
        <label class="resource-label-m">${field.label}</label>
        <input type="text"
               name="flags.fabula-ultima-chanter-musical-expansion.${field.flag}"
               value="${value}"
               class="resource-inputs select-dropdown-l"
               style="flex:1;">
        <button type="button"
                class="file-picker-button"
                data-type="audio"
                data-target="flags.fabula-ultima-chanter-musical-expansion.${field.flag}">
          <i class="fas fa-music"></i>
        </button>
      </div>
    `;
  }
  inputBlock += `</div>`;

  // Insert after the last select's parent container
  const parent = lastSelect.parentElement ?? lastSelect;
  parent.parentElement.insertAdjacentHTML("afterend", inputBlock);

  // Wire up file picker buttons in this sheet
  for (const btn of rootEl.querySelectorAll(".file-picker-button")) {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      const target = btn.dataset.target;
      const input = rootEl.querySelector(`input[name="${target}"]`);
      input.addEventListener("change", () => {
        console.log(`Input changed for ${target}: "${input.value}"`);
      });
      // Kompatibilität mit V12 und V13: Verwende namespaced FilePicker falls verfügbar, sonst global
      const FilePickerClass = foundry?.applications?.apps?.FilePicker || FilePicker;
      console.log("Available FilePicker sources:", FilePicker.sources);
      const fp = new FilePickerClass({
        type: btn.dataset.type || "any",
        sources: Object.keys(FilePicker.sources),  // Explizit alle verfügbaren Quellen aktivieren
        callback: (path) => {
          if (input) {
            input.value = path;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`File selected for ${target}: "${path}"`);
          }
        },
      });
      fp.render(true);
      console.log(`File picker opened for ${target}`);
    });
  }
}

function insertPlaylistFieldForChanterClassV2(app, element) {
  // Sicherstellen, dass wir ein HTMLElement haben (nicht jQuery)
  const rootEl = element instanceof HTMLElement ? element : element?.[0];
  if (!rootEl) return;

  // Wir warten einen Frame, falls die Inhalte asynchron reinkommen.
  requestAnimationFrame(() => {
    // Manche Sheets nutzen Shadow DOM – dann dort suchen.
    const scope = rootEl.shadowRoot ?? rootEl;

    // 1) Versuche, den "Rituals"-Block über sein Label zu finden.
    const ritualsText = game.i18n.localize("FU.Rituals") || "Rituals";
    const ritualsLabel = Array
      .from(scope.querySelectorAll('label.resource-label-l.flexcol, label.resource-label-l'))
      .find(l => l.textContent.trim() === ritualsText);

    // Der Anker ist der nächstgelegene .resource-content-Container
    let anchor = ritualsLabel ? ritualsLabel.closest('.resource-content') : null;

    // 2) Wenn kein Rituals gefunden: nimm den letzten .resource-content,
    //    der Checkboxen enthält (dein Beispiel: Free Benefits / Martial / Rituals etc.).
    if (!anchor) {
      const checkboxGroups = Array.from(scope.querySelectorAll('.resource-content'))
        .filter(rc => rc.querySelector('label.checkbox'));
      if (checkboxGroups.length) anchor = checkboxGroups.at(-1);
    }

    // 3) Wenn immer noch nichts: nimm einfach den letzten .resource-content im sichtbaren Bereich.
    if (!anchor) {
      const groups = scope.querySelectorAll('.resource-content');
      if (groups.length) anchor = groups[groups.length - 1];
    }

    // 4) Fallback: ans Ende des Formulars.
    const form = scope.querySelector('form') ?? scope;
    if (!anchor && !form) return;

    // Flag-Wert laden
    const playlistValue = app.item.getFlag(
      "fabula-ultima-chanter-musical-expansion",
      "playlist"
    ) ?? "";

    // Einzufügender Block
    const playlistInput = `
      <div class="resource-content flexcol flex-group-start">
        <label class="resource-label-m">${game.i18n.localize("FU.ChanterExpansionPlaylistTitle")}</label>
        <input type="text"
               name="flags.fabula-ultima-chanter-musical-expansion.playlist"
               value="${playlistValue}"
               class="resource-inputs select-dropdown-l">
        <i>${game.i18n.localize("FU.ChanterExpansionPlaylistHint")}</i>
      </div>
    `;

    if (anchor) {
      anchor.insertAdjacentHTML('afterend', playlistInput);
    } else {
      form.insertAdjacentHTML('beforeend', playlistInput);
    }
  });
}

// v13: use V2 hook names, and `element` is an HTMLElement.
Hooks.on("renderItemSheetV2", (app, element /* HTMLElement */, options) => {
  try {
    const isKey = app.item.type === "classFeature" && app.item.system?.featureType === "projectfu.key";
    const isChanter = app.item.type === "class" && app.item.system?.fuid === "chanter";

    if (isKey) insertSongFieldsV2(app, element);
    else if (isChanter) insertPlaylistFieldForChanterClassV2(app, element);
  } catch (err) {
    console.error("Chanter expansion sheet injection failed:", err);
  }
});

Hooks.on("updateItem", (item, data, options, userId) => {
  if (item.type === "classFeature" && item.system?.featureType === "projectfu.key") {
    console.log("Item updated:", data);
    if (data.flags?.["fabula-ultima-chanter-musical-expansion"]) {
      console.log("Flags updated:", data.flags["fabula-ultima-chanter-musical-expansion"]);
    }
  }
});

/* ---------- everything below remains unchanged ---------- */

function getVolumeModeFromMsg(msg) {
  const config = msg.flags?.projectfu?.Item?.config || {};
  const html = $(msg.content);
  const dataAmount = Number(html.find("[data-action='applyResourceLoss']").data("amount"));
  let mode = null;
  if (dataAmount === config.low) mode = "low";
  else if (dataAmount === config.medium) mode = "medium";
  else if (dataAmount === config.high) mode = "high";
  return { mode, amount: dataAmount };
}

async function fileExists(path) {
  try {
    const parts = path.split("/");
    const fileName = parts.pop();
    const folder = parts.join("/");
    const result = await FilePicker.browse("data", folder);
    return result.files.some((f) => f.endsWith(fileName));
  } catch (err) {
    console.warn("Fehler beim Prüfen des Pfads:", path, err);
    return false;
  }
}

// Helper: Normalize potential embedded item IDs (like ".Item.mQFeWnDOCb0ZlvvZ") to a plain ID
function normalizeItemId(value) {
  if (!value) return null;
  if (typeof value !== "string") return value;
  const v = value.trim();

  // /Item.<id>/ pattern
  let m = v.match(/(?:^|\.)(?:Item|item)\.([A-Za-z0-9]+)/);
  if (m) return m[1];

  // /Item:<id>/ pattern
  m = v.match(/(?:Item|item):\s*([A-Za-z0-9]+)/);
  if (m) return m[1];

  // Fallback: last token after dot, slash, or colon
  const last = v.split(/[\.:\/]/).pop();
  return last || v;
}

// Play the correct song from the playlist when a chat message is created
Hooks.on("createChatMessage", async (msg) => {
  if (!game.settings.get("fabula-ultima-chanter-musical-expansion", "enabled"))
    return;
  if (!msg.flags?.projectfu?.Item?.key || !msg.flags?.projectfu?.Item?.tone)
    return;

  // Normalize incoming key/tone references (handles cases like ".Item.<id>")
  const rawKey = msg.flags.projectfu.Item.key;
  const rawTone = msg.flags.projectfu.Item.tone;
  const keyId = normalizeItemId(rawKey);
  const toneId = normalizeItemId(rawTone);

  const actor = game.actors.get(msg.speaker.actor);
  if (!actor) return;

  const keyItem = actor.items.get(keyId);
  const toneItem = actor.items.get(toneId);
  if (!keyItem || !toneItem) return;

  let songTitle = "";
  switch (toneItem.system.fuid) {
    case "calm-tone":
      songTitle = keyItem.getFlag("fabula-ultima-chanter-musical-expansion", "calmToneSong"); break;
    case "energetic-tone":
      songTitle = keyItem.getFlag("fabula-ultima-chanter-musical-expansion", "energeticToneSong"); break;
    case "frantic-tone":
      songTitle = keyItem.getFlag("fabula-ultima-chanter-musical-expansion", "franticToneSong"); break;
    case "haunting-tune":
      songTitle = keyItem.getFlag("fabula-ultima-chanter-musical-expansion", "hauntingTuneSong"); break;
    case "lively-tone":
      songTitle = keyItem.getFlag("fabula-ultima-chanter-musical-expansion", "livelyToneSong"); break;
    case "menacing-tone":
      songTitle = keyItem.getFlag("fabula-ultima-chanter-musical-expansion", "menacingToneSong"); break;
    case "solemn-tone":
      songTitle = keyItem.getFlag("fabula-ultima-chanter-musical-expansion", "solemnToneSong"); break;
    default: songTitle = "";
  }
  if (!songTitle) return;

  const volumeMode = getVolumeModeFromMsg(msg);
  if (!volumeMode.mode) return;

  const volume = game.settings.get("fabula-ultima-chanter-musical-expansion", `${volumeMode.mode}Volume`) / 100;

    let trackPath = null;

  // 1) Prefer explicit playlist on the class
  const chanterClass = actor.items.find((i) => i.type === "class" && i.system?.fuid === "chanter");
  const playlistName = chanterClass?.getFlag("fabula-ultima-chanter-musical-expansion", "playlist");

  if (playlistName) {
    const playlist = game.playlists.getName(playlistName);
    if (playlist) {
      const track = playlist.sounds.find((s) => s.name === songTitle);
      trackPath = track?.path ?? null;
    }
    // NOTE: do NOT return early if playlist/sound is missing — we fall back below
  }

  // 2) If not resolved yet, allow raw file path/URL in the flag (e.g. "sounds/chanter/lively.mp3")
  if (!trackPath) {
    const looksLikePath =
      /^(https?:\/\/|data:audio\/|[^?]+\.(mp3|ogg|wav|webm|m4a|flac)(\?.*)?$)/i.test(songTitle) ||
      songTitle.includes("/");
    if (looksLikePath) {
      trackPath = songTitle;
    }
  }

  // 3) As a last resort, search ALL playlists by sound name
  if (!trackPath) {
    for (const pl of game.playlists) {
      const hit = pl.sounds.find((s) => s.name === songTitle);
      if (hit?.path) {
        trackPath = hit.path;
        break;
      }
    }
  }

  if (trackPath) {
    const AH = foundry?.audio?.AudioHelper ?? AudioHelper;

    // Prevent duplicate playback if the same sound is already playing
    const players = foundry?.audio?.players ?? {};
    const isPlaying = Object.values(players).some((p) => {
      const src = String(p?.src || p?.audio?.src || p?.options?.src || "");
      return src && src.includes(trackPath);
    });

    if (!isPlaying) {
      AH.play({ src: trackPath, volume, autoplay: true, loop: false }, true);
    }
  }
});

Hooks.once("init", () => {
  game.settings.register("fabula-ultima-chanter-musical-expansion", "enabled", {
    name: game.i18n.localize("FU.ChanterExpansionEnable"),
    hint: game.i18n.localize("FU.ChanterExpansionEnableHint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("fabula-ultima-chanter-musical-expansion", "lowVolume", {
    name: game.i18n.localize("FU.ChanterExpansionVolumeLow"),
    hint: game.i18n.localize("FU.ChanterExpansionVolumeLowHint"),
    scope: "client",
    config: true,
    type: Number,
    default: 33,
    range: { min: 0, max: 100, step: 1 },
  });

  game.settings.register("fabula-ultima-chanter-musical-expansion", "mediumVolume", {
    name: game.i18n.localize("FU.ChanterExpansionVolumeMedium"),
    hint: game.i18n.localize("FU.ChanterExpansionVolumeMediumHint"),
    scope: "client",
    config: true,
    type: Number,
    default: 66,
    range: { min: 0, max: 100, step: 1 },
  });

  game.settings.register("fabula-ultima-chanter-musical-expansion", "highVolume", {
    name: game.i18n.localize("FU.ChanterExpansionVolumeHigh"),
    hint: game.i18n.localize("FU.ChanterExpansionVolumeHighHint"),
    scope: "client",
    config: true,
    type: Number,
    default: 100,
    range: { min: 0, max: 100, step: 1 },
  });
});
