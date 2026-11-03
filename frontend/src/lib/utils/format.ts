/**
 * Định dạng tiền tệ chuẩn VNĐ (예: 25.000.000 ₫)
 */
export function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Định dạng ngày tháng chuẩn Việt Nam (dd/MM/yyyy) từ chuỗi ISO hoặc DateOnly (yyyy-MM-dd)
 */
export function formatDateVN(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

/**
 * Lấy 2 chữ cái viết tắt từ Họ và Tên để hiển thị Avatar Fallback
 * HRFlow Rule #3: Use avatars and initials in list rows to humanize data.
 */
export function getInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "NV";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const first = words[0][0] ?? "";
  const last = words[words.length - 1][0] ?? "";
  return `${first}${last}`.toUpperCase();
}

