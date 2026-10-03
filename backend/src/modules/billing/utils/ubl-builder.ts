import * as crypto from 'crypto';
import { numberToWordsSoles } from './number-to-words';

export interface CompanyData {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  address: string;
  district: string;
  province: string;
  department: string;
  ubigeo: string;
}

export const VIVELITE_COMPANY: CompanyData = {
  ruc: '20612345678',
  razonSocial: 'VIVELITE AGUA PURIFICADA S.A.C.',
  nombreComercial: 'VIVELITE',
  address: 'Av. Industrial 450, Urb. Vulcano',
  district: 'Ate',
  province: 'Lima',
  department: 'Lima',
  ubigeo: '150103',
};

export interface InvoiceData {
  invoiceType: 'BOLETA' | 'FACTURA';
  series: string;
  correlative: number;
  issueDate: Date;
  customer: {
    documentType: string;
    documentNumber: string;
    name: string;
    address?: string;
  };
  subtotal: number; // Operación gravada (sin IGV)
  tax: number; // IGV 18%
  total: number; // Total a pagar
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number; // Con IGV
    totalPrice: number;
  }>;
}

export function buildUbl21Xml(data: InvoiceData): { xml: string; hash: string; qrText: string } {
  const typeCode = data.invoiceType === 'FACTURA' ? '01' : '03';
  const docId = `${data.series}-${String(data.correlative).padStart(8, '0')}`;
  const dateStr = data.issueDate.toISOString().split('T')[0];
  const timeStr = data.issueDate.toTimeString().split(' ')[0];

  const clientDocType =
    data.customer.documentType === 'RUC' ? '6' : data.customer.documentType === 'DNI' ? '1' : '0';

  const legendText = numberToWordsSoles(data.total);

  // Generar XML UBL 2.1
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>2.0</cbc:CustomizationID>
    <cbc:ID>${docId}</cbc:ID>
    <cbc:IssueDate>${dateStr}</cbc:IssueDate>
    <cbc:IssueTime>${timeStr}</cbc:IssueTime>
    <cbc:InvoiceTypeCode listID="0101">${typeCode}</cbc:InvoiceTypeCode>
    <cbc:Note languageLocaleID="1000">${legendText}</cbc:Note>
    <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>
    
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="6">${VIVELITE_COMPANY.ruc}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name><![CDATA[${VIVELITE_COMPANY.nombreComercial}]]></cbc:Name>
            </cac:PartyName>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName><![CDATA[${VIVELITE_COMPANY.razonSocial}]]></cbc:RegistrationName>
                <cac:RegistrationAddress>
                    <cbc:ID>${VIVELITE_COMPANY.ubigeo}</cbc:ID>
                    <cbc:AddressTypeCode>0000</cbc:AddressTypeCode>
                    <cbc:CityName>${VIVELITE_COMPANY.province}</cbc:CityName>
                    <cbc:CountrySubentity>${VIVELITE_COMPANY.department}</cbc:CountrySubentity>
                    <cbc:District>${VIVELITE_COMPANY.district}</cbc:District>
                    <cac:AddressLine>
                        <cbc:Line><![CDATA[${VIVELITE_COMPANY.address}]]></cbc:Line>
                    </cac:AddressLine>
                    <cac:Country>
                        <cbc:IdentificationCode>PE</cbc:IdentificationCode>
                    </cac:Country>
                </cac:RegistrationAddress>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="${clientDocType}">${data.customer.documentNumber || '00000000'}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName><![CDATA[${data.customer.name}]]></cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="PEN">${data.tax.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="PEN">${data.subtotal.toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="PEN">${data.tax.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:ID>1000</cbc:ID>
                    <cbc:Name>IGV</cbc:Name>
                    <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="PEN">${data.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxInclusiveAmount currencyID="PEN">${data.total.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="PEN">${data.total.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    
    <!-- Ítems de la Factura/Boleta -->
`;

  data.items.forEach((it, index) => {
    const netItemPrice = it.unitPrice / 1.18;
    const netLineTotal = netItemPrice * it.quantity;
    const lineIgv = it.totalPrice - netLineTotal;

    xml += `    <cac:InvoiceLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="NIU">${it.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="PEN">${netLineTotal.toFixed(2)}</cbc:LineExtensionAmount>
        <cac:PricingReference>
            <cac:AlternativeConditionPrice>
                <cbc:PriceAmount currencyID="PEN">${it.unitPrice.toFixed(2)}</cbc:PriceAmount>
                <cbc:PriceTypeCode>01</cbc:PriceTypeCode>
            </cac:AlternativeConditionPrice>
        </cac:PricingReference>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="PEN">${lineIgv.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxSubtotal>
                <cbc:TaxableAmount currencyID="PEN">${netLineTotal.toFixed(2)}</cbc:TaxableAmount>
                <cbc:TaxAmount currencyID="PEN">${lineIgv.toFixed(2)}</cbc:TaxAmount>
                <cac:TaxCategory>
                    <cbc:Percent>18.00</cbc:Percent>
                    <cbc:TaxExemptionReasonCode>10</cbc:TaxExemptionReasonCode>
                    <cac:TaxScheme>
                        <cbc:ID>1000</cbc:ID>
                        <cbc:Name>IGV</cbc:Name>
                        <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                    </cac:TaxScheme>
                </cac:TaxCategory>
            </cac:TaxSubtotal>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Description><![CDATA[${it.name}]]></cbc:Description>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="PEN">${netItemPrice.toFixed(4)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
`;
  });

  xml += `</Invoice>`;

  // Calcular Hash SHA-256 del XML
  const hash = crypto.createHash('sha256').update(xml).digest('base64');

  // Formato oficial de código QR SUNAT:
  // RUC|TipoDoc|Serie|Correlativo|IGV|Total|Fecha|TipoDocCliente|NumDocCliente|Hash
  const qrText = [
    VIVELITE_COMPANY.ruc,
    typeCode,
    data.series,
    data.correlative,
    data.tax.toFixed(2),
    data.total.toFixed(2),
    dateStr,
    clientDocType,
    data.customer.documentNumber || '00000000',
    hash,
  ].join('|');

  return { xml, hash, qrText };
}
