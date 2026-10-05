import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
          <h3 class="text-base font-bold text-slate-900">{{ title }}</h3>
          <p class="text-sm text-slate-500 mt-2">{{ message }}</p>
          <div class="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              (click)="onCancel.emit()"
              class="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="onConfirm.emit()"
              class="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Deletion';
  @Input() message = 'Are you sure you want to delete this record?';
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
}
