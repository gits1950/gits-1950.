// utils.js — Shared helper functions

function formatDate(dateInput) {
  const date     = new Date(dateInput);
  const dayShort = date.toLocaleDateString("en-GB", { weekday: "short" });
  const dd       = String(date.getDate()).padStart(2, "0");
  const mm       = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy     = date.getFullYear();
  return `${dayShort}, ${dd}-${mm}-${yyyy}`;
}

function formatTime(dateInput) {
  return new Date(dateInput).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function isValidMobile(mobile) {
  return /^\d{10}$/.test(String(mobile));
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

module.exports = { formatDate, formatTime, isValidMobile, todayISO };
