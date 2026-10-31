/*
 * Thứ tự trang bị theo cửa hàng Liên Quân
 * Mỗi danh mục có 3 cột từ trái sang phải.
 * Mỗi chuỗi liệt kê trang bị từ trên xuống.
 */

const SHOP_ORDER = {
  // CÔNG: 5 + 13 + 14 = 32 món
  atk: [
    "short-sword dagger gloves bloodied-club chain-hammer",

    "cleaving-claymore arcane-hammer tempest-blades astral-spear shuriken bloodthirsty-blade chaos-bow uriels-brand death-curse death-sickle bow-of-slaughter the-diminisher eclipsing-bow",

    "longinus-spear fafnirs-talon claves-sancti muramasa the-beast omni-arms slikks-sting fenrirs-tooth blitz-blade devils-handshake rankbreaker frost-hammer dawning-star stealth-bracer",
  ],

  // PHÉP: 5 + 12 + 13 = 30 món
  mag: [
    "spell-tome lapis-ring pendant-of-faith ancient-scriptures magic-ring",

    "enchanted-scroll trick-blade spooky-mask phoenix-tear virtues-bracelet vlads-impaler staff-of-nuul virtues-necklace orrery evil-secrets tome-of-the-reaper caranos-vow",

    "boomstick hecates-diadem orb-of-the-magi rheas-blessing zweihander frostys-revenge beriths-agony apocalypse soaring-aura holy-of-holies arctic-orb frost-guard carano-robe",
  ],

  // THỦ: 5 + 8 + 10 = 23 món
  def: [
    "ring-of-vitality light-armor gladiators-gauntlets talisman-of-strength necklace-of-vitality",

    "greaves-of-protection heart-of-incubus belt-of-clarity platinum-gauntlets knights-plate mail-of-pain hercules-madness odins-will",

    "mantle-of-ra shield-of-the-lost the-aegis gaias-standard medallion-of-troy blade-of-eternity frost-cape amulet-of-longetivity rock-shield light-shield",
  ],

  // TỐC CHẠY: 1 + 6 = 7 món
  boot: [
    "boots-of-speed",

    "sonic-boots gilded-greaves flashy-boots enchanted-kicks war-boots hermes-select",

    "",
  ],

  // ĐI RỪNG: 1 + 4 + 4 = 9 món
  jg: [
    "kukri",

    "monsters-bane gnoll-cleaver mr-stabby whispering-wind",

    "lokis-curse leviathan soulreaver scorching-wind",
  ],

  // PHỤ TRỢ: 1 + 2 + 10 = 13 món
  sup: [
    "elemental-gem",

    "earth-gem fire-gem",

    "mother-earth-barrier mother-earth-magic-eye mother-earth-surge mother-earth-cleansing mother-earth-spout wildfire-barrier wildfire-magic-eye wildfire-surge wildfire-cleansing wildfire-spout",
  ],
};
