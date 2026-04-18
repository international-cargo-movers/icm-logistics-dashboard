import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 25, fontFamily: 'Helvetica', fontSize: 8, color: '#000000' },
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
});

export default function BolPDF({ data }: { data: any }) {
    const bol = data?.shippingDocuments?.bolDetails || {};
    const ship = data?.shipmentDetails || {};
    const cust = data?.customerDetails || {};
    const party = data?.partyDetails || {};
    const cargo = data?.cargoDetails || {};

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
                            <View style={[styles.boxNoBorder, { flexGrow: 1 }]}>
                                <Text style={styles.label}>3. Notify Party (Name and Address)</Text>
                                <Text style={styles.value}>SAME AS CONSIGNEE</Text>
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
                                <Text style={styles.companyHeader}>INTERNATIONAL CARGO MOVERS</Text>
                                <Text style={{ fontSize: 7, textAlign: 'center' }}>123 GLOBAL LOGISTICS PARK, NEW DELHI 110037</Text>
                                <Text style={{ fontSize: 7, textAlign: 'center' }}>Email: operations@internationalcargo.com</Text>
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
                            <Text style={styles.label}>Container / Seal No.</Text>
                            <Text style={styles.value}>{bol.sealNumber || "—"}</Text>
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
                        <Text style={styles.wPkgs}>{cargo.noOfPackages || "1"}</Text>
                        <Text style={styles.wDesc}>
                            {cargo.commodity || "GENERAL CARGO"}{"\n\n"}
                            {cargo.description || ""}
                        </Text>
                        <Text style={styles.wWeight}>{cargo.grossWeight ? `${cargo.grossWeight} KGS` : "—"}</Text>
                        <Text style={styles.wMeas}>{cargo.volumetricWeight || "—"}</Text>
                    </View>

                    {/* FOOTER & SIGNATURES SECTION */}
                    <View style={styles.row}>
                        <View style={[styles.col50, { borderBottom: 'none' }]}>
                            <View style={styles.row}>
                                <View style={{ width: '50%', borderRight: '1px solid #000', padding: 4 }}>
                                    <Text style={styles.label}>Freight Amount</Text>
                                    <Text style={styles.value}>AS ARRANGED</Text>
                                </View>
                                <View style={{ width: '50%', padding: 4 }}>
                                    <Text style={styles.label}>Freight Payable At</Text>
                                    <Text style={styles.value}>{bol.freightPayableAt || "—"}</Text>
                                </View>
                            </View>
                            <View style={[styles.row, { flexGrow: 1, borderBottom: 'none' }]}>
                                <View style={{ width: '50%', borderRight: '1px solid #000', padding: 4 }}>
                                    <Text style={styles.label}>Freight Terms</Text>
                                    <Text style={styles.value}>{bol.freightTerms || "Prepaid"}</Text>
                                </View>
                                <View style={{ width: '50%', padding: 4 }}>
                                    <Text style={styles.label}>No. of Original B/L</Text>
                                    <Text style={styles.value}>{bol.noOfOriginalBl || "THREE (3)"}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.col50NoBorder, { padding: 4, justifyContent: 'space-between' }]}>
                            <View>
                                <Text style={styles.label}>Place and Date of Issue</Text>
                                <Text style={styles.value}>{bol.placeAndDateOfIssue || "—"}</Text>
                            </View>
                            <View style={{ marginTop: 20, alignItems: 'center' }}>
                                <Text style={{ fontSize: 6, marginBottom: 20 }}>FOR INTERNATIONAL CARGO MOVERS</Text>
                                <Text style={{ fontSize: 6, borderTop: '1px solid #000', width: '80%', textAlign: 'center', paddingTop: 2 }}>AS AGENT / AUTHORIZED SIGNATORY</Text>
                            </View>
                        </View>
                    </View>

                </View>
            </Page>
        </Document>
    );
}