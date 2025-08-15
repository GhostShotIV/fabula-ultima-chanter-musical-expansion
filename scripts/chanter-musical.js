function insertSongFields(app, html) {
  // Set the dialog size for the key sheet
  app.setPosition({ width: 703, height: 675 });
  // Find the details tab
  const detailsTab = html.find(
    '.tab.active[data-tab="details"] .resource-content.flexcol'
  );
  if (!detailsTab.length) return;

  // Find all select elements for ordering
  const selects = [
    detailsTab.find('select[name="system.data.type"]'),
    detailsTab.find('select[name="system.data.status"]'),
    detailsTab.find('select[name="system.data.attribute"]'),
    detailsTab.find('select[name="system.data.recovery"]'),
  ];
  const lastSelect = selects[selects.length - 1];
  if (!lastSelect.length) return;

  // Tone/Tune fields with localization keys
  const songFields = [
    {
      label: game.i18n.localize("FU.ChanterExpansionCalmTone"),
      flag: "calmToneSong",
    },
    {
      label: game.i18n.localize("FU.ChanterExpansionEnergeticTone"),
      flag: "energeticToneSong",
    },
    {
      label: game.i18n.localize("FU.ChanterExpansionFranticTone"),
      flag: "franticToneSong",
    },
    {
      label: game.i18n.localize("FU.ChanterExpansionHauntingTune"),
      flag: "hauntingTuneSong",
    },
    {
      label: game.i18n.localize("FU.ChanterExpansionLivelyTone"),
      flag: "livelyToneSong",
    },
    {
      label: game.i18n.localize("FU.ChanterExpansionMenacingTone"),
      flag: "menacingToneSong",
    },
    {
      label: game.i18n.localize("FU.ChanterExpansionSolemnTone"),
      flag: "solemnToneSong",
    },
  ];

  // Build input block for song fields
  let inputBlock = `
    <div class="resource-content flexcol gap-5">
      <div class="resource-label-l" style="font-weight:bold; margin-bottom:4px;">${game.i18n.localize(
        "FU.ChanterExpansionSongTitleHeader"
      )}</div>
  `;
  songFields.forEach((field) => {
    const value =
      app.item.getFlag("fabula-ultima-chanter-musical-expansion", field.flag) ||
      "";
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
  });
  inputBlock += `</div>`;

  lastSelect.parent().after(inputBlock);

  html.find(".file-picker-button").click((ev) => {
    ev.preventDefault();
    const button = ev.currentTarget;
    const target = button.dataset.target;
    const input = html.find(`input[name="${target}"]`);
    const fp = new FilePicker({
      type: button.dataset.type || "any",
      callback: (path) => input.val(path),
    });
    fp.render(true);
  });
}

function insertPlaylistFieldForChanterClass(app, html) {
  // Find the ritual fieldset
  const fieldset = html.find("fieldset.title-fieldset.desc.resource-content");
  if (!fieldset.length) return;

  // Find the ritual div by label
  const ritualDiv = fieldset
    .find("div.flex-group-left.resource-content")
    .filter((i, el) => {
      return (
        $(el).find("label.resource-label-l.flexcol").text().trim() ===
        game.i18n.localize("FU.Rituals")
      );
    });
  if (!ritualDiv.length) return;

  // Find the last ritual label
  const lastRitualLabel = ritualDiv.find("label.checkbox").last();
  if (!lastRitualLabel.length) return;

  // Get the playlist value from item flags
  const playlistValue =
    app.item.getFlag("fabula-ultima-chanter-musical-expansion", "playlist") ||
    "";
  const playlistInput = `
    <div class="resource-content flexcol flex-group-start">
      <label class="resource-label-m">${game.i18n.localize(
        "FU.ChanterExpansionPlaylistTitle"
      )}</label>
      <input type="text" name="flags.fabula-ultima-chanter-musical-expansion.playlist" value="${playlistValue}" class="resource-inputs select-dropdown-l"> <i>${game.i18n.localize("FU.ChanterExpansionPlaylistHint")}</i>
    </div>
  `;
  lastRitualLabel.after(playlistInput);
}

// Add song fields and playlist field to item sheet
Hooks.on("renderItemSheet", (app, html, data) => {
  if (
    app.item.type === "classFeature" &&
    app.item.system.featureType === "projectfu.key"
  ) {
    insertSongFields(app, html);
  } else if (app.item.type === "class" && app.item.system.fuid === "chanter") {
    insertPlaylistFieldForChanterClass(app, html);
  }
});

function getVolumeModeFromMsg(msg) {
  // Config aus den Flags
  const config = msg.flags?.projectfu?.Item?.config || {};

  // HTML parsen, data-amount auslesen
  const html = $(msg.content);
  const dataAmount = Number(
    html.find("[data-action='applyResourceLoss']").data("amount")
  );

  // Modus ermitteln durch Vergleich
  let mode = null;
  if (dataAmount === config.low) mode = "low";
  else if (dataAmount === config.medium) mode = "medium";
  else if (dataAmount === config.high) mode = "high";

  return { mode, amount: dataAmount };
}

async function fileExists(path) {
  try {
    // Hole den Ordner und alle Dateien in diesem Pfad
    const parts = path.split("/");
    const fileName = parts.pop();
    const folder = parts.join("/");

    const result = await FilePicker.browse("data", folder);

    // Prüfen, ob die Datei in der Liste vorkommt
    return result.files.some(f => f.endsWith(fileName));
  } catch (err) {
    console.warn("Fehler beim Prüfen des Pfads:", path, err);
    return false;
  }
}

// Play the correct song from the playlist when a chat message is created
Hooks.on("createChatMessage", async (msg) => {
  if (!game.settings.get("fabula-ultima-chanter-musical-expansion", "enabled"))
    return;
  if (!msg.flags?.projectfu?.Item?.key || !msg.flags?.projectfu?.Item?.tone)
    return;
  debugger;
  const actor = game.actors.get(msg.speaker.actor);
  if (!actor) return;

  const keyItem = actor.items.get(msg.flags.projectfu.Item.key);
  const toneItem = actor.items.get(msg.flags.projectfu.Item.tone);
  if (!keyItem || !toneItem) return;

  // Map tone/tune to the correct song flag
  let songTitle = "";
  switch (toneItem.system.fuid) {
    case "calm-tone":
      songTitle = keyItem.getFlag(
        "fabula-ultima-chanter-musical-expansion",
        "calmToneSong"
      );
      break;
    case "energetic-tone":
      songTitle = keyItem.getFlag(
        "fabula-ultima-chanter-musical-expansion",
        "energeticToneSong"
      );
      break;
    case "frantic-tone":
      songTitle = keyItem.getFlag(
        "fabula-ultima-chanter-musical-expansion",
        "franticToneSong"
      );
      break;
    case "haunting-tune":
      songTitle = keyItem.getFlag(
        "fabula-ultima-chanter-musical-expansion",
        "hauntingTuneSong"
      );
      break;
    case "lively-tone":
      songTitle = keyItem.getFlag(
        "fabula-ultima-chanter-musical-expansion",
        "livelyToneSong"
      );
      break;
    case "menacing-tone":
      songTitle = keyItem.getFlag(
        "fabula-ultima-chanter-musical-expansion",
        "menacingToneSong"
      );
      break;
    case "solemn-tone":
      songTitle = keyItem.getFlag(
        "fabula-ultima-chanter-musical-expansion",
        "solemnToneSong"
      );
      break;
    default:
      songTitle = "";
  }

  if (!songTitle) return;
  // Determine the volume mode from the chat message
  
  const volumeMode = getVolumeModeFromMsg(msg);
  if (!volumeMode.mode) return;

  const volume =
    game.settings.get(
      "fabula-ultima-chanter-musical-expansion",
      `${volumeMode.mode}Volume`
    ) / 100;

  let trackPath = null;
  
  const chanterClass = actor.items.find(
    (i) => i.type === "class" && i.system?.fuid === "chanter"
  );
  const playlistName = chanterClass?.getFlag(
    "fabula-ultima-chanter-musical-expansion",
    "playlist"
  );

  if (playlistName) {
    const playlist = game.playlists.getName(playlistName);
    if (!playlist) return;

    const track = playlist.sounds.find((s) => s.name === songTitle);
    trackPath = track?.path;
    if (trackPath === null || trackPath === undefined || trackPath === "") {
      trackPath = songTitle;
    }
  }
  if (trackPath) {
    const AH = foundry?.audio?.AudioHelper ?? AudioHelper;
    AH.play({src: trackPath, volume, autoplay: true, loop: false}, true);
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

  game.settings.register(
    "fabula-ultima-chanter-musical-expansion",
    "lowVolume",
    {
      name: game.i18n.localize("FU.ChanterExpansionVolumeLow"),
      hint: game.i18n.localize("FU.ChanterExpansionVolumeLowHint"),
      scope: "client",
      config: true,
      type: Number,
      default: 33,
      range: {
        min: 0,
        max: 100,
        step: 1,
      },
    }
  );

  game.settings.register(
    "fabula-ultima-chanter-musical-expansion",
    "mediumVolume",
    {
      name: game.i18n.localize("FU.ChanterExpansionVolumeMedium"),
      hint: game.i18n.localize("FU.ChanterExpansionVolumeMediumHint"),
      scope: "client",
      config: true,
      type: Number,
      default: 66,
      range: {
        min: 0,
        max: 100,
        step: 1,
      },
    }
  );

  game.settings.register(
    "fabula-ultima-chanter-musical-expansion",
    "highVolume",
    {
      name: game.i18n.localize("FU.ChanterExpansionVolumeHigh"),
      hint: game.i18n.localize("FU.ChanterExpansionVolumeHighHint"),
      scope: "client",
      config: true,
      type: Number,
      default: 100,
      range: {
        min: 0,
        max: 100,
        step: 1,
      },
    }
  );
});
