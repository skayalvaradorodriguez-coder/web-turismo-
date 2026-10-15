import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconComponent, IconName } from '@app/shared/components/icon/icon.component';

const MENSAJES_BASE: Record<string, string> = {
    required: 'Este campo es obligatorio',
    email: 'Ingresa un correo válido',
    maxlength: 'El texto es demasiado largo',
    minlength: 'El texto es demasiado corto',
};

@Component({
    selector: 'app-field',
    imports: [ReactiveFormsModule, IconComponent],
    template: `
    <div [class.field--invalid]="invalido()">
      <label class="field__label" [for]="fieldId()">{{ label() }}</label>

      <div class="field__box">
        @if (!sinIcono()) {
          <span class="field__icon" aria-hidden="true"><app-icon [name]="icon()" [size]="20" /></span>
        }

        @if (lineas() > 0) {
          <textarea
            class="field__input field__input--plain field__input--area"
            [id]="fieldId()"
            [formControl]="control()"
            [rows]="lineas()"
            [placeholder]="placeholder()"
            [attr.aria-invalid]="invalido()"
            [attr.aria-describedby]="invalido() ? fieldId() + '-msg' : null"
          ></textarea>
        } @else {
          <input
            class="field__input"
            [class.field__input--plain]="sinIcono()"
            [id]="fieldId()"
            [type]="tipoActual()"
            [formControl]="control()"
            [placeholder]="placeholder()"
            [attr.autocomplete]="autocomplete()"
            [attr.inputmode]="inputmode()"
            [attr.aria-invalid]="invalido()"
            [attr.aria-describedby]="invalido() ? fieldId() + '-msg' : null"
            (keydown)="revisarMayusculas($event)"
            (keyup)="revisarMayusculas($event)"
            (blur)="mayusculas.set(false)"
          />
        }

        @if (type() === 'password') {
          <button
            type="button"
            class="field__toggle"
            (click)="visible.set(!visible())"
            [attr.aria-label]="visible() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            [attr.aria-pressed]="visible()"
          >
            <app-icon [name]="visible() ? 'eye-off' : 'eye'" [size]="20" />
          </button>
        }
      </div>

      @if (invalido()) {
        <p class="field__msg field__msg--error" [id]="fieldId() + '-msg'">
          <app-icon name="alert" [size]="15" />{{ mensaje() }}
        </p>
      } @else if (mayusculas()) {
        <p class="field__msg"><app-icon name="info" [size]="15" />Bloq Mayús está activado</p>
      }
    </div>
  `,
    styles: [
        `
      :host { display: block; }
      .field__label { display: block; margin-bottom: 8px; font-size: 0.86rem; font-weight: 600; color: var(--ink); }
      .field__box { position: relative; display: flex; align-items: center; }
      .field__icon { position: absolute; left: 14px; display: flex; color: var(--ink-soft); pointer-events: none; transition: color 0.2s; }
      .field__box:focus-within .field__icon { color: var(--primary); }
      .field__input {
        width: 100%;
        height: 50px;
        padding: 0 48px;
        font: 500 1rem var(--font-body);
        color: var(--ink);
        background: var(--surface-2);
        border: 1.5px solid var(--line);
        border-radius: 14px;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      }
      .field__input--plain { padding: 0 14px; }
      .field__input--area { height: auto; min-height: 110px; padding: 12px 14px; line-height: 1.5; resize: vertical; }
      .field__input::placeholder { color: var(--placeholder); font-weight: 400; opacity: 1; }
      .field__input:hover { border-color: var(--line-strong); }
      .field__input:focus { border-color: var(--primary); background: var(--surface); box-shadow: 0 0 0 4px var(--focus); }
      .field__input:disabled { opacity: 0.7; cursor: not-allowed; background: var(--bg-accent); }
      .field__input:-webkit-autofill {
        -webkit-text-fill-color: var(--ink);
        box-shadow: 0 0 0 1000px var(--surface) inset;
        caret-color: var(--ink);
      }
      .field--invalid .field__input { border-color: var(--danger); }
      .field--invalid .field__input:focus { box-shadow: 0 0 0 4px color-mix(in srgb, var(--danger) 28%, transparent); }
      .field--invalid .field__icon { color: var(--danger); }
      .field__toggle {
        position: absolute;
        right: 6px;
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        color: var(--ink-soft);
        background: transparent;
        border: 0;
        border-radius: 10px;
        cursor: pointer;
      }
      .field__toggle:hover { color: var(--ink); background: var(--bg-accent); }
      .field__toggle:focus-visible { outline: 3px solid var(--focus); }
      .field__msg { display: flex; align-items: center; gap: 6px; margin: 8px 0 0; font-size: 0.84rem; color: var(--ink-soft); }
      .field__msg--error { color: var(--danger); }
    `,
    ],
})
export class FieldComponent {
    readonly control = input.required<FormControl<string>>();
    readonly fieldId = input.required<string>();
    readonly label = input.required<string>();
    readonly type = input<'text' | 'email' | 'password'>('text');
    readonly icon = input<IconName>('mail');
    readonly placeholder = input('');
    readonly autocomplete = input<string>();
    readonly inputmode = input<string>();
    readonly mensajes = input<Record<string, string>>({});
    /** Si es true, el error solo aparece al salir del campo o al enviar, no mientras se escribe */
    readonly soloAlSalir = input(false);
    /** Campos angostos (por ejemplo nombres y apellidos en dos columnas): sin icono para dar mas espacio al texto */
    readonly sinIcono = input(false);
    /** Mayor que 0: el campo es un area de texto con ese numero de lineas (usar junto con sinIcono) */
    readonly lineas = input(0);

    protected readonly visible = signal(false);
    protected readonly mayusculas = signal(false);

    protected tipoActual(): string {
        return this.type() === 'password' && this.visible() ? 'text' : this.type();
    }

    protected invalido(): boolean {
        const c = this.control();
        return c.invalid && (c.touched || (!this.soloAlSalir() && c.dirty));
    }

    protected mensaje(): string {
        const clave = Object.keys(this.control().errors ?? {})[0] ?? '';
        return this.mensajes()[clave] ?? MENSAJES_BASE[clave] ?? 'Revisa este campo';
    }

    protected revisarMayusculas(evento: KeyboardEvent): void {
        if (this.type() === 'password') {
            this.mayusculas.set(evento.getModifierState?.('CapsLock') ?? false);
        }
    }
}