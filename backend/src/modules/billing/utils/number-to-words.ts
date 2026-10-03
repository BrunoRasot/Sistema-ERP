export function numberToWordsSoles(amount: number): string {
  const units = [
    '',
    'UN',
    'DOS',
    'TRES',
    'CUATRO',
    'CINCO',
    'SEIS',
    'SIETE',
    'OCHO',
    'NUEVE',
  ];
  const teens = [
    'DIEZ',
    'ONCE',
    'DOCE',
    'TRECE',
    'CATORCE',
    'QUINCE',
    'DIECISÉIS',
    'DIECISIETE',
    'DIECIOCHO',
    'DIECINUEVE',
  ];
  const tens = [
    '',
    '',
    'VEINTE',
    'TREINTA',
    'CUARENTA',
    'CINCUENTA',
    'SESENTA',
    'SETENTA',
    'OCHENTA',
    'NOVENTA',
  ];
  const hundreds = [
    '',
    'CIENTO',
    'DOSCIENTOS',
    'TRESCIENTOS',
    'CUATROCIENTOS',
    'QUINIENTOS',
    'SEISCIENTOS',
    'SETECIENTOS',
    'OCHOCIENTOS',
    'NOVECIENTOS',
  ];

  function convertGroup(n: number): string {
    let output = '';

    if (n === 100) return 'CIEN';

    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (h > 0) output += hundreds[h] + ' ';

    if (t === 1) {
      output += teens[u];
    } else if (t === 2) {
      if (u === 0) output += 'VEINTE';
      else output += 'VEINTI' + units[u];
    } else if (t > 2) {
      output += tens[t];
      if (u > 0) output += ' Y ' + units[u];
    } else if (u > 0) {
      output += units[u];
    }

    return output.trim();
  }

  const rounded = Math.round(Math.abs(amount) * 100) / 100;
  const integerPart = Math.floor(rounded);
  const decimalPart = Math.round((rounded - integerPart) * 100);
  const centsStr = String(decimalPart).padStart(2, '0');

  if (integerPart === 0) {
    return `SON: CERO CON ${centsStr}/100 SOLES`;
  }

  let words = '';
  const millions = Math.floor(integerPart / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const remainder = integerPart % 1000;

  if (millions > 0) {
    if (millions === 1) words += 'UN MILLÓN ';
    else words += convertGroup(millions) + ' MILLONES ';
  }

  if (thousands > 0) {
    if (thousands === 1) words += 'MIL ';
    else words += convertGroup(thousands) + ' MIL ';
  }

  if (remainder > 0) {
    words += convertGroup(remainder);
  }

  return `SON: ${words.trim()} CON ${centsStr}/100 SOLES`;
}
