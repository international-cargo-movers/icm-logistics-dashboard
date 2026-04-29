import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 20, fontFamily: 'Helvetica', fontSize: 7, color: '#000000' },
    container: { border: '1px solid #000' },
    
    // Grid rows
    row: { display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000' },
    rowNoBorder: { display: 'flex', flexDirection: 'row' },
    
    // Columns
    col50: { width: '50%', borderRight: '1px solid #000' },
    col50NoBorder: { width: '50%' },
    col33: { width: '33.33%', borderRight: '1px solid #000' },
    col33NoBorder: { width: '33.33%' },
    col25: { width: '25%', borderRight: '1px solid #000' },
    col75: { width: '75%' },
    
    // Specific cell heights and paddings
    cell: { padding: 4 },
    label: { fontSize: 6, fontWeight: 'bold', marginBottom: 2, textTransform: 'uppercase' },
    value: { fontSize: 7, fontWeight: 'medium' },
    boldValue: { fontSize: 7, fontWeight: 'bold' },
    
    // Header specific
    title: { fontSize: 9, fontWeight: 'bold', borderBottom: '1px solid #000', padding: 2 },
    regNo: { fontSize: 7, padding: 2 },
    
    // Logo section
    logoContainer: { padding: 5, alignItems: 'center', justifyContent: 'center' },
    logo: { width: 250, marginBottom: 2 },
    companyName: { fontSize: 12, fontWeight: 'bold', color: '#d32f2f' }, // Red color for International Cargo Movers
    companySubName: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
    companyAddress: { fontSize: 6, textAlign: 'center', marginTop: 2 },
    companyContact: { fontSize: 6, textAlign: 'center', marginTop: 2 },

    // Cargo Table
    cargoCol1: { width: '28%', borderRight: '1px solid #000' },
    cargoCol2: { width: '42%', borderRight: '1px solid #000' },
    cargoCol3: { width: '15%', borderRight: '1px solid #000', textAlign: 'center' },
    cargoCol4: { width: '15%', textAlign: 'center' },
    cargoHeader: { borderBottom: '1px solid #000', padding: 2, height: 25, justifyContent: 'center' },
    cargoRow: { minHeight: 250, display: 'flex', flexDirection: 'row' },
    
    // Financial Grid
    finCell: { borderRight: '1px solid #000', padding: 4, height: 40 },
    finLabel: { fontSize: 6, fontWeight: 'bold' },
    finValue: { fontSize: 7, textAlign: 'center', marginTop: 5 },

    // Footer
    footerCell: { padding: 4, height: 30, borderRight: '1px solid #000' },
    footerCellNoBorder: { padding: 4, height: 30 },
    ladenHeader: { backgroundColor: '#e0e0e0', textAlign: 'center', padding: 2, borderBottom: '1px solid #000', borderTop: '1px solid #000', fontWeight: 'bold', fontSize: 7 },
    authSignBox: { borderLeft: '1px solid #000', width: '30%', padding: 4, justifyContent: 'space-between', alignItems: 'center' },
});

export default function BolPDF({ data }: { data: any }) {
    const bol = data?.shippingDocuments?.bolDetails || {};
    const ship = data?.shipmentDetails || {};
    const cust = data?.customerDetails || {};
    const party = data?.partyDetails || {};
    const cargo = data?.cargoDetails || {};

    const shipper = cust.companyId || {};
    const consignee = party.consigneeId || {};
    const notifyParty = party.notifyPartyId || {};
    const agent = party.overseasAgentId || {};

    const totalPkgs = cargo.totalNoOfPackages || cargo.noOfPackages || "0";
    const weight = cargo.totalGrossWeight || cargo.grossWeight || "0";
    const netWeight = cargo.totalNetWeight || cargo.netWeight || "0";
    const cbm = cargo.totalCbm || cargo.cbm || "0";

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.container}>
                    {/* TOP SECTION */}
                    <View style={styles.row}>
                        {/* LEFT: Parties */}
                        <View style={styles.col50}>
                            <View style={{ borderBottom: '1px solid #000' }}>
                                <Text style={styles.title}>MULTIMODAL TRANSPORT DOCUMENT</Text>
                                <Text style={styles.regNo}>REGISTRATION NUMBER: {bol.mtuNumber || "MTO/DGS/3878/FEB/2028"}</Text>
                            </View>
                            
                            <View style={[styles.cell, { borderBottom: '1px solid #000', height: 70 }]}>
                                <Text style={styles.label}>CONSIGNOR/SHIPPER</Text>
                                <Text style={styles.boldValue}>{shipper.name || ""}</Text>
                                <Text style={styles.value}>{shipper.streetAddress || ""}</Text>
                                <Text style={styles.value}>{shipper.city}{shipper.state ? `, ${shipper.state}` : ""} {shipper.zipCode || ""}</Text>
                                <Text style={styles.value}>{shipper.country || ""}</Text>
                            </View>

                            <View style={[styles.cell, { borderBottom: '1px solid #000', height: 70 }]}>
                                <Text style={styles.label}>CONSIGNEE</Text>
                                <Text style={styles.boldValue}>{consignee.name || ""}</Text>
                                <Text style={styles.value}>{consignee.streetAddress || ""}</Text>
                                <Text style={styles.value}>{consignee.city}{consignee.state ? `, ${consignee.state}` : ""} {consignee.zipCode || ""}</Text>
                                <Text style={styles.value}>{consignee.country || ""}</Text>
                                {consignee.phone && <Text style={styles.value}>TEL: {consignee.phone}</Text>}
                            </View>

                            <View style={[styles.cell, { height: 70 }]}>
                                <Text style={styles.label}>NOTIFY PARTY</Text>
                                {notifyParty.name ? (
                                    <>
                                        <Text style={styles.boldValue}>{notifyParty.name}</Text>
                                        <Text style={styles.value}>{notifyParty.streetAddress || ""}</Text>
                                        <Text style={styles.value}>{notifyParty.city}{notifyParty.state ? `, ${notifyParty.state}` : ""} {notifyParty.zipCode || ""}</Text>
                                        <Text style={styles.value}>{notifyParty.country || ""}</Text>
                                        {notifyParty.phone && <Text style={styles.value}>TEL: {notifyParty.phone}</Text>}
                                    </>
                                ) : (
                                    <Text style={styles.boldValue}>SAME AS CONSIGNEE</Text>
                                )}
                            </View>
                        </View>

                        {/* RIGHT: Logo & Details */}
                        <View style={styles.col50NoBorder}>
                            <View style={[styles.row, { borderBottom: '1px solid #000' }]}>
                                <View style={[styles.col50, { height: 35, padding: 4 }]}>
                                    <Text style={styles.label}>REF</Text>
                                    <Text style={styles.value}>{bol.bookingReference || data.jobId || ""}</Text>
                                </View>
                                <View style={[styles.col50NoBorder, { height: 35, padding: 4 }]}>
                                    <Text style={styles.label}>B/L NO</Text>
                                    <Text style={styles.boldValue}>{bol.bolNumber || "DRAFT"}</Text>
                                </View>
                            </View>

                            <View style={[styles.logoContainer, { borderBottom: '1px solid #000', height: 110 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                                    <Image src="/ICM_logo.png" style={styles.logo} />
                                </View>
                                <Text style={styles.companySubName}>INTERNATIONAL CARGO MOVERS</Text>
                                <Text style={styles.companyAddress}>193-A BASEMENT ARJUN NAGAR SAFDARJUNG ENCLAVE, NEW DELHI-110029, DELHI, INDIA</Text>
                                <Text style={styles.companyContact}>MOBILE: +91-9810213336 || EMAIL ID: RAVINDER@INTCARGOMOVERS.COM</Text>
                            </View>

                            <View style={[styles.cell, { height: 72 }]}>
                                <Text style={styles.label}>AGENT DETAILS</Text>
                                <Text style={styles.boldValue}>{agent.name || ""}</Text>
                                <Text style={styles.value}>{agent.streetAddress || ""}</Text>
                                <Text style={styles.value}>{agent.city}{agent.state ? `, ${agent.state}` : ""} {agent.country || ""}</Text>
                                {agent.contactPerson && <Text style={styles.value}>PIC # {agent.contactPerson}</Text>}
                                {agent.phone && <Text style={styles.value}>TEL: {agent.phone}</Text>}
                            </View>
                        </View>
                    </View>

                    {/* ROUTING SECTION */}
                    <View style={styles.row}>
                        <View style={[styles.col50, { height: 30 }]}>
                            <View style={{ flexDirection: 'row', height: '100%' }}>
                                <View style={[styles.col50, { borderRight: '1px solid #000', padding: 2 }]}>
                                    <Text style={styles.label}>PRE-CARRIAGE BY</Text>
                                    <Text style={styles.value}>BY SEA</Text>
                                </View>
                                <View style={{ width: '50%', padding: 2 }}>
                                    <Text style={styles.label}>PLACE OF RECEIPT</Text>
                                    <Text style={styles.value}>{ship.placeOfReceipt || ship.portOfLoading || ""}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={[styles.col50NoBorder, { height: 30, padding: 2 }]}>
                            {/* Empty space in image or merged? Let's check. Image shows it's one row. */}
                            {/* Actually Row 1 is PRE-CARRIAGE BY and PLACE OF RECEIPT. */}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.col33, { height: 30, padding: 2 }]}>
                            <Text style={styles.label}>OCEAN VESSEL</Text>
                            <Text style={styles.boldValue}>{ship.vesselFlight?.split('/')[0] || ""}</Text>
                        </View>
                        <View style={[styles.col33, { height: 30, padding: 2 }]}>
                            <Text style={styles.label}>VOY. NO.</Text>
                            <Text style={styles.boldValue}>{ship.vesselFlight?.split('/')[1] || ""}</Text>
                        </View>
                        <View style={[styles.col33NoBorder, { height: 30, padding: 2 }]}>
                            <Text style={styles.label}>PLACE OF RECEIPT</Text>
                            <Text style={styles.value}>{ship.portOfLoading || ""}</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.col33, { height: 30, padding: 2 }]}>
                            <Text style={styles.label}>PORT OF DISCHARGE</Text>
                            <Text style={styles.boldValue}>{ship.portOfDischarge || ""}</Text>
                        </View>
                        <View style={[styles.col33, { height: 30, padding: 2 }]}>
                            <Text style={styles.label}>PORT OF DELIVERY</Text>
                            <Text style={styles.boldValue}>{ship.portOfDischarge || ""}</Text>
                        </View>
                        <View style={[styles.col33NoBorder, { height: 30, padding: 2 }]}>
                            <Text style={styles.label}>FINAL DESTINATION FOR THE MERCHANT REFERENCE</Text>
                            <Text style={styles.value}>{ship.destinationCountry || consignee.country || ""}</Text>
                        </View>
                    </View>

                    {/* CARGO TABLE HEADER */}
                    <View style={styles.row}>
                        <View style={[styles.cargoCol1, styles.cargoHeader]}>
                            <Text style={styles.label}>MARKS AND NO/CONTAINER NO.(s)</Text>
                        </View>
                        <View style={[styles.cargoCol2, styles.cargoHeader]}>
                            <Text style={styles.label}>NUMBER & KIND OF PACKAGES / DESCRIPTION OF GOODS</Text>
                        </View>
                        <View style={[styles.cargoCol3, styles.cargoHeader]}>
                            <Text style={styles.label}>GROSS WEIGHT (KGS)</Text>
                        </View>
                        <View style={[styles.cargoCol4, styles.cargoHeader]}>
                            <Text style={styles.label}>MEASUREMENT (CBM)</Text>
                        </View>
                    </View>

                    {/* CARGO TABLE BODY */}
                    <View style={styles.cargoRow}>
                        <View style={[styles.cargoCol1, { padding: 4 }]}>
                            <Text style={styles.value}>{bol.marksAndNumbers || "N/M"}</Text>
                            <View style={{ marginTop: 10 }}>
                                <Text style={styles.boldValue}>CONTAINER NO.</Text>
                                <Text style={styles.value}>{bol.containerNumber || ""}</Text>
                                <Text style={styles.value}>L/SEAL NO: {bol.lineSealNumber || ""}</Text>
                                <Text style={styles.value}>C.SEAL NO: {bol.customSealNumber || ""}</Text>
                            </View>
                        </View>
                        <View style={[styles.cargoCol2, { padding: 4 }]}>
                            <Text style={styles.boldValue}>{totalPkgs} {cargo.packageType || "BOXES"} CONTAINING OF {cargo.commodity || "SPARE PARTS"}</Text>
                            {bol.invoiceNumber && <Text style={styles.value}>INVOICE NO. :{bol.invoiceNumber} {bol.invoiceDate ? `DT.${bol.invoiceDate}` : ""}</Text>}
                            {bol.shippingBillNumber && <Text style={styles.value}>S.BILL NO.{bol.shippingBillNumber} {bol.shippingBillDate ? `DT.${bol.shippingBillDate}` : ""}</Text>}
                            {bol.iecNumber && <Text style={styles.value}>IEC NO.{bol.iecNumber}</Text>}
                            {cargo.hsnCode && <Text style={styles.value}>HS.CODE :{cargo.hsnCode}</Text>}
                            
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.value}>FREIGHT : {bol.freightStatus || "PREPAID"}</Text>
                                <Text style={styles.value}>IHC : {bol.ihcStatus || "PREPAID"}</Text>
                            </View>
                        </View>
                        <View style={[styles.cargoCol3, { padding: 4 }]}>
                            <Text style={styles.boldValue}>{weight}</Text>
                            <Text style={styles.value}>KGS</Text>
                            {netWeight && (
                                <View style={{ marginTop: 5 }}>
                                    <Text style={styles.label}>NET WT.</Text>
                                    <Text style={styles.boldValue}>{netWeight}</Text>
                                    <Text style={styles.value}>KGS</Text>
                                </View>
                            )}
                        </View>
                        <View style={[styles.cargoCol4, { padding: 4 }]}>
                            <Text style={styles.boldValue}>{cbm}</Text>
                            <Text style={styles.value}>CBM</Text>
                            <Text style={[styles.value, { marginTop: 10 }]}>{ship.shipmentType || "LCL/LCL"}</Text>
                        </View>
                    </View>

                    {/* TOTAL WORDS */}
                    <View style={[styles.row, { height: 25, alignItems: 'center' }]}>
                        <View style={[styles.col75, { borderRight: '1px solid #000', padding: 2 }]}>
                            <Text style={styles.label}>TOTAL NUMBER OF CONTAINERS OR OTHER PACKAGES OF UNITS RECEIVED BY THE CARRIER (IN WORDS)</Text>
                            <Text style={[styles.value, { textTransform: 'uppercase' }]}>SAY {totalPkgs} {cargo.packageType || "PACKAGES"} ONLY</Text>
                        </View>
                        <View style={{ width: '25%' }}></View>
                    </View>

                    {/* FINANCIAL GRID */}
                    <View style={styles.row}>
                        <View style={[styles.finCell, { width: '20%' }]}>
                            <Text style={styles.finLabel}>REVENUE TONS</Text>
                            <Text style={styles.finValue}></Text>
                        </View>
                        <View style={[styles.finCell, { width: '15%' }]}>
                            <Text style={styles.finLabel}>RATE</Text>
                            <Text style={styles.finValue}></Text>
                        </View>
                        <View style={[styles.finCell, { width: '25%' }]}>
                            <Text style={styles.finLabel}>FREIGHT AND CHARGES</Text>
                            <Text style={styles.finValue}></Text>
                        </View>
                        <View style={[styles.finCell, { width: '20%' }]}>
                            <Text style={styles.finLabel}>PREPAID</Text>
                            <Text style={styles.finValue}></Text>
                        </View>
                        <View style={[styles.finCell, { width: '20%', borderRight: 0 }]}>
                            <Text style={styles.finLabel}>COLLECT</Text>
                            <Text style={styles.finValue}></Text>
                        </View>
                    </View>

                    {/* FOOTER SECTION */}
                    <View style={styles.row}>
                        <View style={[styles.footerCell, { width: '35%' }]}>
                            <Text style={styles.label}>FREIGHT PREPAID AT</Text>
                            <Text style={styles.value}>{bol.freightPrepaidAt || ""}</Text>
                        </View>
                        <View style={[styles.footerCell, { width: '35%' }]}>
                            <Text style={styles.label}>FREIGHT PAYABLE AT</Text>
                            <Text style={styles.value}>{bol.freightPayableAt || ""}</Text>
                        </View>
                        <View style={[styles.footerCellNoBorder, { width: '30%' }]}>
                            <Text style={styles.label}>PLACE AND DATE OF ISSUE</Text>
                            <Text style={styles.value}>{bol.placeAndDateOfIssue || ""}</Text>
                        </View>
                    </View>

                    <View style={[styles.row, { borderBottom: 0 }]}>
                        <View style={{ width: '70%' }}>
                            <View style={[styles.row, { borderBottom: '1px solid #000', height: 30 }]}>
                                <View style={[styles.footerCell, { width: '60%', borderRight: '1px solid #000' }]}>
                                    <Text style={styles.label}>TOTAL PREPAID IN NATIONAL CURRENCY</Text>
                                    <Text style={styles.value}></Text>
                                </View>
                                <View style={[styles.footerCellNoBorder, { width: '40%' }]}>
                                    <Text style={styles.label}>NO. OF ORIGINAL B/L</Text>
                                    <Text style={styles.value}>{bol.noOfOriginalBl || "THREE (3)"}</Text>
                                </View>
                            </View>
                            <View>
                                <Text style={styles.ladenHeader}>LADEN ON BOARD THE VESSEL</Text>
                                <View style={{ flexDirection: 'row', height: 35 }}>
                                    <View style={[styles.footerCell, { width: '50%' }]}>
                                        <Text style={styles.label}>DATE</Text>
                                        <Text style={styles.value}>{bol.shippedOnBoardDate || ""}</Text>
                                    </View>
                                    <View style={[styles.footerCellNoBorder, { width: '50%' }]}>
                                        <Text style={styles.label}>SIGNATURE</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={styles.authSignBox}>
                            <Text style={styles.label}>FOR INTERNATIONAL CARGO MOVERS</Text>
                            <View style={{ height: 40 }} />
                            <Text style={styles.label}>AUTH SIGN.</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}

/*
// PREVIOUS IMPLEMENTATION COMMENTED OUT
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
    box: { padding: 4, borderBottom: '1px solid #000', flex: 1 },
    boxNoBorder: { padding: 4, flex: 1 },

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

    const grossWeight = Number(cargo.totalGrossWeight || cargo.grossWeight || 0);
    const volumetricWeight = Number(cargo.totalVolumetricWeight || cargo.volumetricWeight || 0);
    const chargeableWeight = Math.max(grossWeight, volumetricWeight).toFixed(2);

    // Resolve Delivery Agent (Strictly Overseas Agent if available as per user request)
    const deliveryAgent = party.overseasAgentId;

    // Resolve Notify Party
    const notifyParty = party.notifyPartyId;
    const hasNotifyParty = !!(notifyParty && notifyParty.name);

    // Helper to convert number to words for packages (simplified)
    const totalPkgs = cargo.totalNoOfPackages || cargo.noOfPackages || "1";
    const totalPkgsInWords = `SAY ${totalPkgs} PACKAGE(S) ONLY`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.outerBorder}>
                    <View>
                        {bol.mtuNumber ? ` / MTU: ${bol.mtuNumber}` : ""}
                    </View>
                    <View style={styles.row}>
                        <View style={styles.col50}>
                            <View style={styles.box}>
                                <Text style={styles.label}>1. Shipper (Name and Address)</Text>
                                <Text style={styles.value}>{cust.companyId?.name || "As Per Order"}</Text>
                                {cust.companyId?.streetAddress && <Text style={styles.address}>{cust.companyId.streetAddress}</Text>}
                                {(cust.companyId?.city || cust.companyId?.state || cust.companyId?.zipCode) && (
                                    <Text style={styles.address}>
                                        {cust.companyId.city || ""}{cust.companyId.state ? `, ${cust.companyId.state}` : ""} {cust.companyId.zipCode ? `- ${cust.companyId.zipCode}` : ""}
                                    </Text>
                                )}
                                {cust.companyId?.country && <Text style={styles.address}>{cust.companyId.country}</Text>}
                            </View>
                            <View style={styles.box}>
                                <Text style={styles.label}>2. Consignee (Name and Address)</Text>
                                <Text style={styles.value}>{party.consigneeId?.name || "AS PER INVOICE"}</Text>
                                {party.consigneeId?.streetAddress && <Text style={styles.address}>{party.consigneeId.streetAddress}</Text>}
                                {(party.consigneeId?.city || party.consigneeId?.state || party.consigneeId?.zipCode) && (
                                    <Text style={styles.address}>
                                        {party.consigneeId.city || ""}{party.consigneeId.state ? `, ${party.consigneeId.state}` : ""} {party.consigneeId.zipCode ? `- ${party.consigneeId.zipCode}` : ""}
                                    </Text>
                                )}
                                {party.consigneeId?.country && <Text style={styles.address}>{party.consigneeId.country}</Text>}
                            </View>
                            <View style={[styles.boxNoBorder, { flex: 1 }]}>
                                <Text style={styles.label}>3. Notify Party (Name and Address)</Text>
                                {hasNotifyParty ? (
                                    <>
                                        <Text style={styles.value}>{notifyParty.name}</Text>
                                        {notifyParty.streetAddress && <Text style={styles.address}>{notifyParty.streetAddress}</Text>}
                                        {(notifyParty.city || notifyParty.state || notifyParty.zipCode) && (
                                            <Text style={styles.address}>
                                                {notifyParty.city || ""}{notifyParty.state ? `, ${notifyParty.state}` : ""} {notifyParty.zipCode ? `- ${notifyParty.zipCode}` : ""}
                                            </Text>
                                        )}
                                        {notifyParty.country && <Text style={styles.address}>{notifyParty.country}</Text>}
                                    </>
                                ) : (
                                    <Text style={styles.value}>SAME AS CONSIGNEE</Text>
                                )}
                            </View>
                        </View>

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
                                <Image src="/ICM_logo.png" style={styles.logo} />
                                <Text style={{ fontSize: 9, textAlign: 'center' }}>INTERNATIONAL CARGO MOVERS</Text>
                                <Text style={{ fontSize: 8, textAlign: 'center' }}>193-A BASEMENT ARJUN NAGAR SAFDARJUNG ENCLAVE, NEW DELHI-110029, DELHI, INDIA
                                </Text>
                                <Text style={{ fontSize: 7, textAlign: 'center' }}>MOBILE: +91-9810213336 || Email: ravinder@internationalcargo.com</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 5, textAlign: 'center', margin: 2 }}>
                                    Received by the Carrier. Goods as specified below in apparent good order and condition unless otherwise stated, to be transported to such place as agreed, authorised or permitted herein and subject to all the terms and conditions appearing on the front and reverse of this Bill of Lading to which the Merchant agrees by accepting this Bill of Lading, local privileges and customs notwithstanding. The particulars below as stated by the shipper and the weight, measure, quantity, condition, contents and value of the Goods are unknown to the Carrier. In WITNESS, whereof one (1) original Bill of Lading has been signed if not otherwise stated below, the same being accomplished the other(s), if any to be void. Required by the Carrier one (1) original Bill of Lading must be surrendered duly endorsed in exchange for the Goods or Delivery Order.
                                </Text>
                            </View>
                            <View style={{ borderTop: '1px solid #000', padding: 4, justifyContent: 'center' }}>
                                <Text style={styles.documentTitle}>BILL OF LADING</Text>
                                <Text style={{ fontSize: 6, textAlign: 'center', marginTop: 4 }}>ORIGINAL</Text>
                            </View>
                            <View style={{ borderTop: '1px solid #000', padding: 4, flexGrow: 1 }}>
                                <Text style={styles.label}>4. Delivery Agent (Name and Address)</Text>
                                {deliveryAgent && deliveryAgent.name ? (
                                    <>
                                        <Text style={styles.value}>{deliveryAgent.name}</Text>
                                        {deliveryAgent.streetAddress && <Text style={styles.address}>{deliveryAgent.streetAddress}</Text>}
                                        {(deliveryAgent.city || deliveryAgent.state || deliveryAgent.zipCode) && (
                                            <Text style={styles.address}>
                                                {deliveryAgent.city || ""}{deliveryAgent.state ? `, ${deliveryAgent.state}` : ""} {deliveryAgent.zipCode ? `- ${deliveryAgent.zipCode}` : ""}
                                            </Text>
                                        )}
                                        {deliveryAgent.country && <Text style={styles.address}>{deliveryAgent.country}</Text>}
                                    </>
                                ) : (
                                    <Text style={styles.value}>—</Text>
                                )}
                            </View>
                        </View>
                    </View>

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
                            <Text style={styles.value}>
                                {bol.containerNumber || bol.sealNumber || "—"}
                                {bol.lineSealNumber ? ` / L.S: ${bol.lineSealNumber}` : ""}
                                {bol.customSealNumber ? ` / C.S: ${bol.customSealNumber}` : ""}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cargoHeader}>
                        <Text style={[styles.wMarks, styles.label]}>Marks and Numbers</Text>
                        <Text style={[styles.wPkgs, styles.label]}>No. of Pkgs</Text>
                        <Text style={[styles.wDesc, styles.label]}>Description of Goods</Text>
                        <Text style={[styles.wWeight, styles.label]}>Gross Weight</Text>
                        <Text style={[styles.wMeas, styles.label]}>Chg. Weight</Text>
                    </View>

                    <View style={[styles.cargoBody, { borderBottom: '1px solid #000', minHeight: 180 }]}>
                        <Text style={styles.wMarks}>{bol.marksAndNumbers || "N/M"}</Text>
                        <Text style={styles.wPkgs}>{cargo.totalNoOfPackages || cargo.noOfPackages || "1"}</Text>
                        <View style={styles.wDesc}>
                            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>{cargo.commodity || "GENERAL CARGO"}</Text>

                            {cargo.items && cargo.items.length > 0 ? (
                                cargo.items.map((item: any, i: number) => (
                                    <View key={i} style={{ marginBottom: 4 }}>
                                        <Text style={{ fontSize: 7, fontWeight: 'bold' }}>{item.description}</Text>
                                        {item.hsnCode && <Text style={{ fontSize: 6, color: '#444' }}>HSN: {item.hsnCode}</Text>}
                                    </View>
                                ))
                            ) : (
                                <Text>{cargo.description || ""}</Text>
                            )}
                        </View>
                        <Text style={styles.wWeight}>{(cargo.totalGrossWeight || cargo.grossWeight) ? `${cargo.totalGrossWeight || cargo.grossWeight} KGS` : "—"}</Text>
                        <Text style={styles.wMeas}>{chargeableWeight} KGS</Text>
                    </View>

                    <View style={{ borderBottom: '1px solid #000', padding: 4, display: 'flex', flexDirection: 'column' }}>
                        <Text style={styles.value}>CONTAINER NO: {bol.containerNumber || "—"}</Text>
                        <Text style={styles.value}>LINE SEAL NO: {bol.lineSealNumber || "—"}</Text>
                        <Text style={styles.value}>CUSTOM SEAL NO: {bol.customSealNumber || "—"}</Text>
                    </View>

                    <View style={{ borderBottom: '1px solid #000', height: 8, backgroundColor: '#f0f0f0' }} />

                    <View style={styles.footerRow}>
                        <View style={[styles.footerCol, { width: '70%', borderRight: '1px solid #000' }]}>
                            <Text style={styles.footerLabel}>TOTAL NUMBER OF CONTAINERS OR OTHER PACKAGES OF UNITS RECEIVED BY THE CARRIER (IN WORDS)</Text>
                            <Text style={[styles.footerValue, { fontWeight: 'bold' }]}>{totalPkgsInWords}</Text>
                        </View>
                        <View style={[styles.footerCol, { width: '10%', borderRight: '1px solid #000' }]}></View>
                        <View style={[styles.footerCol, { width: '10%', borderRight: '1px solid #000' }]}></View>
                        <View style={[styles.footerCol, { width: '10%', borderRight: 0 }]}></View>
                    </View>

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
*/

