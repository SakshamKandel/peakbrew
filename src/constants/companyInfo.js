// Company information constants
export const COMPANY_INFO = {
  name: 'Peak Brew Trading LLC',
  tagline: 'Premium Beer Distribution',
  permitNumber: '06756556-1',
  address: {
    street: '7840 Tyler Blvd, Unit 6201',
    city: 'Mentor',
    state: 'OH',
    zipCode: '44060',
    country: 'USA'
  },
  contact: {
    email: 'peakbrewtrading@gmail.com',
    phone: '+1 412-894-6129',
    website: 'www.peakbrewtrading.com'
  },
  colors: {
    primary: '#e8c848', // Gold from logo
    secondary: '#1a1a1a', // Dark from logo
    accent: '#1971c2'
  }
};

export const getFullAddress = () => {
  const { address } = COMPANY_INFO;
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;
};

export const getContactLine = () => {
  const { contact } = COMPANY_INFO;
  return `${contact.email} | ${contact.phone}`;
};
