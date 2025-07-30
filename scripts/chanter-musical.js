function insertSongFields(app, html) {
  // Set the dialog size for the key sheet
  app.setPosition({ width: 703, height: 575 });
  // Find the details tab
  const detailsTab = html.find('.tab.active[data-tab="details"] .resource-content.flexcol');
  if (!detailsTab.length) return;

  // Find all select elements for ordering
  const selects = [
    detailsTab.find('select[name="system.data.type"]'),
    detailsTab.find('select[name="system.data.status"]'),
    detailsTab.find('select[name="system.data.attribute"]'),
    detailsTab.find('select[name="system.data.recovery"]')
  ];
  const lastSelect = selects[selects.length - 1];
  if (!lastSelect.length) return;

  // Tone/Tune fields with localization keys
  const songFields = [
    { label: game.i18n.localize("FU.ChanterCalmTone"), flag: "calmToneSong" },
    { label: game.i18n.localize("FU.ChanterEnergeticTone"), flag: "energeticToneSong" },
    { label: game.i18n.localize("FU.ChanterFranticTone"), flag: "franticToneSong" },
    { label: game.i18n.localize("FU.ChanterHauntingTune"), flag: "hauntingTuneSong" },
    { label: game.i18n.localize("FU.ChanterLivelyTone"), flag: "livelyToneSong" },
    { label: game.i18n.localize("FU.ChanterMenacingTone"), flag: "menacingToneSong" },
    { label: game.i18n.localize("FU.ChanterSolemnTone"), flag: "solemnToneSong" }
  ];

  // Build input block for song fields
  let inputBlock = `
    <div class="resource-content flexcol gap-5">
      <div class="resource-label-l" style="font-weight:bold; margin-bottom:4px;">${game.i18n.localize("FU.ChanterSongTitleHeader")}</div>
  `;
  songFields.forEach(field => {
    const value = app.item.getFlag("fabula-ultima-chanter-musical-expansion", field.flag) || "";
    inputBlock += `
      <div class="flexrow align-center">
        <label class="resource-label-m" style="min-width:140px;">${field.label}</label>
        <input type="text" name="flags.fabula-ultima-chanter-musical-expansion.${field.flag}" value="${value}" class="resource-inputs select-dropdown-l" style="flex:1;">
      </div>
    `;
  });
  inputBlock += `</div>`;
  lastSelect.parent().after(inputBlock);
}

function insertPlaylistFieldForChanterClass(app, html) {
  // Find the ritual fieldset
  const fieldset = html.find('fieldset.title-fieldset.desc.resource-content');
  if (!fieldset.length) return;

  // Find the ritual div by label
  const ritualDiv = fieldset.find('div.flex-group-left.resource-content').filter((i, el) => {
    return $(el).find('label.resource-label-l.flexcol').text().trim() === game.i18n.localize("FU.Rituals");
  });
  if (!ritualDiv.length) return;

  // Find the last ritual label
  const lastRitualLabel = ritualDiv.find('label.checkbox').last();
  if (!lastRitualLabel.length) return;

  // Get the playlist value from item flags
  const playlistValue = app.item.getFlag("fabula-ultima-chanter-musical-expansion", "playlist") || "";
  const playlistInput = `
    <div class="resource-content flexcol flex-group-start">
      <label class="resource-label-m">${game.i18n.localize("FU.ChanterPlaylistTitle")}</label>
      <input type="text" name="flags.fabula-ultima-chanter-musical-expansion.playlist" value="${playlistValue}" class="resource-inputs select-dropdown-l">
    </div>
  `;
  lastRitualLabel.after(playlistInput);
}

// Add song fields and playlist field to item sheet
Hooks.on("renderItemSheet", (app, html, data) => {
  if (app.item.type === "classFeature" && app.item.system.featureType === "projectfu.key") {
    insertSongFields(app, html);
  }
  else if (app.item.type === "class" && app.item.system.fuid === "chanter") {
    insertPlaylistFieldForChanterClass(app, html);
  }
});

// Play the correct song from the playlist when a chat message is created
Hooks.on("createChatMessage", async (msg) => {
  if (!msg.flags?.projectfu?.Item?.key || !msg.flags?.projectfu?.Item?.tone) return;

  const actor = game.actors.get(msg.speaker.actor);
  if (!actor) return;

  const keyItem = actor.items.get(msg.flags.projectfu.Item.key);
  const toneItem = actor.items.get(msg.flags.projectfu.Item.tone);
  if (!keyItem || !toneItem) return;

  const chanterClass = actor.items.find(i => i.type === "class" && i.system?.fuid === "chanter");
  const playlistName = chanterClass?.getFlag("fabula-ultima-chanter-musical-expansion", "playlist");
  if (!playlistName) return;

  const playlist = game.playlists.getName(playlistName);
  if (!playlist) return;

  // Map tone/tune to the correct song flag
  let songTitle = "";
  switch (toneItem.system.fuid) {
    case "calm-tone":
      songTitle = keyItem.getFlag("fabula-ultima-chanter-musical-expansion", "calmToneSong");
      break;
    case "energetic-tone":
      songTitle = keyItem.getFlag("fabula-ultima-chanter-musical-expansion", "energeticToneSong");
      break;
    case "frantic-tone":
      songTitle = keyItem.getFlag("fabula-ultima-chanter-musical-expansion", "franticToneSong");
      break;
    case "haunting-tune":
      songTitle = keyItem.getFlag("fabula-ultima-chanter-musical-expansion", "hauntingTuneSong");
      break;
    case "lively-tone":
      songTitle = keyItem.getFlag("fabula-ultima-chanter-musical-expansion", "livelyToneSong");
      break;
    case "menacing-tone":
      songTitle = keyItem.getFlag("fabula-ultima-chanter-musical-expansion", "menacingToneSong");
      break;
    case "solemn-tone":
      songTitle = keyItem.getFlag("fabula-ultima-chanter-musical-expansion", "solemnToneSong");
      break;
    default:
      songTitle = "";
  }

  if (!songTitle) return;

  const track = playlist.sounds.find(s => s.name === songTitle);
  if (track) playlist.playSound(track);
});