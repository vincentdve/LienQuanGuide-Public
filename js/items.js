const ITEM_CATEGORIES = {
  atk: "Công vật lý",
  mag: "Công phép",
  def: "Phòng thủ",
  boot: "Giày",
  jg: "Đi rừng",
  sup: "Trợ thủ",
};

const ITEMS = [];
window.LQG_prepareItems = function (rows) {
  ITEMS.splice(
    0,
    ITEMS.length,
    ...rows
      .map((x) => ({
        id: x.id,
        name: x.name,
        category: x.category,
        image: `images/items/i-${x.imageSlug || x.id}.webp`,
        price: x.price,
        stats: x.stats || [],
        passives: x.passives || [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi")),
  );
};

function getItemById(id) {
  return ITEMS.find((item) => item.id === id) || null;
}

function getItemsByCategory(category) {
  if (!category || category === "all") {
    return ITEMS;
  }

  return ITEMS.filter((item) => item.category === category);
}

function searchItems(keyword) {
  const query = String(keyword ?? "")
    .trim()
    .toLocaleLowerCase("vi");

  return ITEMS.filter((item) =>
    item.name.toLocaleLowerCase("vi").includes(query),
  );
}
