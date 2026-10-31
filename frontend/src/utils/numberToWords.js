// Convert a number to Indian-English words (lakh/crore system).
// e.g. 123456 -> "One Lakh Twenty Three Thousand Four Hundred Fifty Six"
const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const twoDigits = (n) => {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? " " + ONES[o] : ""}`;
};

const threeDigits = (n) => {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let out = "";
  if (h) out += `${ONES[h]} Hundred`;
  if (rest) out += `${h ? " " : ""}${twoDigits(rest)}`;
  return out;
};

const toWords = (num) => {
  if (num === 0) return "Zero";
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  const parts = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(" ");
};

// Returns "Rupees ... only" (with paise if present).
export const amountToWords = (amount) => {
  const value = Math.max(0, Number(amount) || 0);
  const rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);
  let out = `Rupees ${toWords(rupees)}`;
  if (paise) out += ` and ${toWords(paise)} Paise`;
  return `${out} only`;
};
