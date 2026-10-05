import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'inrCurrency',
  standalone: true
})
export class InrCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, showSign: boolean = false): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '₹0.00';
    }

    const isNegative = value < 0;
    const isPositive = value > 0;
    const absVal = Math.abs(value);

    // Format with Indian numbering format and two decimal places
    const formatted = absVal.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    if (isNegative) {
      return `-₹${formatted}`;
    }
    if (showSign && isPositive) {
      return `+₹${formatted}`;
    }
    return `₹${formatted}`;
  }
}
