import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { PieChartComponent } from './pie-chart.component';

describe('PieChartComponent', () => {
  let component: PieChartComponent;
  let fixture: ComponentFixture<PieChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieChartComponent],
      providers: [provideCharts(withDefaultRegisterables())],
    }).compileComponents();

    fixture = TestBed.createComponent(PieChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('segments', []);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show no-data when segments are empty', () => {
    fixture.componentRef.setInput('segments', []);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.no-data')).toBeTruthy();
    expect(el.textContent).toContain('No data to display');
  });

  it('should render chart when segments have data', () => {
    fixture.componentRef.setInput('segments', [
      { label: 'Food', value: -100 },
      { label: 'Medical', value: -50 },
    ]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.no-data')).toBeFalsy();
    expect(el.querySelector('canvas')).toBeTruthy();
  });

  it('should compute chartData with labels and absolute values', () => {
    fixture.componentRef.setInput('segments', [
      { label: 'A', value: -60 },
      { label: 'B', value: -40 },
    ]);
    fixture.detectChanges();
    const data = component.chartData();
    expect(data.labels).toEqual(['A', 'B']);
    expect(data.datasets?.[0].data).toEqual([60, 40]);
    expect(data.datasets?.[0].backgroundColor).toBeDefined();
    expect((data.datasets?.[0].backgroundColor as string[]).length).toBe(2);
  });

  it('should return empty chartData when all segments are zero', () => {
    fixture.componentRef.setInput('segments', [
      { label: 'X', value: 0 },
    ]);
    fixture.detectChanges();
    const data = component.chartData();
    expect(data.labels).toEqual([]);
    expect(data.datasets?.[0].data).toEqual([]);
  });
});
