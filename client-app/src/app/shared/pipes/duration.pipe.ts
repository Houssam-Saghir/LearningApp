import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (!value) {
      return '0 min';
    }

    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    if (!hours) {
      return `${minutes} min`;
    }

    return `${hours}h ${minutes}m`;
  }
}
