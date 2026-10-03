import { SunatMockServer } from '../../mocks/sunat-mock-server';
import { buildUbl21Xml } from '../../../backend/src/modules/billing/utils/ubl-builder';
import { InvoiceData } from '../../../backend/src/modules/billing/utils/ubl-builder';

describe('Integration Test: SUNAT / OSE Staging Mock & Contingency Handling', () => {
  const sampleInvoice: InvoiceData = {
    invoiceType: 'BOLETA',
    series: 'B001',
    correlative: 55,
    issueDate: new Date(),
    customer: {
      documentType: 'DNI',
      documentNumber: '10203040',
      name: 'CLIENTE PRUEBA CONTINGENCIA',
    },
    subtotal: 38.14,
    tax: 6.86,
    total: 45.0,
    items: [
      {
        name: 'Bidón 20L Agua Purificada',
        quantity: 3,
        unitPrice: 15.0,
        totalPrice: 45.0,
      },
    ],
  };

  afterEach(() => {
    SunatMockServer.setBehavior('SUCCESS');
  });

  it('Scenario 1: Happy Path - SUNAT accepts bill with code 0 and valid CDR', async () => {
    SunatMockServer.setBehavior('SUCCESS');
    const { xml, hash } = buildUbl21Xml(sampleInvoice);

    const response = await SunatMockServer.sendBill({
      fileName: '20612345678-03-B001-00000055.zip',
      contentFileBase64: Buffer.from(xml).toString('base64'),
      partyRuc: '20612345678',
    });

    expect(response.statusCode).toBe(200);
    expect(response.sunatResponseCode).toBe('0');
    expect(response.sunatStatus).toBe('ACEPTADO');
    expect(response.cdrXmlBase64).toBeDefined();
    expect(response.description).toContain('ha sido aceptado por SUNAT');
  });

  it('Scenario 2: Duplicate invoice - SUNAT rejects with official code 0098', async () => {
    SunatMockServer.setBehavior('DUPLICATE_0098');
    const { xml } = buildUbl21Xml(sampleInvoice);

    const response = await SunatMockServer.sendBill({
      fileName: '20612345678-03-B001-00000055.zip',
      contentFileBase64: Buffer.from(xml).toString('base64'),
      partyRuc: '20612345678',
    });

    expect(response.statusCode).toBe(400);
    expect(response.sunatResponseCode).toBe('0098');
    expect(response.sunatStatus).toBe('RECHAZADO');
    expect(response.description).toContain('ya fue presentado anteriormente');
  });

  it('Scenario 3: Inactive RUC - SUNAT rejects with code 2023', async () => {
    SunatMockServer.setBehavior('REJECT_2023');
    const { xml } = buildUbl21Xml(sampleInvoice);

    const response = await SunatMockServer.sendBill({
      fileName: '20612345678-01-F001-00000010.zip',
      contentFileBase64: Buffer.from(xml).toString('base64'),
      partyRuc: '20612345678',
    });

    expect(response.statusCode).toBe(400);
    expect(response.sunatResponseCode).toBe('2023');
    expect(response.sunatStatus).toBe('RECHAZADO');
    expect(response.description).toContain('no se encuentra en estado ACTIVO');
  });

  it('Scenario 4: Contingency / Caída temporal del servicio SUNAT (HTTP 503 / Timeout)', async () => {
    SunatMockServer.setBehavior('TIMEOUT_503');
    const { xml } = buildUbl21Xml(sampleInvoice);

    let caughtError: any = null;
    let fallbackStatus = 'PENDIENTE';

    try {
      await SunatMockServer.sendBill({
        fileName: '20612345678-03-B001-00000055.zip',
        contentFileBase64: Buffer.from(xml).toString('base64'),
        partyRuc: '20612345678',
      });
    } catch (err: any) {
      caughtError = err;
      // In contingency, invoice is retained in CONTINGENCIA/PENDIENTE without cancelling the POS sale
      fallbackStatus = 'CONTINGENCIA';
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError.status).toBe(503);
    expect(fallbackStatus).toBe('CONTINGENCIA');
  });
});
