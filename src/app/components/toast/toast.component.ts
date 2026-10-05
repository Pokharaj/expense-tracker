import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackerService } from '../../services/tracker.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none">
      @for (t of tracker.toasts(); track t.id) {
        <div
          class="pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center space-x-2 transition-all transform animate-bounce-short"
          [ngClass]="{
            'bg-emerald-900/90 text-white border-emerald-700': t.type === 'success',
            'bg-rose-900/90 text-white border-rose-700': t.type === 'error',
            'bg-slate-900/90 text-white border-slate-700': t.type === 'info'
          }"
        >
          <span>{{ t.message }}</span>
          <button
            type="button"
            (click)="tracker.removeToast(t.id)"
            class="ml-2 text-white/70 hover:text-white focus:outline-none"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  readonly tracker = inject(TrackerService);
}
