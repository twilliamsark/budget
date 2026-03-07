import {
  defaultReportRange,
  expenseDateSortKey,
  formatToMMDDYY,
  isInRange,
  parseExpenseDate,
  startOfDay,
} from './date-range';

describe('date-range', () => {
  describe('parseExpenseDate', () => {
    it('parses M/D/YY to Date', () => {
      const d = parseExpenseDate('1/21/26');
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2026);
      expect(d!.getMonth()).toBe(0);
      expect(d!.getDate()).toBe(21);
    });

    it('parses MM/DD/YY', () => {
      const d = parseExpenseDate('12/05/25');
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2025);
      expect(d!.getMonth()).toBe(11);
      expect(d!.getDate()).toBe(5);
    });

    it('returns null for empty string', () => {
      expect(parseExpenseDate('')).toBeNull();
      expect(parseExpenseDate('   ')).toBeNull();
    });

    it('returns null for invalid format', () => {
      expect(parseExpenseDate('invalid')).toBeNull();
      expect(parseExpenseDate('1/21')).toBeNull();
    });
  });

  describe('startOfDay', () => {
    it('strips time to midnight', () => {
      const d = new Date(2026, 0, 21, 14, 30, 0);
      const s = startOfDay(d);
      expect(s.getFullYear()).toBe(2026);
      expect(s.getMonth()).toBe(0);
      expect(s.getDate()).toBe(21);
      expect(s.getHours()).toBe(0);
      expect(s.getMinutes()).toBe(0);
    });
  });

  describe('defaultReportRange', () => {
    it('returns end as today and start as one month earlier', () => {
      const { start, end } = defaultReportRange();
      const today = startOfDay(new Date());
      expect(end.getTime()).toBe(today.getTime());
      const oneMonthBefore = new Date(today);
      oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1);
      expect(start.getTime()).toBe(oneMonthBefore.getTime());
    });
  });

  describe('isInRange', () => {
    it('returns true when date is within start and end inclusive', () => {
      const start = new Date(2026, 0, 1);
      const end = new Date(2026, 0, 31);
      const d = new Date(2026, 0, 15);
      expect(isInRange(d, start, end)).toBe(true);
      expect(isInRange(start, start, end)).toBe(true);
      expect(isInRange(end, start, end)).toBe(true);
    });

    it('returns false when date is outside range', () => {
      const start = new Date(2026, 0, 1);
      const end = new Date(2026, 0, 31);
      expect(isInRange(new Date(2025, 11, 31), start, end)).toBe(false);
      expect(isInRange(new Date(2026, 1, 1), start, end)).toBe(false);
    });

    it('returns false for null expense date', () => {
      expect(isInRange(null, new Date(), new Date())).toBe(false);
    });
  });

  describe('formatToMMDDYY', () => {
    it('normalizes m/d/yy to mm/dd/yy', () => {
      expect(formatToMMDDYY('1/21/26')).toBe('01/21/26');
      expect(formatToMMDDYY('12/5/25')).toBe('12/05/25');
    });

    it('leaves already mm/dd/yy unchanged', () => {
      expect(formatToMMDDYY('01/21/26')).toBe('01/21/26');
      expect(formatToMMDDYY('12/05/25')).toBe('12/05/25');
    });

    it('parses yyyy-mm-dd and returns mm/dd/yy', () => {
      expect(formatToMMDDYY('2026-01-21')).toBe('01/21/26');
      expect(formatToMMDDYY('2025-12-05')).toBe('12/05/25');
    });

    it('returns original string when unparseable', () => {
      expect(formatToMMDDYY('invalid')).toBe('invalid');
      expect(formatToMMDDYY('')).toBe('');
    });
  });

  describe('expenseDateSortKey', () => {
    it('returns timestamp for parseable date', () => {
      const key = expenseDateSortKey('01/21/26');
      expect(key).toBe(new Date(2026, 0, 21).getTime());
    });

    it('returns 0 for unparseable date', () => {
      expect(expenseDateSortKey('')).toBe(0);
      expect(expenseDateSortKey('bad')).toBe(0);
    });

    it('orders dates chronologically', () => {
      expect(expenseDateSortKey('01/15/26')).toBeLessThan(expenseDateSortKey('02/01/26'));
      expect(expenseDateSortKey('12/31/25')).toBeLessThan(expenseDateSortKey('01/01/26'));
    });
  });
});
