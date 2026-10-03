export interface TestCustomer {
  id: string;
  documentType: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
  documentNumber: string;
  name: string;
  businessName?: string;
  phone: string;
  email?: string;
  address: string;
  zone: string;
  district: string;
  subchannel: string;
  customerType: 'HOGAR' | 'EMPRESA' | 'DISTRIBUIDOR';
  bottlesHolding: number;
  currentDebt: number;
  creditLimit: number;
  loyaltyTier: 'BRONCE' | 'PLATA' | 'ORO' | 'DIAMANTE';
}

export const mockCustomerDni: TestCustomer = {
  id: 'cust-dni-001',
  documentType: 'DNI',
  documentNumber: '44556677',
  name: 'Rosa Palomino Carpio',
  phone: '956123456',
  email: 'rosa.palomino@gmail.com',
  address: 'Calle San Martín 320, Ica',
  zone: 'Zona Centro',
  district: 'Ica',
  subchannel: 'MOSTRADOR',
  customerType: 'HOGAR',
  bottlesHolding: 4,
  currentDebt: 0,
  creditLimit: 200,
  loyaltyTier: 'PLATA',
};

export const mockCustomerRuc: TestCustomer = {
  id: 'cust-ruc-002',
  documentType: 'RUC',
  documentNumber: '20608899001',
  name: 'Empresa Constructora Ica S.A.C.',
  businessName: 'Constructora Ica',
  phone: '956987654',
  email: 'administracion@constructoraica.pe',
  address: 'Av. Cutervo 850, Ica',
  zone: 'Parque Industrial',
  district: 'Ica',
  subchannel: 'EMPRESA',
  customerType: 'EMPRESA',
  bottlesHolding: 25,
  currentDebt: 350.50,
  creditLimit: 2000,
  loyaltyTier: 'ORO',
};
