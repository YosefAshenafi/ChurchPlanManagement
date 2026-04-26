import { Injectable } from '@angular/core';

const ET_EPOCH = 1723855; // JDN of 1 Meskerem 1 E.C. (Ethiopian epoch)

const ET_MONTHS = [
  'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታህሳስ',
  'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዚያ',
  'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን',
];

const ET_DIGITS = ['፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱', '፲',
                   '፲፩', '፲፪', '፲፫', '፲፬', '፲፭', '፲፮', '፲፯', '፲፰', '፲፱', '፳',
                   '፳፩', '፳፪', '፳፫', '፳፬', '፳፭', '፳፮', '፳፯', '፳፰', '፳፱', '፴'];

function toJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yn = y + 4800 - a;
  const mn = m + 12 * a - 3;
  return d + Math.floor((153 * mn + 2) / 5) + 365 * yn + Math.floor(yn / 4)
    - Math.floor(yn / 100) + Math.floor(yn / 400) - 32045;
}

function fromJDN(jdn: number): { year: number; month: number; day: number } {
  const r = (jdn - ET_EPOCH) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year = 4 * Math.floor((jdn - ET_EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month, day };
}

@Injectable({ providedIn: 'root' })
export class EthiopicDateService {
  /** Convert a Gregorian Date to { year, month, day } in the Ethiopian calendar. */
  toEthiopic(date: Date): { year: number; month: number; day: number } {
    const jdn = toJDN(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return fromJDN(jdn);
  }

  /** Return Ethiopic year only, e.g. 2018 */
  getYear(date: Date): number {
    return this.toEthiopic(date).year;
  }

  /**
   * Format as Ethiopic long date, e.g. "19 ሚያዚያ 2018"
   * Uses ASCII digits for the day/year for readability.
   */
  format(date: Date): string {
    const { year, month, day } = this.toEthiopic(date);
    const monthName = ET_MONTHS[month - 1] ?? '';
    return `${day} ${monthName} ${year}`;
  }

  /** Short label: "ሚያዚያ 2018" */
  formatShort(date: Date): string {
    const { year, month } = this.toEthiopic(date);
    return `${ET_MONTHS[month - 1] ?? ''} ${year}`;
  }
}
