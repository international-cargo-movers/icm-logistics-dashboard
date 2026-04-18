import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 25, fontFamily: 'Helvetica', fontSize: 8, color: '#000000' },
    outerBorder: { border: '1px solid #000', flexGrow: 1, display: 'flex', flexDirection: 'column' },
    row: { display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000' },

    // Columns
    col50: { width: '50%', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' },
    col50NoBorder: { width: '50%', display: 'flex', flexDirection: 'column' },

    // Standard Boxes
    box: { padding: 4, borderBottom: '1px solid #000', minHeight: 45 },
    boxNoBorder: { padding: 4, minHeight: 45 },
    label: { fontSize: 5, color: '#333', marginBottom: 2, textTransform: 'uppercase' },
    value: { fontSize: 8, fontWeight: 'bold' },
    address: { fontSize: 6, fontWeight: 'medium' },

    // AWB Header Specifics
    awbTopBar: { flexDirection: 'row', borderBottom: '1px solid #000', backgroundColor: '#f9f9f9' },
    awbTopLeft: { width: '20%', borderRight: '1px solid #000', padding: 4, textAlign: 'center' },
    awbTopMid: { width: '20%', borderRight: '1px solid #000', padding: 4, textAlign: 'center' },
    awbTopRight: { width: '60%', padding: 4, textAlign: 'right' },
    awbNumberLabel: { fontSize: 12, fontWeight: 'bold' },

    // Micro Grid (Currency, Values)
    microRow: { flexDirection: 'row', borderBottom: '1px solid #000' },
    microCol: { padding: 3, borderRight: '1px solid #000', justifyContent: 'center' },

    // Cargo Data Grid
    cargoGridHeader: { flexDirection: 'row', borderBottom: '1px solid #000', backgroundColor: '#f0f0f0' },
    cargoGridRow: { flexDirection: 'row', minHeight: 180 },
    cwPkgs: { width: '8%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    cwGross: { width: '12%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    cwKgLb: { width: '5%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    cwClass: { width: '8%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    cwChargeable: { width: '12%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    cwRate: { width: '12%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    cwTotal: { width: '15%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    cwDesc: { width: '28%', padding: 3 },

    // Footer
    signatureBox: { width: '50%', padding: 8, borderTop: '1px solid #000', alignItems: 'center' }
});

export default function AwbPDF({ data }: { data: any }) {
    const awb = data?.shippingDocuments?.awbDetails || {};
    const ship = data?.shipmentDetails || {};
    const cust = data?.customerDetails || {};
    const party = data?.partyDetails || {};
    const cargo = data?.cargoDetails || {};

    const fullAwbNumber = `${awb.awbPrefix || '000'}-${awb.awbSerialNumber || '00000000'}`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.outerBorder}>

                    {/* TOP 11-DIGIT BAR */}
                    <View style={styles.awbTopBar}>
                        <View style={styles.awbTopLeft}><Text style={styles.awbNumberLabel}>{awb.awbPrefix || "000"}</Text></View>
                        <View style={styles.awbTopMid}><Text style={styles.awbNumberLabel}>{awb.airportOfDeparture || "ORG"}</Text></View>
                        <View style={styles.awbTopRight}><Text style={styles.awbNumberLabel}>{fullAwbNumber}</Text></View>
                    </View>

                    <View style={styles.row}>
                        {/* LEFT COLUMN */}
                        <View style={styles.col50}>
                            <View style={[styles.box, { minHeight: 55 }]}>
                                <Text style={styles.label}>Shipper's Name and Address</Text>
                                <Text style={styles.value}>{cust.companyId?.name || "AS PER INVOICE"}</Text>
                                <Text style={styles.address}>{cust.companyId?.streetAddress || ""}</Text>
                                <Text style={styles.address}>{cust.companyId?.city || ""}, {cust.companyId?.state || ""} -  {cust.companyId?.zipCode || ""}</Text>
                                <Text style={styles.address}>{cust.companyId?.country || ""}</Text>
                            </View>
                            <View style={[styles.box, { minHeight: 55 }]}>
                                <Text style={styles.label}>Consignee's Name and Address</Text>
                                <Text style={styles.value}>{party.consigneeId?.name || "AS PER INVOICE"}</Text>
                                <Text style={styles.address}>{party.consigneeId?.streetAddress || ""}</Text>
                                <Text style={styles.address}>{party.consigneeId?.city || ""}, {party.consigneeId?.state || ""} -  {party.consigneeId?.zipCode || ""}</Text>
                                <Text style={styles.address}>{party.consigneeId?.country || ""} </Text>

                            </View>
                            <View style={styles.boxNoBorder}>
                                <Text style={styles.label}>Issuing Carrier's Agent Name and City</Text>
                                <Text style={styles.value}>INTERNATIONAL CARGO MOVERS</Text>
                                <Text style={styles.value}>NEW DELHI, INDIA</Text>
                            </View>
                        </View>

                        {/* RIGHT COLUMN */}
                        <View style={styles.col50NoBorder}>
                            <View style={[styles.box, { minHeight: 55 }]}>
                                <Text style={styles.label}>Not Negotiable</Text>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', marginVertical: 4 }}>Air Waybill</Text>
                                <Text style={{ fontSize: 6 }}>Issued By: INTERNATIONAL CARGO MOVERS</Text>
                            </View>
                            <View style={[styles.box, { minHeight: 55 }]}>
                                <Text style={{ fontSize: 6, lineHeight: 1.2 }}>
                                    It is agreed that the goods described herein are accepted in apparent good order and condition (except as noted) for carriage SUBJECT TO THE CONDITIONS OF CONTRACT ON THE REVERSE HEREOF.
                                </Text>
                            </View>
                            <View style={styles.microRow}>
                                <View style={[styles.microCol, { width: '50%' }]}>
                                    <Text style={styles.label}>Agent's IATA Code</Text>
                                    <Text style={styles.value}>{awb.iataCode || "—"}</Text>
                                </View>
                                <View style={[styles.microCol, { width: '50%', borderRight: 'none' }]}>
                                    <Text style={styles.label}>Account No.</Text>
                                    <Text style={styles.value}>—</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* ROUTING & VALUE ROW */}
                    <View style={styles.row}>
                        <View style={{ width: '50%', display: 'flex', flexDirection: 'row' }}>
                            <View style={[styles.microCol, { width: '50%' }]}>
                                <Text style={styles.label}>Airport of Departure (Addr. of First Carrier)</Text>
                                <Text style={styles.value}>{awb.airportOfDeparture || ship.portOfLoading || "—"}</Text>
                            </View>
                            <View style={[styles.microCol, { width: '50%' }]}>
                                <Text style={styles.label}>Accounting Information</Text>
                                <Text style={styles.value}>{awb.accountingInformation || "FREIGHT PREPAID"}</Text>
                            </View>
                        </View>

                        <View style={{ width: '50%', display: 'flex', flexDirection: 'row' }}>
                            <View style={[styles.microCol, { width: '20%' }]}>
                                <Text style={styles.label}>Currency</Text>
                                <Text style={{ fontSize: 8, textAlign: 'center' }}>USD</Text>
                            </View>
                            <View style={[styles.microCol, { width: '40%' }]}>
                                <Text style={styles.label}>Declared Value for Carriage</Text>
                                <Text style={{ fontSize: 8, textAlign: 'center' }}>{awb.declaredValueCarriage || "NVD"}</Text>
                            </View>
                            <View style={[styles.microCol, { width: '40%', borderRight: 'none' }]}>
                                <Text style={styles.label}>Declared Value for Customs</Text>
                                <Text style={{ fontSize: 8, textAlign: 'center' }}>{awb.declaredValueCustoms || "NCV"}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.microCol, { width: '25%' }]}>
                            <Text style={styles.label}>Airport of Destination</Text>
                            <Text style={styles.value}>{awb.airportOfDestination || ship.portOfDischarge || "—"}</Text>
                        </View>
                        <View style={[styles.microCol, { width: '25%' }]}>
                            <Text style={styles.label}>Flight/Date</Text>
                            <Text style={styles.value}>{ship.vesselFlight || "TBA"}</Text>
                        </View>
                        <View style={[styles.microCol, { width: '50%', borderRight: 'none' }]}>
                            <Text style={styles.label}>Handling Information</Text>
                            <Text style={styles.value}>{awb.handlingInformation || "—"}</Text>
                        </View>
                    </View>

                    {/* MAIN CARGO GRID */}
                    <View style={styles.cargoGridHeader}>
                        <View style={styles.cwPkgs}><Text style={styles.label}>No. of Pieces</Text></View>
                        <View style={styles.cwGross}><Text style={styles.label}>Gross Weight</Text></View>
                        <View style={styles.cwKgLb}><Text style={styles.label}>kg/lb</Text></View>
                        <View style={styles.cwClass}><Text style={styles.label}>Rate Class</Text></View>
                        <View style={styles.cwChargeable}><Text style={styles.label}>Chargeable Wt</Text></View>
                        <View style={styles.cwRate}><Text style={styles.label}>Rate / Charge</Text></View>
                        <View style={styles.cwTotal}><Text style={styles.label}>Total</Text></View>
                        <View style={styles.cwDesc}><Text style={styles.label}>Nature and Quantity of Goods</Text></View>
                    </View>

                    <View style={styles.cargoGridRow}>
                        <Text style={styles.cwPkgs}>{cargo.noOfPackages || "1"}</Text>
                        <Text style={styles.cwGross}>{cargo.grossWeight || "—"}</Text>
                        <Text style={styles.cwKgLb}>K</Text>
                        <Text style={styles.cwClass}>Q</Text>
                        <Text style={styles.cwChargeable}>{cargo.volumetricWeight || "—"}</Text>
                        <Text style={styles.cwRate}>AS AGREED</Text>
                        <Text style={styles.cwTotal}>AS AGREED</Text>
                        <Text style={styles.cwDesc}>
                            {cargo.commodity || "GENERAL CARGO"}{"\n\n"}
                            {cargo.description || ""}{"\n\n"}
                            DIMENSIONS: AS PER ATTACHED PL
                        </Text>
                    </View>

                    {/* FOOTER SIGNATURES */}
                    <View style={styles.row}>
                        <View style={[styles.signatureBox, { borderRight: '1px solid #000' }]}>
                            <Text style={{ fontSize: 6, marginBottom: 15, fontStyle: 'italic' }}>Signature of Shipper or his Agent</Text>
                            <Text style={{ fontSize: 8 }}>FOR INTERNATIONAL CARGO MOVERS</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={{ fontSize: 6, marginBottom: 15, fontStyle: 'italic' }}>Signature of Issuing Carrier or its Agent</Text>
                            <Text style={{ fontSize: 8 }}>AS AUTHORIZED AGENT</Text>
                        </View>
                    </View>

                </View>
            </Page>
        </Document>
    );
}