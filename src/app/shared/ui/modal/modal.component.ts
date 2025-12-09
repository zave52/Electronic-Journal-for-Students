import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  title = input.required<string>();
  close = output<void>();

  onClose(): void {
    this.close.emit();
  }
}
