export const INTERNAL_COMPANIES = [
  { 
    id: "icm-delhi", 
    name: "International Cargo Movers", 
    branch: "Delhi",
    fullName: "INTERNATIONAL CARGO MOVERS",
    address: "193-A BASEMENT ARJUN NAGAR SAFDARJUNG ENCLAVE, NEW DELHI-110029, DELHI, INDIA",
    gstin: "07AAACI1234E1Z5", // Placeholder if not provided, user can update
    stateName: "Delhi",
    stateCode: "07",
    email: "ravinder@intcargomovers.com",
    tagline: "International Forwarders, Consolidators & Shipping Agent",
    logo: "/ICM_logo.png",
    dbName: "icm_delhi" 
  },
  { 
    id: "icm-mumbai", 
    name: "International Cargo Movers", 
    branch: "Mumbai",
    fullName: "INTERNATIONAL CARGO MOVERS",
    address: "Ground Floor, Shop No.51/51 Cbd Belapur, Navi Mumbai, Thane Maharastra",
    gstin: "27AAACI1234E1Z5", // Placeholder for Mumbai
    stateName: "Maharashtra",
    stateCode: "27",
    email: "ravinder@intcargomovers.com",
    tagline: "International Forwarders, Consolidators & Shipping Agent",
    logo: "/ICM_logo.png",
    dbName: "icm_mumbai" 
  },
  { 
    id: "intimation-delhi", 
    name: "Intimation Cargo Movers", 
    branch: "Delhi",
    fullName: "INTIMATION CARGO MOVERS",
    address: "193-A BASEMENT ARJUN NAGAR SAFDARJUNG ENCLAVE, NEW DELHI-110029, DELHI, INDIA",
    gstin: "07AADCI9278E1ZB",
    stateName: "Delhi",
    stateCode: "07",
    email: "ravinder@intcargomovers.com",
    tagline: "International Forwarders, Consolidators & Shipping Agent",
    logo: "/Intimation_Logo.jpeg",
    dbName: "intimation_delhi" 
  },
  { 
    id: "intimation-mumbai", 
    name: "Intimation Cargo Movers", 
    branch: "Mumbai",
    fullName: "INTIMATION CARGO MOVERS",
    address: "Ground Floor, Shop No.51/51 Cbd Belapur, Navi Mumbai, Thane Maharastra",
    gstin: "07AADCI9278E1ZB", // Same GSTIN as Intimation Delhi? Usually state specific, but using provided for now
    stateName: "Maharashtra",
    stateCode: "27",
    email: "ravinder@intcargomovers.com",
    tagline: "International Forwarders, Consolidators & Shipping Agent",
    logo: "/Intimation_Logo.jpeg",
    dbName: "intimation_mumbai" 
  },
];

export type InternalCompanyId = typeof INTERNAL_COMPANIES[number]["id"];

export function getCompanyDetails(id: string | null | undefined) {
  return INTERNAL_COMPANIES.find(c => c.id === id) || INTERNAL_COMPANIES[0];
}
