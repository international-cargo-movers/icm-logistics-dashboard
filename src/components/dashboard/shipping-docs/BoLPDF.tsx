import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 25, fontFamily: 'Helvetica', fontSize: 8, color: '#000000' },
    logo: { width: 140, marginBottom: 5 },
    outerBorder: { border: '1px solid #000', flexGrow: 1, display: 'flex', flexDirection: 'column' },
    row: { display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000' },

    // Columns
    col50: { width: '50%', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' },
    col50NoBorder: { width: '50%', display: 'flex', flexDirection: 'column' },
    col25: { width: '25%', borderRight: '1px solid #000', padding: 4 },

    // Boxes
    box: { padding: 4, borderBottom: '1px solid #000', minHeight: 65 },
    boxNoBorder: { padding: 4, minHeight: 65 },

    // Typography
    label: { fontSize: 6, color: '#333', marginBottom: 2, textTransform: 'uppercase' },
    value: { fontSize: 8, fontWeight: 'bold', lineHeight: 1.3 },
    address: { fontSize: 6, fontWeight: 'medium', lineHeight: 1.3 },
    companyHeader: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
    documentTitle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1, backgroundColor: '#f0f0f0', padding: 4, borderBottom: '1px solid #000' },

    // Cargo Grid Header
    cargoHeader: { display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000', padding: 4, backgroundColor: '#f0f0f0' },
    cargoBody: { display: 'flex', flexDirection: 'row', minHeight: 200, padding: 4 },
    wMarks: { width: '25%', paddingRight: 4 },
    wPkgs: { width: '10%', textAlign: 'center' },
    wDesc: { width: '45%', paddingHorizontal: 4 },
    wWeight: { width: '10%', textAlign: 'right' },
    wMeas: { width: '10%', textAlign: 'right' },

    // Footer Grid
    footerRow: { display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000' },
    footerCol: { borderRight: '1px solid #000', padding: 4 },
    footerLabel: { fontSize: 6, fontWeight: 'bold', marginBottom: 2 },
    footerValue: { fontSize: 7, marginTop: 2 },
});

export default function BolPDF({ data }: { data: any }) {
    const bol = data?.shippingDocuments?.bolDetails || {};
    const ship = data?.shipmentDetails || {};
    const cust = data?.customerDetails || {};
    const party = data?.partyDetails || {};
    const cargo = data?.cargoDetails || {};
    const vendors = data?.vendorDetails || [];

    // Resolve Delivery Agent (Fallback to Vendor if Overseas Agent is missing)
    let deliveryAgent = party.overseasAgentId;
    if (!deliveryAgent || !deliveryAgent.name) {
        const fallbackVendor = vendors.find((v: any) => 
            v.assignedTask && 
            (v.assignedTask.toLowerCase().includes("delivery agent") || 
             v.assignedTask.toLowerCase().includes("destination agent") ||
             v.assignedTask.toLowerCase().includes("overseas agent"))
        );
        if (fallbackVendor && fallbackVendor.vendorId) {
            deliveryAgent = fallbackVendor.vendorId;
        }
    }

    // Helper to convert number to words for packages (simplified)
    const totalPkgs = cargo.totalNoOfPackages || cargo.noOfPackages || "1";
    const totalPkgsInWords = `SAY ${totalPkgs} PACKAGE(S) ONLY`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.outerBorder}>

                    {/* TOP SECTION: Parties & Header */}
                    <View style={styles.row}>
                        {/* Left Column: Parties */}
                        <View style={styles.col50}>
                            <View style={styles.box}>
                                <Text style={styles.label}>1. Shipper (Name and Address)</Text>
                                <Text style={styles.value}>{cust.companyId?.name || "As Per Order"}</Text>
                                <Text style={styles.address}>{cust.companyId?.streetAddress || ""}</Text>
                                <Text style={styles.address}>{cust.companyId?.city || ""}, {cust.companyId?.state || ""} -  {cust.companyId?.zipCode || ""}</Text>
                                <Text style={styles.address}>{cust.companyId?.country || ""}</Text>
                            </View>
                            <View style={styles.box}>
                                <Text style={styles.label}>2. Consignee (Name and Address)</Text>
                                <Text style={styles.value}>{party.consigneeId?.name || "AS PER INVOICE"}</Text>
                                <Text style={styles.address}>{party.consigneeId?.streetAddress || ""}</Text>
                                <Text style={styles.address}>{party.consigneeId?.city || ""}, {party.consigneeId?.state || ""} -  {party.consigneeId?.zipCode || ""}</Text>
                                <Text style={styles.address}>{party.consigneeId?.country || ""} </Text>

                            </View>
                            <View style={styles.box}>
                                <Text style={styles.label}>3. Notify Party (Name and Address)</Text>
                                <Text style={styles.value}>SAME AS CONSIGNEE</Text>
                            </View>
                            <View style={[styles.boxNoBorder, { flexGrow: 1 }]}>
                                <Text style={styles.label}>4. Delivery Agent (Name and Address)</Text>
                                <Text style={styles.value}>{deliveryAgent?.name || ""}</Text>
                                <Text style={styles.address}>{deliveryAgent?.streetAddress || ""}</Text>
                                <Text style={styles.address}>{deliveryAgent?.city || ""}{deliveryAgent?.state ? `, ${deliveryAgent.state}` : ""} {deliveryAgent?.zipCode ? `- ${deliveryAgent.zipCode}` : ""}</Text>
                                <Text style={styles.address}>{deliveryAgent?.country || ""}</Text>
                            </View>
                        </View>

                        {/* Right Column: References & Company */}
                        <View style={styles.col50NoBorder}>
                            <View style={[styles.row, { borderBottom: 'none' }]}>
                                <View style={[styles.col50, { padding: 4, minHeight: 40 }]}>
                                    <Text style={styles.label}>B/L Number</Text>
                                    <Text style={styles.value}>{bol.bolNumber || "DRAFT"}</Text>
                                </View>
                                <View style={{ width: '50%', padding: 4 }}>
                                    <Text style={styles.label}>Booking Reference</Text>
                                    <Text style={styles.value}>{bol.bookingReference || data.jobId}</Text>
                                </View>
                            </View>
                            <View style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: 8, alignItems: 'center', justifyContent: 'center', minHeight: 90 }}>
                                <Image src="/ICM logo.png" style={styles.logo} />
                                <Text style={{ fontSize: 9, textAlign: 'center' }}>INTERNATIONAL CARGO MOVERS</Text>
                                <Text style={{ fontSize: 8, textAlign: 'center' }}>193-A BASEMENT ARJUN NAGAR SAFDARJUNG ENCLAVE, NEW DELHI-110029, DELHI, INDIA
                                </Text>
                                <Text style={{ fontSize: 7, textAlign: 'center' }}>MOBILE: +91-9810213336 || Email: ravinder@internationalcargo.com</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 5, textAlign: 'center',margin:2 }}>
                                    Received by the Carrier. Goods as specified below in apparent good order and condition unless otherwise stated, to be transported to such place as agreed, authorised or permitted herein and subject to all the terms and conditions appearing on the front and reverse of this Bill of Lading to which the Merchant agrees by accepting this Bill of Lading, local privileges and customs notwithstanding. The particulars below as stated by the shipper and the weight, measure, quantity, condition, contents and value of the Goods are unknown to the Carrier. In WITNESS, whereof one (1) original Bill of Lading has been signed if not otherwise stated below, the same being accomplished the other(s), if any to be void. Required by the Carrier one (1) original Bill of Lading must be surrendered duly endorsed in exchange for the Goods or Delivery Order.
                                </Text>
                            </View>
                            <View style={{ flexGrow: 1, padding: 4, justifyContent: 'center' }}>
                                <Text style={styles.documentTitle}>BILL OF LADING</Text>
                                <Text style={{ fontSize: 6, textAlign: 'center', marginTop: 4 }}>ORIGINAL</Text>
                            </View>
                        </View>
                    </View>

                    {/* ROUTING SECTION */}
                    <View style={styles.row}>
                        <View style={styles.col25}>
                            <Text style={styles.label}>Pre-Carriage By</Text>
                            <Text style={styles.value}>—</Text>
                        </View>
                        <View style={styles.col25}>
                            <Text style={styles.label}>Place of Receipt</Text>
                            <Text style={styles.value}>{ship.portOfLoading || "—"}</Text>
                        </View>
                        <View style={styles.col25}>
                            <Text style={styles.label}>Ocean Vessel / Voy No.</Text>
                            <Text style={styles.value}>{ship.vesselFlight || "TBA"}</Text>
                        </View>
                        <View style={{ width: '25%', padding: 4 }}>
                            <Text style={styles.label}>Port of Loading</Text>
                            <Text style={styles.value}>{ship.portOfLoading || "—"}</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.col25}>
                            <Text style={styles.label}>Port of Discharge</Text>
                            <Text style={styles.value}>{ship.portOfDischarge || "—"}</Text>
                        </View>
                        <View style={styles.col25}>
                            <Text style={styles.label}>Place of Delivery</Text>
                            <Text style={styles.value}>{ship.portOfDischarge || "—"}</Text>
                        </View>
                        <View style={{ width: '50%', padding: 4 }}>
                            <Text style={styles.label}>Container / Seal No. / MTU</Text>
                            <Text style={styles.value}>
                                {bol.sealNumber || "—"} {bol.mtuNumber ? `/ MTU: ${bol.mtuNumber}` : ""}
                            </Text>
                        </View>
                    </View>

                    {/* CARGO DETAILS SECTION */}
                    <View style={styles.cargoHeader}>
                        <Text style={[styles.wMarks, styles.label]}>Marks and Numbers</Text>
                        <Text style={[styles.wPkgs, styles.label]}>No. of Pkgs</Text>
                        <Text style={[styles.wDesc, styles.label]}>Description of Goods</Text>
                        <Text style={[styles.wWeight, styles.label]}>Gross Weight</Text>
                        <Text style={[styles.wMeas, styles.label]}>Measurement</Text>
                    </View>

                    <View style={[styles.cargoBody, { borderBottom: '1px solid #000' }]}>
                        <Text style={styles.wMarks}>{bol.marksAndNumbers || "N/M"}</Text>
                        <Text style={styles.wPkgs}>{cargo.totalNoOfPackages || cargo.noOfPackages || "1"}</Text>
                        <View style={styles.wDesc}>
                            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>{cargo.commodity || "GENERAL CARGO"}</Text>
                            
                            {cargo.items && cargo.items.length > 0 ? (
                                cargo.items.map((item: any, i: number) => (
                                    <View key={i} style={{ marginBottom: 4 }}>
                                        <Text style={{ fontSize: 7, fontWeight: 'bold' }}>{item.description}</Text>
                                        <Text style={{ fontSize: 6.5 }}>
                                            {item.noOfPackages} {item.packageUnit} | {item.grossWeight} KGS | {item.dimensions || "N/A"}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <Text>{cargo.description || ""}</Text>
                            )}
                        </View>
                        <Text style={styles.wWeight}>{(cargo.totalGrossWeight || cargo.grossWeight) ? `${cargo.totalGrossWeight || cargo.grossWeight} KGS` : "—"}</Text>
                        <Text style={styles.wMeas}>{cargo.totalVolumetricWeight || cargo.volumetricWeight || "—"}</Text>
                    </View>

                    {/* TOTAL PACKAGES IN WORDS */}
                    <View style={styles.footerRow}>
                        <View style={[styles.footerCol, { width: '70%', borderRight: '1px solid #000' }]}>
                            <Text style={styles.footerLabel}>TOTAL NUMBER OF CONTAINERS OR OTHER PACKAGES OF UNITS RECEIVED BY THE CARRIER (IN WORDS)</Text>
                            <Text style={[styles.footerValue, { fontWeight: 'bold' }]}>{totalPkgsInWords}</Text>
                        </View>
                        <View style={[styles.footerCol, { width: '10%', borderRight: '1px solid #000' }]}></View>
                        <View style={[styles.footerCol, { width: '10%', borderRight: '1px solid #000' }]}></View>
                        <View style={[styles.footerCol, { width: '10%', borderRight: 0 }]}></View>
                    </View>

                    {/* FREIGHT GRID */}
                    <View style={styles.footerRow}>
                        <View style={[styles.footerCol, { width: '20%' }]}>
                            <Text style={styles.footerLabel}>HANDLING INFORMATION</Text>
                            <Text style={styles.footerValue}>{bol.handlingInformation || "—"}</Text>
                        </View>
                        <View style={[styles.footerCol, { width: '15%' }]}>
                            <Text style={styles.footerLabel}>REVENUE TONS</Text>
                            <Text style={styles.footerValue}>AS ARRANGED</Text>
                        </View>
                        <View style={[styles.footerCol, { width: '10%' }]}>
                            <Text style={styles.footerLabel}>RATE</Text>
                            <Text style={styles.footerValue}>AS ARRANGED</Text>
                        </View>
                        <View style={[styles.footerCol, { width: '25%' }]}>
                            <Text style={styles.footerLabel}>FREIGHT AND CHARGES</Text>
                            <Text style={styles.footerValue}>FREIGHT PREPAID</Text>
                        </View>
                        <View style={[styles.footerCol, { width: '15%' }]}>
                            <Text style={styles.footerLabel}>PREPAID</Text>
                            <Text style={styles.footerValue}>PREPAID</Text>
                        </View>
                        <View style={[styles.footerCol, { width: '15%', borderRight: 0 }]}>
                            <Text style={styles.footerLabel}>COLLECT</Text>
                            <Text style={styles.footerValue}>AS ARRANGED</Text>
                        </View>
                    </View>

                    <View style={styles.footerRow}>
                        <View style={[styles.footerCol, { width: '35%' }]}>
                            <Text style={styles.footerLabel}>FREIGHT PREPAID AT</Text>
                            <Text style={styles.footerValue}>AS ARRANGED</Text>
                        </View>
                        <View style={[styles.footerCol, { width: '35%' }]}>
                            <Text style={styles.footerLabel}>FREIGHT PAYABLE AT</Text>
                            <Text style={styles.footerValue}>AS ARRANGED</Text>
                        </View>
                        <View style={[styles.footerCol, { width: '30%', borderRight: 0 }]}>
                            <Text style={styles.footerLabel}>PLACE AND DATE OF ISSUE</Text>
                            <Text style={styles.footerValue}>{bol.placeAndDateOfIssue || "MUMBAI - 27/02/2026"}</Text>
                        </View>
                    </View>

                    <View style={styles.footerRow}>
                        <View style={[styles.footerCol, { width: '45%' }]}>
                            <Text style={styles.footerLabel}>TOTAL PREPAID IN NATIONAL CURRENCY</Text>
                            <Text style={styles.footerValue}>AS ARRANGED</Text>
                        </View>
                        <View style={[styles.footerCol, { width: '25%' }]}>
                            <Text style={styles.footerLabel}>NO. OF ORIGINAL B/L</Text>
                            <Text style={styles.footerValue}>{bol.noOfOriginalBl || "THREE (3)"}</Text>
                        </View>
                        <View style={[styles.footerCol, { width: '30%', borderRight: 0 }]}>
                            <Text style={styles.footerLabel}>For As Agent</Text>
                            <Text style={[styles.footerValue, { fontWeight: 'bold' }]}>FOR INTIMATION CARGO MOVERS PVT.LTD</Text>
                        </View>
                    </View>

                    {/* LADEN ON BOARD SECTION */}
                    <View style={{ backgroundColor: '#f0f0f0', borderBottom: '1px solid #000', padding: 2 }}>
                        <Text style={[styles.footerLabel, { textAlign: 'center', marginBottom: 0 }]}>LADEN ON BOARD THE VESSEL</Text>
                    </View>
                    <View style={[styles.footerRow, { borderBottom: 0, flexGrow: 1 }]}>
                        <View style={[styles.footerCol, { width: '35%', minHeight: 40 }]}>
                            <Text style={styles.footerLabel}>VESSEL - VOY</Text>
                            <Text style={styles.footerValue}>{ship.vesselFlight || "—"}</Text>
                        </View>
                        <View style={[styles.footerCol, { width: '35%', minHeight: 40 }]}>
                            <Text style={styles.footerLabel}>SHIPPED ON BOARD DATE</Text>
                            <Text style={styles.footerValue}>{bol.shippedOnBoardDate || "—"}</Text>
                        </View>
                        <View style={[styles.footerCol, { width: '30%', borderRight: 0, alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 10 }]}>
                            <Text style={[styles.footerLabel, { fontSize: 8 }]}>AUTH SIGN.</Text>
                        </View>
                    </View>

                </View>
            </Page>
        </Document>
    );
}
