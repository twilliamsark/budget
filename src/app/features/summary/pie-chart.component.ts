import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';

export interface PieChartSegment {
  label: string;
  value: number;
}

const PALETTE = [
  '#6750a4',
  '#7d5260',
  '#79747e',
  '#b58392',
  '#a0a0a0',
  '#c4b8c9',
  '#66558e',
  '#8e7cc3',
  '#5c4d7a',
  '#9d8bb5',
];

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './pie-chart.component.html',
  styleUrl: './pie-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartComponent {
  /** Segments: label and amount (negative for expenses). Wedge size = |value| proportion. */
  readonly segments = input.required<PieChartSegment[]>();

  readonly chartData = computed<ChartConfiguration<'pie'>['data']>(() => {
    const segs = this.segments();
    const total = segs.reduce((s, seg) => s + Math.abs(seg.value), 0);
    if (total === 0) {
      return { labels: [], datasets: [{ data: [] }] };
    }
    return {
      labels: segs.map((s) => s.label),
      datasets: [
        {
          data: segs.map((s) => Math.abs(s.value)),
          backgroundColor: segs.map((_, i) => PALETTE[i % PALETTE.length]),
        },
      ],
    };
  });

  readonly chartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };
}
