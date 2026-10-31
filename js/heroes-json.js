/* Danh sách tướng giờ đọc từ game-data/heroes.json. */
const LANES = {
  top: "Đường Tà Thần",
  jg: "Đi rừng",
  mid: "Đường giữa",
  ad: "Đường Rồng",
  sp: "Trợ thủ",
};
const ROLES = {
  tank: "Đỡ đòn",
  fighter: "Đấu sĩ",
  assassin: "Sát thủ",
  mage: "Pháp sư",
  marksman: "Xạ thủ",
  support: "Trợ thủ",
};
const HEROES = [];
window.LQG_prepareHeroes = function (rows) {
  HEROES.splice(0, HEROES.length, ...rows);
};
function createHeroId(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
function getHeroById(id) {
  return HEROES.find((h) => h.id === id) || null;
}
function getHeroesByLane(lane) {
  return lane === "all" ? HEROES : HEROES.filter((h) => h.lanes.includes(lane));
}
function searchHeroes(keyword) {
  const query = createHeroId(String(keyword || "").trim());
  return HEROES.filter((h) => h.id.includes(query));
}
