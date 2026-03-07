import { TestBed } from '@angular/core/testing';
import { CsvImportService } from './csv-import.service';

function csvToFile(csv: string, filename = 'test.csv'): File {
  return new File([csv], filename, { type: 'text/csv' });
}

describe('CsvImportService', () => {
  let service: CsvImportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsvImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should parse valid CSV', async () => {
    const csv = `Date,To,Category,Amount,Account
1/21/26,Test Payee,Food,-$50.00,CC-5792`;
    const result = await service.importCsv(csvToFile(csv));
    expect(result.expenses.length).toBe(1);
    expect(result.expenses[0].to).toBe('Test Payee');
    expect(result.expenses[0].from).toBe('Todd W');
    expect(result.expenses[0].category).toBe('Food');
    expect(result.expenses[0].amount).toBe(-50);
    expect(result.expenses[0].account).toBe('CC-5792');
    expect(result.categories.some((c) => c.id === 'Food')).toBe(true);
    expect(result.accounts.some((a) => a.id === 'CC-5792')).toBe(true);
  });

  it('should use From column when present in CSV', async () => {
    const csv = `Date,To,From,Category,Amount,Account
1/21/26,Test Payee,Jane Doe,Food,-$50.00,CC-5792`;
    const result = await service.importCsv(csvToFile(csv));
    expect(result.expenses.length).toBe(1);
    expect(result.expenses[0].from).toBe('Jane Doe');
  });

  it('should skip empty rows and summary row', async () => {
    const csv = `Date,To,Category,Amount,Account
1/21/26,Payee,Food,-$10.00,CC-1
,,,-$10.00,`;
    const result = await service.importCsv(csvToFile(csv));
    expect(result.expenses.length).toBe(1);
  });

  it('should parse quoted fields with commas', async () => {
    const csv = `Date,To,Category,Amount,Account
1/26/26,"CURSOR, AI POWERED IDE",Software,-$192.00,CC-5792`;
    const result = await service.importCsv(csvToFile(csv));
    expect(result.expenses.length).toBe(1);
    expect(result.expenses[0].to).toBe('CURSOR, AI POWERED IDE');
  });

  it('should return empty arrays for empty or invalid CSV', async () => {
    const emptyResult = await service.importCsv(csvToFile(''));
    expect(emptyResult.expenses).toEqual([]);

    const headerOnlyResult = await service.importCsv(csvToFile('Date,To\n'));
    expect(headerOnlyResult.expenses).toEqual([]);
  });

  describe('parseCsvToExpenseRows', () => {
    it('should parse CSV to rows without id', async () => {
      const csv = `Date,To,From,Category,Amount,Account
1/21/26,Test Payee,Todd W,Food,-$50.00,CC-5792`;
      const rows = await service.parseCsvToExpenseRows(csvToFile(csv));
      expect(rows.length).toBe(1);
      expect(rows[0]).toEqual({
        date: '01/21/26',
        to: 'Test Payee',
        from: 'Todd W',
        category: 'Food',
        amount: -50,
        account: 'CC-5792',
      });
      expect((rows[0] as { id?: string }).id).toBeUndefined();
    });

    it('should default From when missing', async () => {
      const csv = `Date,To,Category,Amount,Account
1/21/26,Payee,Food,-$10.00,CC-1`;
      const rows = await service.parseCsvToExpenseRows(csvToFile(csv));
      expect(rows[0].from).toBe('Todd W');
    });

    it('should skip empty and summary rows', async () => {
      const csv = `Date,To,Category,Amount,Account
1/21/26,A,Food,-$1.00,CC-1
,,,-$1.00,`;
      const rows = await service.parseCsvToExpenseRows(csvToFile(csv));
      expect(rows.length).toBe(1);
    });

    it('should return empty array for empty file', async () => {
      const rows = await service.parseCsvToExpenseRows(csvToFile(''));
      expect(rows).toEqual([]);
    });
  });
});
