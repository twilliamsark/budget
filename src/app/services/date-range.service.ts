import { Injectable, signal } from '@angular/core';
import { defaultReportRange, toInputDateString } from '../utils/date-range';

/**
 * Shared date range used by Expenses and Summary pages so both show the same range by default
 * and stay in sync when the user changes it on either page.
 */
@Injectable({
  providedIn: 'root',
})
export class DateRangeService {
  private readonly defaultRange = defaultReportRange();

  readonly startDateStr = signal(toInputDateString(this.defaultRange.start));
  readonly endDateStr = signal(toInputDateString(this.defaultRange.end));

  setStart(value: string): void {
    this.startDateStr.set(value || toInputDateString(this.defaultRange.start));
  }

  setEnd(value: string): void {
    this.endDateStr.set(value || toInputDateString(this.defaultRange.end));
  }
}
