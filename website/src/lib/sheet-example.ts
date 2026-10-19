import type { DsTable } from "../../../DS1/3-unit/ds-table";

/** The sheet example's year of print sales: 26 columns, 500 rows, the same every time. */
export function fillSheetExample(table: DsTable) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const names = ["Atlas", "Comet", "Harbour", "Linen", "Meadow", "North", "Orchard", "Pebble", "Quarry", "Ridge", "Signal", "Tide"];
  const kinds = ["poster", "print", "card", "zine", "book", "map"];
  const places = ["Kyoto", "Oslo", "Lisbon", "Aarhus", "Porto", "Lyon"];
  let seed = 7;
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  table.columns = [
    { key: "item", label: "Item" }, { key: "kind", label: "Kind" },
    ...months.map(month => ({ key: month, label: month, numeric: true })),
    { key: "total", label: "Total", numeric: true }, { key: "price", label: "Price", numeric: true },
    { key: "revenue", label: "Revenue", numeric: true }, { key: "stock", label: "Stock", numeric: true },
    { key: "reorder", label: "Reorder", numeric: true }, { key: "cost", label: "Cost", numeric: true },
    { key: "margin", label: "Margin", numeric: true }, { key: "place", label: "Printed in" },
    { key: "paper", label: "Paper" }, { key: "code", label: "Code" },
  ];
  const data = Array.from({ length: 500 }, (_, index) => {
    const row: Record<string, string | number> = { item: `${names[index % names.length]} ${Math.floor(index / names.length) + 1}`, kind: kinds[index % kinds.length] };
    let total = 0;
    for (const month of months) { const sold = Math.round(next() * 240); row[month] = sold; total += sold; }
    const price = 8 + Math.round(next() * 72);
    const cost = Math.round(price * (0.3 + next() * 0.3));
    return Object.assign(row, { total, price, revenue: total * price, stock: Math.round(next() * 900), reorder: 50 + Math.round(next() * 150), cost, margin: price - cost, place: places[index % places.length], paper: next() > 0.5 ? "Cotton 300g" : "Recycled 170g", code: `PS-${String(index + 1).padStart(4, "0")}` });
  });
  const sum = (key: string) => data.reduce((all, row) => all + Number(row[key]), 0);
  table.data = data;
  table.footer = { item: "Total", ...Object.fromEntries(months.map(month => [month, sum(month)])), total: sum("total"), revenue: sum("revenue"), stock: sum("stock") };
}
