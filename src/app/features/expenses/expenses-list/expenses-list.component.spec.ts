import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ExpensesListComponent } from './expenses-list.component';
import { Expense } from '../../../models';

const mockExpenses: Expense[] = [
  {
    id: '1',
    date: '1/21/26',
    to: 'Test Payee',
    category: 'Food',
    amount: -50.0,
    account: 'CC-5792',
  },
  {
    id: '2',
    date: '1/22/26',
    to: 'Another Payee',
    category: 'Medical',
    amount: -100.0,
    account: 'Chk-3100',
  },
];

describe('ExpensesListComponent', () => {
  let component: ExpensesListComponent;
  let fixture: ComponentFixture<ExpensesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensesListComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('expenses', mockExpenses);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display expenses', () => {
    // Effect updates dataSource after first CD
    fixture.detectChanges();
    expect(component.dataSource.data.length).toBe(2);
    expect(component.dataSource.data[0].to).toBe('Test Payee');
    expect(component.dataSource.data[1].to).toBe('Another Payee');
  });

  it('should filter by search term', () => {
    component.onSearchChange('Test');
    fixture.detectChanges();
    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].to).toBe('Test Payee');
  });

  it('should filter by category', () => {
    component.onCategoryFilterChange('Medical');
    fixture.detectChanges();
    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].category).toBe('Medical');
  });

  it('should format amount as currency', () => {
    expect(component.formatAmount(-50)).toBe('-$50.00');
  });
});
