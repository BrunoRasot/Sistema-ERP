import { numberToWordsSoles } from '../../../backend/src/modules/billing/utils/number-to-words';

describe('Unit Test: numberToWordsSoles (SUNAT Legal Format)', () => {
  it('should format zero amount with "SON: CERO" and exact cents', () => {
    expect(numberToWordsSoles(0)).toBe('SON: CERO CON 00/100 SOLES');
    expect(numberToWordsSoles(0.5)).toBe('SON: CERO CON 50/100 SOLES');
    expect(numberToWordsSoles(0.99)).toBe('SON: CERO CON 99/100 SOLES');
  });

  it('should format basic units and teens correctly', () => {
    expect(numberToWordsSoles(1.0)).toBe('SON: UN CON 00/100 SOLES');
    expect(numberToWordsSoles(5.0)).toBe('SON: CINCO CON 00/100 SOLES');
    expect(numberToWordsSoles(15.25)).toBe('SON: QUINCE CON 25/100 SOLES');
    expect(numberToWordsSoles(16.0)).toBe('SON: DIECISÉIS CON 00/100 SOLES');
  });

  it('should format twenties and compound tens correctly', () => {
    expect(numberToWordsSoles(20.0)).toBe('SON: VEINTE CON 00/100 SOLES');
    expect(numberToWordsSoles(24.5)).toBe('SON: VEINTICUATRO CON 50/100 SOLES');
    expect(numberToWordsSoles(35.0)).toBe('SON: TREINTA Y CINCO CON 00/100 SOLES');
    expect(numberToWordsSoles(99.99)).toBe('SON: NOVENTA Y NUEVE CON 99/100 SOLES');
  });

  it('should format hundreds correctly including exact CIEN and CIENTO', () => {
    expect(numberToWordsSoles(100.0)).toBe('SON: CIEN CON 00/100 SOLES');
    expect(numberToWordsSoles(101.0)).toBe('SON: CIENTO UN CON 00/100 SOLES');
    expect(numberToWordsSoles(500.0)).toBe('SON: QUINIENTOS CON 00/100 SOLES');
    expect(numberToWordsSoles(999.0)).toBe('SON: NOVECIENTOS NOVENTA Y NUEVE CON 00/100 SOLES');
  });

  it('should format thousands correctly (exact 1000 and multiple thousands)', () => {
    expect(numberToWordsSoles(1000.0)).toBe('SON: MIL CON 00/100 SOLES');
    expect(numberToWordsSoles(1250.5)).toBe('SON: MIL DOSCIENTOS CINCUENTA CON 50/100 SOLES');
    expect(numberToWordsSoles(2000.0)).toBe('SON: DOS MIL CON 00/100 SOLES');
    expect(numberToWordsSoles(15420.8)).toBe('SON: QUINCE MIL CUATROCIENTOS VEINTE CON 80/100 SOLES');
  });

  it('should handle large amounts (millions) without undefined bugs', () => {
    expect(numberToWordsSoles(1000000.0)).toBe('SON: UN MILLÓN CON 00/100 SOLES');
    expect(numberToWordsSoles(2500000.0)).toBe('SON: DOS MILLONES QUINIENTOS MIL CON 00/100 SOLES');
  });

  it('should handle negative numbers gracefully using absolute value', () => {
    expect(numberToWordsSoles(-45.5)).toBe('SON: CUARENTA Y CINCO CON 50/100 SOLES');
  });
});
