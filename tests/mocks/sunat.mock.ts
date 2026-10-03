export const mockSunatSuccessResponse = {
  status: 'ACEPTADO',
  responseCode: '0',
  description: 'El comprobante ha sido aceptado por SUNAT exitosamente.',
  cdrXml: '<xml>Mock CDR Aceptado</xml>',
};

export const mockSunatRejectedResponse = {
  status: 'RECHAZADO',
  responseCode: '2023',
  description: 'Numero de RUC del receptor no existe o no esta activo.',
  cdrXml: '<xml>Mock CDR Rechazado</xml>',
};

export const mockSunatSoapClient = {
  sendBill: jest.fn().mockResolvedValue(mockSunatSuccessResponse),
  getStatus: jest.fn().mockResolvedValue({ status: '0', message: 'Comprobante valido' }),
};
