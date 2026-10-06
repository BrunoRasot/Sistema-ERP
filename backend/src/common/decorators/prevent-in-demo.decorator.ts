import { SetMetadata } from '@nestjs/common';

export const PREVENT_IN_DEMO_KEY = 'preventInDemo';
export const PreventInDemo = (message?: string) => SetMetadata(PREVENT_IN_DEMO_KEY, message || 'Operación restringida en el entorno de demostración.');
