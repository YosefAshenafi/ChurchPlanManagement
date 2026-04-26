import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 0;

  success(message: string, duration = 3500) { this._push(message, 'success', duration); }
  error(message: string, duration = 5000)   { this._push(message, 'error', duration); }
  info(message: string, duration = 3500)    { this._push(message, 'info', duration); }
  warning(message: string, duration = 4000) { this._push(message, 'warning', duration); }

  dismiss(id: number) {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private _push(message: string, type: Toast['type'], duration: number) {
    const id = ++this.nextId;
    this._toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
