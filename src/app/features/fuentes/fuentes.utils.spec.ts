import { describe, expect, it } from 'vitest';
import type { Fuente } from '@app/core/models/fuente.models';
import { filtrarFuentes } from './fuentes.utils';

const fuente = (id: number, nombre: string, institucion: string, codigo: string, estado: 'activa' | 'inactiva'): Fuente =>
  ({ id, nombre, institucion, codigo, estado }) as Fuente;

const fuentes = [
  fuente(1, 'Catastro Turístico', 'Ministerio de Turismo', 'catastro_turistico', 'activa'),
  fuente(2, 'Siete playas', 'Dirección de Turismo', 'siete_playas', 'inactiva'),
  fuente(3, 'Observatorio', 'UPSE', 'observatorio_upse', 'activa'),
];

describe('filtrarFuentes', () => {
  it('sin texto y en "todas" devuelve todo', () => {
    expect(filtrarFuentes(fuentes, '', 'todas')).toHaveLength(3);
  });

  it('filtra por estado', () => {
    expect(filtrarFuentes(fuentes, '', 'activa').map((f) => f.id)).toEqual([1, 3]);
    expect(filtrarFuentes(fuentes, '', 'inactiva').map((f) => f.id)).toEqual([2]);
  });

  it('busca sin importar mayusculas ni tildes', () => {
    expect(filtrarFuentes(fuentes, 'TURISTICO', 'todas').map((f) => f.id)).toEqual([1]);
    expect(filtrarFuentes(fuentes, 'direccion', 'todas').map((f) => f.id)).toEqual([2]);
  });

  it('busca tambien por codigo e institucion', () => {
    expect(filtrarFuentes(fuentes, 'observatorio_upse', 'todas').map((f) => f.id)).toEqual([3]);
    expect(filtrarFuentes(fuentes, 'upse', 'todas').map((f) => f.id)).toEqual([3]);
  });

  it('combina texto y estado', () => {
    expect(filtrarFuentes(fuentes, 'turismo', 'activa').map((f) => f.id)).toEqual([1]);
  });

  it('un texto sin coincidencias devuelve lista vacia', () => {
    expect(filtrarFuentes(fuentes, 'zzz', 'todas')).toEqual([]);
  });
});