export interface Usuario {
    id: number;
    nombres: string;
    apellidos: string;
    email: string;
    rol: string;
}

export interface ApiOk<T> {
    ok: true;
    data: T;
}

export interface ApiErrorBody {
    ok: false;
    code: string;
    message: string;
    details?: { campo: string; mensaje: string }[];
}