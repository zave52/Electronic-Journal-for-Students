import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.css',
})
export class LoaderComponent {
  @Input() mode: 'overlay' | 'inline' = 'inline';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() message?: string;

  get spinnerSizeClass(): string {
    const sizeMap = {
      sm: 'h-6 w-6',
      md: 'h-12 w-12',
      lg: 'h-16 w-16'
    };
    return sizeMap[this.size];
  }
}
