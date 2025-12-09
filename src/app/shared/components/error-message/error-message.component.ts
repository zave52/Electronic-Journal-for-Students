import { Component, Input, output } from '@angular/core';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [],
  templateUrl: './error-message.component.html',
  styleUrl: './error-message.component.css',
})
export class ErrorMessageComponent {
  @Input() message: string = 'An error occurred. Please try again later.';
  @Input() showRetry: boolean = true;
  @Input() type: 'error' | 'warning' | 'info' = 'error';

  retry = output<void>();

  get containerClasses(): string {
    const baseClasses = 'rounded-lg p-4 mb-4 flex items-start justify-between';
    const typeClasses = {
      error: 'bg-red-50 border border-red-200 text-red-800',
      warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border border-blue-200 text-blue-800'
    };
    return `${baseClasses} ${typeClasses[this.type]}`;
  }

  get iconClasses(): string {
    const typeClasses = {
      error: 'text-red-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600'
    };
    return typeClasses[this.type];
  }

  onRetry(): void {
    this.retry.emit();
  }
}
