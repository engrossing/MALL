export function generateOrderNo(type: "QUOTE" | "ORDER"): string {
  const prefix = type === "QUOTE" ? "Q" : "O";
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${y}${m}${d}-${rand}`;
}
