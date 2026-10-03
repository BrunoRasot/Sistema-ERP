export interface SunatBillRequest {
  fileName: string;
  contentFileBase64: string;
  partyRuc: string;
}

export interface SunatBillResponse {
  statusCode: number;
  sunatResponseCode: string;
  sunatStatus: 'ACEPTADO' | 'RECHAZADO' | 'EXCEPCION' | 'CONTINGENCIA';
  description: string;
  cdrXmlBase64?: string;
  hashCdr?: string;
}

export class SunatMockServer {
  private static simulatedBehavior: 'SUCCESS' | 'DUPLICATE_0098' | 'REJECT_2023' | 'TIMEOUT_503' = 'SUCCESS';

  static setBehavior(behavior: 'SUCCESS' | 'DUPLICATE_0098' | 'REJECT_2023' | 'TIMEOUT_503') {
    this.simulatedBehavior = behavior;
  }

  static async sendBill(request: SunatBillRequest): Promise<SunatBillResponse> {
    switch (this.simulatedBehavior) {
      case 'SUCCESS':
        return {
          statusCode: 200,
          sunatResponseCode: '0',
          sunatStatus: 'ACEPTADO',
          description: `El comprobante ${request.fileName} ha sido aceptado por SUNAT exitosamente.`,
          cdrXmlBase64: Buffer.from(`<ApplicationResponse><ResponseCode>0</ResponseCode><Description>Aceptado</Description></ApplicationResponse>`).toString('base64'),
          hashCdr: 'mock-cdr-hash-valid',
        };

      case 'DUPLICATE_0098':
        return {
          statusCode: 400,
          sunatResponseCode: '0098',
          sunatStatus: 'RECHAZADO',
          description: `El comprobante ${request.fileName} ya fue presentado anteriormente a la SUNAT.`,
        };

      case 'REJECT_2023':
        return {
          statusCode: 400,
          sunatResponseCode: '2023',
          sunatStatus: 'RECHAZADO',
          description: 'Número de RUC del receptor no existe o no se encuentra en estado ACTIVO en el padrón SUNAT.',
        };

      case 'TIMEOUT_503':
        const error = new Error('SUNAT OSE Service Unavailable: Connection timeout / Gateway Timeout (503)');
        (error as any).status = 503;
        throw error;
    }
  }

  static async getStatus(ticketNumber: string) {
    if (this.simulatedBehavior === 'TIMEOUT_503') {
      throw new Error('SUNAT OSE Service Unavailable');
    }
    return {
      statusCode: '0',
      message: 'Comprobante válido y activo en padrón centralizado SUNAT.',
    };
  }
}
