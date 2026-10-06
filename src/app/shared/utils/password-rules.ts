import { AbstractControl, ValidationErrors } from '@angular/forms';

export interface ReglaPassword {
    id: string;
    texto: string;
    cumple: boolean;
}

/** Mismas reglas que valida la API al crear una cuenta. */
export function evaluarPassword(valor: string): ReglaPassword[] {
    return [
        { id: 'largo', texto: 'Al menos 12 caracteres', cumple: valor.length >= 12 },
        { id: 'mayuscula', texto: 'Una letra mayúscula', cumple: /[A-Z]/.test(valor) },
        { id: 'minuscula', texto: 'Una letra minúscula', cumple: /[a-z]/.test(valor) },
        { id: 'numero', texto: 'Un número', cumple: /[0-9]/.test(valor) },
    ];
}

export function passwordNueva(control: AbstractControl): ValidationErrors | null {
    const valor = String(control.value ?? '');
    if (valor === '') return null; // "obligatorio" lo valida Validators.required
    return evaluarPassword(valor).every((regla) => regla.cumple) ? null : { passwordDebil: true };
}