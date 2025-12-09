import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.full-width]': 'fullWidth()',
  },
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  type = input<'button' | 'submit'>('button');
  fullWidth = input<boolean>(false); // New input

  buttonClasses = computed(() => {
    const base = 'px-4 py-2 font-medium rounded-lg transition-colors flex items-center justify-center gap-2';
    const widthClass = this.fullWidth() ? 'w-full' : '';

    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed',
      secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed',
      danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed',
    };

    const sizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    return `${base} ${widthClass} ${variants[this.variant()]} ${sizes[this.size()]}`;
  });
}
