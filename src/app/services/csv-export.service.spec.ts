import { TestBed } from '@angular/core/testing';
import { CsvExportService } from './csv-export.service';
import { Expense } from '../models';

const expense: Expense = {
  id: '1',
  date: '1/21/26',
  to: 'Test Payee',
  from: 'Todd W',
  category: 'Food',
  amount: -50,
  account: 'CC-5792',
};

describe('CsvExportService', () => {
  let service: CsvExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsvExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build CSV with same column names as expenses table', () => {
    const csv = service.buildCsv([expense]);
    const firstLine = csv.split('\n')[0];
    expect(firstLine).toBe('Date,To,From,Category,Amount,Account');
  });

  it('should include one data row per expense', () => {
    const csv = service.buildCsv([expense]);
    const lines = csv.split('\n');
    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('1/21/26');
    expect(lines[1]).toContain('Test Payee');
    expect(lines[1]).toContain('Todd W');
    expect(lines[1]).toContain('Food');
    expect(lines[1]).toContain('-$50.00');
    expect(lines[1]).toContain('CC-5792');
  });

  it('should format amount as US currency', () => {
    const csv = service.buildCsv([{ ...expense, amount: -100.5 }]);
    expect(csv).toContain('-$100.50');
  });

  it('should escape fields containing commas', () => {
    const csv = service.buildCsv([{ ...expense, to: 'Payee, Inc.' }]);
    expect(csv).toContain('"Payee, Inc."');
  });

  it('should export multiple expenses', () => {
    const expenses: Expense[] = [
      expense,
      { ...expense, id: '2', to: 'Other', amount: -25 },
    ];
    const csv = service.buildCsv(expenses);
    const lines = csv.split('\n');
    expect(lines.length).toBe(3);
  });

  it('should not include id or possibleDuplicate column in export', () => {
    const csv = service.buildCsv([{ ...expense, possibleDuplicate: true }]);
    expect(csv.split('\n')[0]).toBe('Date,To,From,Category,Amount,Account');
    expect(csv).not.toContain('possibleDuplicate');
    expect(csv).not.toContain('id');
  });

  it('should trigger download when exportToCsv is called', () => {
    const createElementSpy = spyOn(document, 'createElement').and.callThrough();
    const link = { href: '', download: '', click: jasmine.createSpy('click') };
    createElementSpy.and.returnValue(link as unknown as HTMLAnchorElement);

    service.exportToCsv([expense], 'test-export.csv');

    expect(link.download).toBe('test-export.csv');
    expect(link.click).toHaveBeenCalled();
  });
});
