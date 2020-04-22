import {Injectable, TemplateRef} from '@angular/core';

@Injectable({providedIn: 'root'})
export class ToastService {
  toasts: any[] = [];

  show(text: string | TemplateRef<any>, options: { classname?: string, delay?: number } = {}) {
    this.toasts.push({textOrTpl: text, ...options});
  }

  remove(toast) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }

  success(text: string) {
    this.show(text, {classname: 'bg-success text-light px-5', delay: 2000});
  }

  error(text: string) {
    this.show(text, {classname: 'bg-danger text-light px-5', delay: 15000});
  }


  info(text: string) {
    this.show(text, {classname: 'bg-info text-dark px-5'});
  }
}
