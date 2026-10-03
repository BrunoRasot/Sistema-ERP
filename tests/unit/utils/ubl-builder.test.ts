import { buildUbl21Xml, VIVELITE_COMPANY, InvoiceData } from '../../../backend/src/modules/billing/utils/ubl-builder';

describe('Unit Test: buildUbl21Xml (SUNAT Electronic Billing XML & QR)', () => {
  const mockBoletaData: InvoiceData = {
    invoiceType: 'BOLETA',
    series: 'B001',
    correlative: 42,
    issueDate: new Date('2026-10-02T12:00:00Z'),
    customer: {
      documentType: 'DNI',
      documentNumber: '71234567',
      name: 'CARLOS LOPEZ',
      address: 'Calle Las Flores 123',
    },
    subtotal: 42.37,
    tax: 7.63,
    total: 50.0,
    items: [
      {
        name: 'Bidón 20L Agua Purificada (Recarga)',
        quantity: 2,
        unitPrice: 25.0,
        totalPrice: 50.0,
      },
    ],
  };

  const mockFacturaData: InvoiceData = {
    invoiceType: 'FACTURA',
    series: 'F001',
    correlative: 105,
    issueDate: new Date('2026-10-02T15:30:00Z'),
    customer: {
      documentType: 'RUC',
      documentNumber: '20556677889',
      name: 'ACME LOGISTICS S.A.C.',
      address: 'Av. Circunvalacion 789',
    },
    subtotal: 169.49,
    tax: 30.51,
    total: 200.0,
    items: [
      {
        name: 'Pack 10 Bidones 20L',
        quantity: 1,
        unitPrice: 200.0,
        totalPrice: 200.0,
      },
    ],
  };

  it('should generate valid XML for Boleta with doc code 03 and clientDocType 1', () => {
    const result = buildUbl21Xml(mockBoletaData);

    expect(result.xml).toContain('<cbc:UBLVersionID>2.1</cbc:UBLVersionID>');
    expect(result.xml).toContain('<cbc:ID>B001-00000042</cbc:ID>');
    expect(result.xml).toContain('<cbc:InvoiceTypeCode listID="0101">03</cbc:InvoiceTypeCode>');
    expect(result.xml).toContain(`<cbc:ID schemeID="6">${VIVELITE_COMPANY.ruc}</cbc:ID>`);
    expect(result.xml).toContain('<cbc:ID schemeID="1">71234567</cbc:ID>');
    expect(result.xml).toContain('CARLOS LOPEZ');
  });

  it('should generate valid XML for Factura with doc code 01 and clientDocType 6', () => {
    const result = buildUbl21Xml(mockFacturaData);

    expect(result.xml).toContain('<cbc:ID>F001-00000105</cbc:ID>');
    expect(result.xml).toContain('<cbc:InvoiceTypeCode listID="0101">01</cbc:InvoiceTypeCode>');
    expect(result.xml).toContain('<cbc:ID schemeID="6">20556677889</cbc:ID>');
    expect(result.xml).toContain('ACME LOGISTICS S.A.C.');
  });

  it('should compute valid SHA-256 base64 hash and match QR code format', () => {
    const result = buildUbl21Xml(mockFacturaData);

    expect(typeof result.hash).toBe('string');
    expect(result.hash.length).toBeGreaterThan(20);

    const qrParts = result.qrText.split('|');
    expect(qrParts.length).toBe(10);
    expect(qrParts[0]).toBe(VIVELITE_COMPANY.ruc);
    expect(qrParts[1]).toBe('01'); // Factura
    expect(qrParts[2]).toBe('F001');
    expect(qrParts[3]).toBe('105');
    expect(qrParts[4]).toBe('30.51'); // IGV
    expect(qrParts[5]).toBe('200.00'); // Total
    expect(qrParts[7]).toBe('6'); // RUC
    expect(qrParts[8]).toBe('20556677889');
    expect(qrParts[9]).toBe(result.hash);
  });

  it('should format line items with unitCode NIU and net calculation', () => {
    const result = buildUbl21Xml(mockBoletaData);

    expect(result.xml).toContain('<cac:InvoiceLine>');
    expect(result.xml).toContain('unitCode="NIU"');
    expect(result.xml).toContain('Bidón 20L Agua Purificada (Recarga)');
  });
});
