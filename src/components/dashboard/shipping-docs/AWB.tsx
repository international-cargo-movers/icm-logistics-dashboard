import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Svg, Polygon } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 15, fontFamily: 'Helvetica', fontSize: 7, color: '#000' },
    outerBorder: { border: '1px solid #000', flexGrow: 1, display: 'flex', flexDirection: 'column' },
    
    // Utilities
    row: { display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000' },
    colRightBorder: { borderRight: '1px solid #000' },
    label: { fontSize: 5, color: '#000', marginBottom: 2 },
    value: { fontSize: 7, fontWeight: 'bold' },
    valueLg: { fontSize: 9, fontWeight: 'bold' },
    address: { fontSize: 6, lineHeight: 1.2 },
    
    topBar: { flexDirection: 'row', borderBottom: '1px solid #000', minHeight: 20, alignItems: 'center' },
    halfWidth: { width: '50%', flexDirection: 'column' },
    microBox: { padding: 2, borderRight: '1px solid #000', flex: 1 },
    
    // Cargo Grid
    cargoHeader: { flexDirection: 'row', borderBottom: '1px solid #000', backgroundColor: '#fafafa', minHeight: 25 },
    cargoRow: { flexDirection: 'row', minHeight: 200, borderBottom: '1px solid #000' },
    cwPkgs: { width: '8%', borderRight: '1px solid #000', padding: 2, textAlign: 'center' },
    cwGross: { width: '12%', borderRight: '1px solid #000', padding: 2, textAlign: 'center' },
    cwKg: { width: '4%', borderRight: '1px solid #000', padding: 2, textAlign: 'center' },
    cwClass: { width: '6%', borderRight: '1px solid #000', padding: 2, textAlign: 'center' },
    cwComm: { width: '8%', borderRight: '1px solid #000', padding: 2, textAlign: 'center' },
    cwChargeable: { width: '12%', borderRight: '1px solid #000', padding: 2, textAlign: 'center' },
    cwRate: { width: '10%', borderRight: '1px solid #000', padding: 2, textAlign: 'center' },
    cwTotal: { width: '12%', borderRight: '1px solid #000', padding: 2, textAlign: 'center' },
    cwDesc: { width: '28%', padding: 4 },

    footerRow: { flexDirection: 'row', flexGrow: 1 },
    footerLeft: { width: '50%', borderRight: '1px solid #000', flexDirection: 'column' },
    footerRight: { width: '50%', flexDirection: 'column' }
});

// --- CUSTOM SVG TRAPEZOID ROW COMPONENT ---
const TrapezoidRow = ({ title, width, prepaidVal, collectVal, leftLabel, rightLabel, height = 35 }: any) => (
    <View style={{ flexDirection: 'row', height, borderBottom: '1px solid #000', position: 'relative' }}>
        
        {/* Left Column (Prepaid) */}
        {/* Added paddingTop to push values below the trapezoid */}
        <View style={{ width: '50%', borderRight: '1px solid #000', position: 'relative', paddingTop: 12 }}>
            {leftLabel && <Text style={{ fontSize: 5, position: 'absolute', top: 2, left: 4 }}>{leftLabel}</Text>}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.value}>{prepaidVal}</Text>
            </View>
        </View>

        {/* Right Column (Collect) */}
        {/* Added paddingTop to push values below the trapezoid */}
        <View style={{ width: '50%', position: 'relative', paddingTop: 12 }}>
            {rightLabel && <Text style={{ fontSize: 5, position: 'absolute', top: 2, left: 4 }}>{rightLabel}</Text>}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.value}>{collectVal}</Text>
            </View>
        </View>
        
        {/* Absolute Top-Aligned Trapezoid Label */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }}>
            {/* The trapezoid is strictly locked to 12px height at the very top of the row */}
            <View style={{ width: width, height: 12, position: 'relative' }}>
                <Svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 100 10" preserveAspectRatio="none">
                    <Polygon points="0,0 100,0 90,10 10,10" fill="#ffffff" stroke="#000000" strokeWidth={0.5} />
                </Svg>
                <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 5, color: '#000', fontWeight: 'bold' }}>{title}</Text>
                </View>
            </View>
        </View>

    </View>
);

export default function AwbPDF({ data }: { data: any }) {
    const awb = data?.shippingDocuments?.awbDetails || {};
    const ship = data?.shipmentDetails || {};
    const cust = data?.customerDetails || {};
    const party = data?.partyDetails || {};
    const cargo = data?.cargoDetails || {};

    const grossWeight = Number(cargo.totalGrossWeight || cargo.grossWeight || 0).toFixed(2);
    const volumetricWeight = Number(cargo.totalVolumetricWeight || cargo.volumetricWeight || 0).toFixed(2);
    const chargeableWeight = Math.max(Number(grossWeight), Number(volumetricWeight)).toFixed(2);
    const fullAwbNumber = `${awb.awbPrefix || '000'} - ${awb.awbSerialNumber || '00000000'}`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.outerBorder}>

                    {/* TOP AWB NUMBER BAR */}
                    <View style={styles.topBar}>
                        <View style={[styles.colRightBorder, { width: '10%', padding: 4, textAlign: 'center' }]}><Text style={styles.valueLg}>{awb.awbPrefix || "000"}</Text></View>
                        <View style={[styles.colRightBorder, { width: '10%', padding: 4, textAlign: 'center' }]}><Text style={styles.valueLg}>{ship.portOfLoading || "ORG"}</Text></View>
                        <View style={[styles.colRightBorder, { width: '30%', padding: 4 }]}><Text style={styles.valueLg}>{awb.awbSerialNumber || "00000000"}</Text></View>
                        <View style={{ width: '50%', padding: 4, textAlign: 'right' }}><Text style={styles.valueLg}>{fullAwbNumber}</Text></View>
                    </View>

                    {/* SHIPPER / CONSIGNEE / AGENT SPLIT */}
                    <View style={styles.row}>
                        <View style={[styles.halfWidth, styles.colRightBorder]}>
                            <View style={{ borderBottom: '1px solid #000', minHeight: 60, padding: 2 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={styles.label}>{"Shipper's Name and Address"}</Text><Text style={styles.label}>{"Shipper's Account Number"}</Text></View>
                                <Text style={styles.value}>{cust.companyId?.name?.toUpperCase()}</Text>
                                <Text style={styles.address}>{cust.companyId?.streetAddress?.toUpperCase()}</Text>
                                <Text style={styles.address}>{cust.companyId?.city?.toUpperCase()}, {cust.companyId?.zipCode}</Text>
                            </View>
                            <View style={{ borderBottom: '1px solid #000', minHeight: 60, padding: 2 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={styles.label}>{"Consignee's Name and Address"}</Text><Text style={styles.label}>{"Consignee's Account Number"}</Text></View>
                                <Text style={styles.value}>{party.consigneeId?.name?.toUpperCase()}</Text>
                                <Text style={styles.address}>{party.consigneeId?.streetAddress?.toUpperCase()}</Text>
                                <Text style={styles.address}>{party.consigneeId?.city?.toUpperCase()}, {party.consigneeId?.zipCode}</Text>
                            </View>
                            <View style={{ minHeight: 40, padding: 2 }}>
                                <Text style={styles.label}>{"Issuing Carrier's Agent Name and City"}</Text>
                                <Text style={styles.value}>INTERNATIONAL CARGO MOVERS</Text>
                                <Text style={styles.address}>NEW DELHI, INDIA</Text>
                            </View>
                        </View>
                        <View style={styles.halfWidth}>
                            <View style={{ padding: 4, borderBottom: '1px solid #000', minHeight: 60 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={styles.label}>Not Negotiable</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                        <Text style={styles.label}>HAWB NO. </Text>
                                        <Text style={[styles.value, { fontSize: 7, marginLeft: 2 }]}>{awb.hawbNumber?.toUpperCase() || ""}</Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Air Waybill</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <Text style={styles.label}>Issued by</Text>
                                    <Image src="/ICM_logo.png" style={{ width: 100, marginLeft: 10 }} />
                                </View>
                            </View>
                            <View style={{ padding: 4, borderBottom: '1px solid #000', minHeight: 60 }}>
                                <Text style={{ fontSize: 5, lineHeight: 1.1, textAlign: 'justify' }}>
                                    It is agreed that the goods described herein are accepted in apparent good order and condition (except as noted) for carriage SUBJECT TO THE CONDITIONS OF CONTRACT ON THE REVERSE HEREOF. ALL GOODS MAY BE CARRIED BY ANY OTHER MEANS INCLUDING ROAD OR ANY OTHER CARRIER UNLESS SPECIFIC CONTRARY INSTRUCTIONS ARE GIVEN HEREON BY THE SHIPPER, AND SHIPPER AGREES THAT THE SHIPMENT MAY BE CARRIED VIA INTERMEDIATE STOPPING PLACES WHICH THE CARRIER DEEMS APPROPRIATE. THE SHIPPER’S ATTENTION IS DRAWN TO THE NOTICE CONCERNING CARRIER’S LIMITATION OF LIABILITY. Shipper may increase such limitation of liability by declaring a higher value for carriage and paying a supplemental charge if required.																			
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', flexGrow: 1 }}>
                                <View style={{ width: '50%', padding: 2, borderRight: '1px solid #000' }}><Text style={styles.label}>Accounting Information</Text><Text style={styles.value}>{awb.accountingInformation || "NORMAL"}</Text></View>
                                <View style={{ width: '50%', padding: 2 }}><Text style={styles.label}> </Text><Text style={styles.value}>FREIGHT {awb.wtValPayment || "PREPAID"}</Text></View>
                            </View>
                        </View>
                    </View>

                    {/* AIRPORT & ROUTING ROW */}
                    <View style={styles.row}>
                        <View style={[styles.colRightBorder, { width: '30%', padding: 2 }]}><Text style={styles.label}>Airport of Departure (Addr. of First Carrier) and Requested Routing</Text><Text style={styles.value}>{awb.airportOfDeparture || ship.portOfLoading}</Text></View>
                        <View style={{ width: '70%', flexDirection: 'row' }}>
                            <View style={[styles.microBox, { width: '8%' }]}><Text style={styles.label}>To</Text><Text style={styles.value}>{awb.routingTo1}</Text></View>
                            <View style={[styles.microBox, { width: '12%' }]}><Text style={styles.label}>By First Carrier</Text><Text style={styles.value}>{awb.routingBy1}</Text></View>
                            <View style={[styles.microBox, { width: '5%' }]}><Text style={styles.label}>To</Text><Text style={styles.value}>{awb.routingTo2}</Text></View>
                            <View style={[styles.microBox, { width: '5%' }]}><Text style={styles.label}>By</Text><Text style={styles.value}>{awb.routingBy2}</Text></View>
                            <View style={[styles.microBox, { width: '10%' }]}><Text style={styles.label}>Currency</Text><Text style={styles.value}>{awb.currencyCode || "INR"}</Text></View>
                            <View style={[styles.microBox, { width: '8%' }]}><Text style={styles.label}>CHGS</Text><Text style={styles.value}>{awb.chgsCode || "PX"}</Text></View>
                            <View style={[styles.microBox, { width: '10%' }]}><Text style={styles.label}>WT/VAL</Text><Text style={styles.value}>{awb.wtValPayment === "COLL" ? "  X" : "X  "}</Text></View>
                            <View style={[styles.microBox, { width: '10%' }]}><Text style={styles.label}>Other</Text><Text style={styles.value}>{awb.otherPayment === "COLL" ? "  X" : "X  "}</Text></View>
                            <View style={[styles.microBox, { width: '15%' }]}><Text style={styles.label}>D.V. Carriage</Text><Text style={styles.value}>{awb.declaredValueCarriage || "NVD"}</Text></View>
                            <View style={{ padding: 2, width: '15%' }}><Text style={styles.label}>D.V. Customs</Text><Text style={styles.value}>{awb.declaredValueCustoms || "NCV"}</Text></View>
                        </View>
                    </View>

                    {/* CARGO GRID */}
                    <View style={styles.cargoHeader}>
                        <View style={styles.cwPkgs}><Text style={styles.label}>No. of Pcs</Text></View>
                        <View style={styles.cwGross}><Text style={styles.label}>Gross Weight</Text></View>
                        <View style={styles.cwKg}><Text style={styles.label}>kg</Text></View>
                        <View style={styles.cwClass}><Text style={styles.label}>Class</Text></View>
                        <View style={styles.cwComm}><Text style={styles.label}>Item No</Text></View>
                        <View style={styles.cwChargeable}><Text style={styles.label}>Chargeable Wt</Text></View>
                        <View style={styles.cwRate}><Text style={styles.label}>Rate</Text></View>
                        <View style={styles.cwTotal}><Text style={styles.label}>Total</Text></View>
                        <View style={styles.cwDesc}><Text style={styles.label}>Nature and Quantity of Goods</Text></View>
                    </View>

                    <View style={styles.cargoRow}>
                        <View style={styles.cwPkgs}><Text style={styles.value}>{cargo.totalNoOfPackages}</Text></View>
                        <View style={styles.cwGross}><Text style={styles.value}>{grossWeight}</Text></View>
                        <View style={styles.cwKg}><Text style={styles.value}>K</Text></View>
                        <View style={styles.cwClass}><Text style={styles.value}>Q</Text></View>
                        <View style={styles.cwComm}><Text style={styles.value}></Text></View>
                        <View style={styles.cwChargeable}><Text style={styles.value}>{chargeableWeight}</Text></View>
                        <View style={styles.cwRate}><Text style={styles.value}>AS AGREED</Text></View>
                        <View style={styles.cwTotal}><Text style={styles.value}>AS AGREED</Text></View>
                        <View style={styles.cwDesc}>
                            <Text style={[styles.value, { marginBottom: 2 }]}>{cargo.commodity?.toUpperCase()}</Text>
                            {cargo.items && cargo.items.length > 0 ? (
                                cargo.items.map((item: any, i: number) => (
                                    <View key={i} style={{ marginBottom: 2 }}>
                                        <Text style={{ fontSize: 7, fontWeight: 'bold' }}>{item.description?.toUpperCase()}</Text>
                                        {item.hsnCode && (
                                            <Text style={{ fontSize: 6, color: '#444' }}>HSN: {item.hsnCode}</Text>
                                        )}
                                    </View>
                                ))
                            ) : (
                                cargo.hsnCode && <Text style={{ fontSize: 6, color: '#444' }}>HSN: {cargo.hsnCode}</Text>
                            )}
                        </View>
                    </View>

                    {/* FOOTER SPLIT (Trapezoids applied here) */}
                    <View style={styles.footerRow}>
                        
                        {/* LEFT COLUMN: The Charges Breakdown */}
                        <View style={styles.footerLeft}>
                            
                            <TrapezoidRow title="Weight Charge" width="45%" prepaidVal={awb.charges?.weight?.prepaid || "AS AGREED"} collectVal={awb.charges?.weight?.collect || ""} leftLabel="Prepaid" rightLabel="Collect" height={45} />
                            <TrapezoidRow title="Valuation Charge" width="50%" prepaidVal={awb.charges?.valuation?.prepaid || ""} collectVal={awb.charges?.valuation?.collect || ""} height={35} />
                            <TrapezoidRow title="Tax" width="25%" prepaidVal={awb.charges?.tax?.prepaid || ""} collectVal={awb.charges?.tax?.collect || ""} height={35} />
                            <TrapezoidRow title="Total Other Charges Due Agent" width="85%" prepaidVal={awb.charges?.otherAgent?.prepaid || ""} collectVal={awb.charges?.otherAgent?.collect || ""} height={35} />
                            <TrapezoidRow title="Total Other Charges Due Carrier" width="85%" prepaidVal={awb.charges?.otherCarrier?.prepaid || ""} collectVal={awb.charges?.otherCarrier?.collect || ""} height={35} />
                            
                            {/* Total Prepaid / Total Collect row (Standard Boxes) */}
                            <View style={{ flexDirection: 'row', height: 40, borderBottom: '1px solid #000' }}>
                                <View style={{ width: '50%', borderRight: '1px solid #000', position: 'relative', paddingTop: 12 }}>
                                    <Text style={{ fontSize: 5, position: 'absolute', top: 2, left: 4 }}>Total Prepaid</Text>
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={styles.value}>{awb.charges?.total?.prepaid || "AS AGREED"}</Text></View>
                                </View>
                                <View style={{ width: '50%', position: 'relative', paddingTop: 12 }}>
                                    <Text style={{ fontSize: 5, position: 'absolute', top: 2, left: 4 }}>Total Collect</Text>
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={styles.value}>{awb.charges?.total?.collect || ""}</Text></View>
                                </View>
                            </View>

                            {/* Bottom 3 Utility Rows */}
                            <View style={{ flexDirection: 'row', height: 20 }}>
                                <View style={{ width: '35%', borderRight: '1px solid #000', padding: 2 }}>
                                    <Text style={styles.label}>Currency Conversion Rates</Text>
                                </View>
                                <View style={{ width: '35%', borderRight: '1px solid #000', padding: 2 }}>
                                    <Text style={styles.label}>CC Charges in Dest. Currency</Text>
                                </View>
                                <View style={{ width: '30%', padding: 2 }}>
                                    <Text style={styles.label}>Charges at Destination</Text>
                                </View>
                            </View>

                        </View>

                        {/* RIGHT COLUMN: Signatures & Notes */}
                        <View style={styles.footerRight}>
                            <View style={{ borderBottom: '1px solid #000', minHeight: 60, padding: 2 }}>
                                <Text style={styles.label}>Overseas Agent Name and Address</Text>
                                <Text style={styles.value}>{party.overseasAgentId?.name?.toUpperCase()}</Text>
                                <Text style={styles.address}>{party.overseasAgentId?.streetAddress?.toUpperCase()}</Text>
                                <Text style={styles.address}>
                                    {party.overseasAgentId?.city?.toUpperCase()}
                                    {party.overseasAgentId?.zipCode ? `, ${party.overseasAgentId.zipCode}` : ""}
                                </Text>
                            </View>
                            <View style={{ padding: 4, minHeight: 40, borderBottom: '1px solid #000' }}><Text style={styles.label}>Other Charges</Text></View>
                            <View style={{ padding: 4, minHeight: 50, borderBottom: '1px solid #000' }}>
                                <Text style={{ fontSize: 5, textAlign: 'justify' }}>Shipper certifies that the particulars on the face hereof are correct...</Text>
                            </View>
                            <View style={{ flexDirection: 'row', flexGrow: 1 }}>
                                <View style={[styles.colRightBorder, { width: '50%', padding: 4, justifyContent: 'flex-end', alignItems: 'center' }]}>
                                    <Text style={{ borderTop: '1px dotted #000', width: '80%', textAlign: 'center', paddingTop: 2, fontSize: 6 }}>Signature of Shipper or his Agent</Text>
                                </View>
                                <View style={{ width: '50%', padding: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', width: '100%', marginBottom: 10 }}>
                                        <View style={{ width: '50%' }}><Text style={styles.value}>{awb.executedOnDate || "—"}</Text><Text style={styles.label}>Executed on (date)</Text></View>
                                        <View style={{ width: '50%' }}><Text style={styles.value}>{awb.executedAtPlace || "—"}</Text><Text style={styles.label}>at (place)</Text></View>
                                    </View>
                                    <Text style={{ borderTop: '1px dotted #000', width: '90%', textAlign: 'center', paddingTop: 2, fontSize: 6 }}>Signature of Issuing Carrier or its Agent</Text>
                                </View>
                            </View>
                        </View>

                    </View>

                </View>
            </Page>
        </Document>
    );
}
// import React from 'react';
// import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// const styles = StyleSheet.create({
//     page: { padding: 25, fontFamily: 'Helvetica', fontSize: 8, color: '#000000' },
//     logo: { width: 120 },
//     outerBorder: { border: '1px solid #000', flexGrow: 1, display: 'flex', flexDirection: 'column' },
//     row: { display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000' },

//     // Columns
//     col50: { width: '50%', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' },
//     col50NoBorder: { width: '50%', display: 'flex', flexDirection: 'column' },

//     // Standard Boxes
//     box: { padding: 4, borderBottom: '1px solid #000', minHeight: 45 },
//     boxNoBorder: { padding: 4, minHeight: 45 },
//     label: { fontSize: 5, color: '#333', marginBottom: 2, textTransform: 'uppercase' },
//     value: { fontSize: 8, fontWeight: 'bold' },
//     address: { fontSize: 6, fontWeight: 'medium' },

//     // AWB Header Specifics
//     awbTopBar: { flexDirection: 'row', borderBottom: '1px solid #000', backgroundColor: '#f9f9f9' },
//     awbTopLeft: { width: '20%', borderRight: '1px solid #000', padding: 4, textAlign: 'center' },
//     awbTopMid: { width: '20%', borderRight: '1px solid #000', padding: 4, textAlign: 'center' },
//     awbTopRight: { width: '60%', padding: 4, textAlign: 'right' },
//     awbNumberLabel: { fontSize: 12, fontWeight: 'bold' },

//     // Micro Grid (Currency, Values)
//     microRow: { flexDirection: 'row', borderBottom: '1px solid #000' },
//     microCol: { padding: 3, borderRight: '1px solid #000', justifyContent: 'center' },

//     // Cargo Data Grid
//     cargoGridHeader: { flexDirection: 'row', borderBottom: '1px solid #000', backgroundColor: '#f0f0f0' },
//     cargoGridRow: { flexDirection: 'row', minHeight: 180 },
//     cwPkgs: { width: '8%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
//     cwGross: { width: '12%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
//     cwKgLb: { width: '5%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
//     cwClass: { width: '8%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
//     cwChargeable: { width: '12%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
//     cwRate: { width: '12%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
//     cwTotal: { width: '15%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
//     cwDesc: { width: '28%', padding: 3 },

//     // Footer
//     signatureBox: { width: '50%', padding: 8, borderTop: '1px solid #000', alignItems: 'center' }
// });

// export default function AwbPDF({ data }: { data: any }) {
//     // Correctly dive into shippingDocuments for AWB specifics
//     const awb = data?.shippingDocuments?.awbDetails || {};
//     const ship = data?.shipmentDetails || {};
//     const cust = data?.customerDetails || {};
//     const party = data?.partyDetails || {};
//     const cargo = data?.cargoDetails || {};

//     const grossWeight = Number(cargo.totalGrossWeight || cargo.grossWeight || 0);
//     const volumetricWeight = Number(cargo.totalVolumetricWeight || cargo.volumetricWeight || 0);
//     const chargeableWeight = Math.max(grossWeight, volumetricWeight).toFixed(2);

//     const fullAwbNumber = `${awb.awbPrefix || '000'}-${awb.awbSerialNumber || '00000000'}`;

//     // Delivery Agent / Overseas Agent
//     const deliveryAgent = party.overseasAgentId;

//     return (
//         <Document>
//             <Page size="A4" style={styles.page}>
//                 <View style={styles.outerBorder}>

//                     {/* TOP 11-DIGIT BAR */}
//                     <View style={styles.awbTopBar}>
//                         <View style={styles.awbTopLeft}><Text style={styles.awbNumberLabel}>{awb.awbPrefix || "000"}</Text></View>
//                         <View style={styles.awbTopMid}><Text style={styles.awbNumberLabel}>{ship.portOfLoading || "ORG"}</Text></View>
//                         <View style={styles.awbTopRight}><Text style={styles.awbNumberLabel}>{fullAwbNumber}</Text></View>
//                     </View>

//                     <View style={styles.row}>
//                         {/* LEFT COLUMN */}
//                         <View style={styles.col50}>
//                             <View style={[styles.box, { minHeight: 60 }]}>
//                                 <View style={{ flexDirection: 'row', borderBottom: '0.5px solid #eee', marginBottom: 2, paddingBottom: 1 }}>
//                                     <View style={{ flex: 1 }}><Text style={styles.label}>Shipper's Name and Address</Text></View>
//                                     <View style={{ width: 100 }}><Text style={styles.label}>Shipper's Account Number</Text></View>
//                                 </View>
//                                 <View style={{ flexDirection: 'row' }}>
//                                     <View style={{ flex: 1 }}>
//                                         <Text style={styles.value}>{cust.companyId?.name || "AS PER INVOICE"}</Text>
//                                         {cust.companyId?.streetAddress && <Text style={styles.address}>{cust.companyId.streetAddress}</Text>}
//                                         {(cust.companyId?.city || cust.companyId?.state || cust.companyId?.zipCode) && (
//                                             <Text style={styles.address}>
//                                                 {cust.companyId.city || ""}{cust.companyId.state ? `, ${cust.companyId.state}` : ""} {cust.companyId.zipCode ? `- ${cust.companyId.zipCode}` : ""}
//                                             </Text>
//                                         )}
//                                         {cust.companyId?.country && <Text style={styles.address}>{cust.companyId.country}</Text>}
//                                     </View>
//                                     <View style={{ width: 100 }}>
//                                         <Text style={[styles.value, { fontSize: 7 }]}>{awb.shipperAccountNumber || ""}</Text>
//                                     </View>
//                                 </View>
//                             </View>
//                             <View style={[styles.box, { minHeight: 60 }]}>
//                                 <View style={{ flexDirection: 'row', borderBottom: '0.5px solid #eee', marginBottom: 2, paddingBottom: 1 }}>
//                                     <View style={{ flex: 1 }}><Text style={styles.label}>Consignee's Name and Address</Text></View>
//                                     <View style={{ width: 100 }}><Text style={styles.label}>Consignee's Account Number</Text></View>
//                                 </View>
//                                 <View style={{ flexDirection: 'row' }}>
//                                     <View style={{ flex: 1 }}>
//                                         <Text style={styles.value}>{party.consigneeId?.name || "AS PER INVOICE"}</Text>
//                                         {party.consigneeId?.streetAddress && <Text style={styles.address}>{party.consigneeId.streetAddress}</Text>}
//                                         {(party.consigneeId?.city || party.consigneeId?.state || party.consigneeId?.zipCode) && (
//                                             <Text style={styles.address}>
//                                                 {party.consigneeId.city || ""}{party.consigneeId.state ? `, ${party.consigneeId.state}` : ""} {party.consigneeId.zipCode ? `- ${party.consigneeId.zipCode}` : ""}
//                                             </Text>
//                                         )}
//                                         {party.consigneeId?.country && <Text style={styles.address}>{party.consigneeId.country}</Text>}
//                                     </View>
//                                     <View style={{ width: 100 }}>
//                                         <Text style={[styles.value, { fontSize: 7 }]}>{awb.consigneeAccountNumber || ""}</Text>
//                                     </View>
//                                 </View>
//                             </View>
//                             <View style={styles.box}>
//                                 <Text style={styles.label}>Issuing Carrier's Agent Name and City</Text>
//                                 <Text style={styles.value}>INTERNATIONAL CARGO MOVERS</Text>
//                                 <Text style={styles.value}>NEW DELHI, INDIA</Text>
//                             </View>
//                             <View style={[styles.microRow, { borderBottom: 'none' }]}>
//                                 <View style={[styles.microCol, { width: '50%' }]}>
//                                     <Text style={styles.label}>Agent's IATA Code</Text>
//                                     <Text style={styles.value}>{awb.iataCode || "—"}</Text>
//                                 </View>
//                                 <View style={[styles.microCol, { width: '50%', borderRight: 'none' }]}>
//                                     <Text style={styles.label}>Account No.</Text>
//                                     <Text style={styles.value}>—</Text>
//                                 </View>
//                             </View>
//                         </View>

//                         {/* RIGHT COLUMN */}
//                         <View style={styles.col50NoBorder}>
//                             <View style={[styles.box, { minHeight: 55, justifyContent: 'center' }]}>
//                                 <Text style={styles.label}>Not Negotiable</Text>
//                                 <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 2 }}>Air Waybill</Text>
//                                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//                                     <Text style={{ fontSize: 6, marginRight: 5 }}>Issued By:</Text>
//                                     <Image src="/ICM logo.png" style={styles.logo} />
//                                 </View>
//                             </View>
//                             <View style={[styles.box, { minHeight: 60, borderBottom: '1px solid #000' }]}>
//                                 <Text style={styles.label}>Handling Information / Overseas Agent</Text>
//                                 {deliveryAgent && deliveryAgent.name ? (
//                                     <>
//                                         <Text style={[styles.value, { fontSize: 7 }]}>DELIVERY AGENT: {deliveryAgent.name}</Text>
//                                         {deliveryAgent.streetAddress && <Text style={styles.address}>{deliveryAgent.streetAddress}</Text>}
//                                         {(deliveryAgent.city || deliveryAgent.state || deliveryAgent.zipCode) && (
//                                             <Text style={styles.address}>
//                                                 {deliveryAgent.city || ""}{deliveryAgent.state ? `, ${deliveryAgent.state}` : ""} {deliveryAgent.zipCode ? `- ${deliveryAgent.zipCode}` : ""}
//                                             </Text>
//                                         )}
//                                         {deliveryAgent.country && <Text style={styles.address}>{deliveryAgent.country}</Text>}
//                                     </>
//                                 ) : (
//                                     <Text style={styles.value}>—</Text>
//                                 )}
//                             </View>
//                             <View style={[styles.boxNoBorder, { minHeight: 50 }]}>
//                                 <Text style={{ fontSize: 6, lineHeight: 1.2 }}>
//                                     It is agreed that the goods described herein are accepted in apparent good order and condition (except as noted) for carriage SUBJECT TO THE CONDITIONS OF CONTRACT ON THE REVERSE HEREOF. ALL GOODS MAY BE CARRIED BY ANY OTHER MEANS INCLUDING ROAD OR ANY OTHER CARRIER UNLESS SPECIFIC CONTRARY INSTRUCTIONS ARE GIVEN HEREON BY THE SHIPPER, AND SHIPPER AGREES THAT THE SHIPMENT MAY BE CARRIED VIA INTERMEDIATE STOPPING PLACES WHICH THE CARRIER DEEMS APPROPRIATE. THE SHIPPER’S ATTENTION IS DRAWN TO THE NOTICE CONCERNING CARRIER’S LIMITATION OF LIABILITY. Shipper may increase such limitation of liability by declaring a higher value for carriage and paying a supplemental charge if required.
//                                 </Text>
//                             </View>
//                         </View>
//                     </View>

//                     {/* ROUTING & VALUE ROW */}
//                     <View style={styles.row}>
//                         <View style={{ width: '50%', display: 'flex', flexDirection: 'row' }}>
//                             <View style={[styles.microCol, { width: '50%' }]}>
//                                 <Text style={styles.label}>Airport of Departure (Addr. of First Carrier)</Text>
//                                 <Text style={styles.value}>{awb.airportOfDeparture || ship.portOfLoading || "—"}</Text>
//                             </View>
//                             <View style={[styles.microCol, { width: '50%' }]}>
//                                 <Text style={styles.label}>Accounting Information</Text>
//                                 <Text style={styles.value}>{awb.accountingInformation || "FREIGHT PREPAID"}</Text>
//                             </View>
//                         </View>

//                         <View style={{ width: '50%', display: 'flex', flexDirection: 'row' }}>
//                             <View style={[styles.microCol, { width: '20%' }]}>
//                                 <Text style={styles.label}>Currency</Text>
//                                 <Text style={{ fontSize: 8, textAlign: 'center' }}>USD</Text>
//                             </View>
//                             <View style={[styles.microCol, { width: '40%' }]}>
//                                 <Text style={styles.label}>Declared Value for Carriage</Text>
//                                 <Text style={{ fontSize: 8, textAlign: 'center' }}>{awb.declaredValueCarriage || "NVD"}</Text>
//                             </View>
//                             <View style={[styles.microCol, { width: '40%', borderRight: 'none' }]}>
//                                 <Text style={styles.label}>Declared Value for Customs</Text>
//                                 <Text style={{ fontSize: 8, textAlign: 'center' }}>{awb.declaredValueCustoms || "NCV"}</Text>
//                             </View>
//                         </View>
//                     </View>

//                     <View style={styles.row}>
//                         <View style={[styles.microCol, { width: '25%' }]}>
//                             <Text style={styles.label}>Airport of Destination</Text>
//                             <Text style={styles.value}>{awb.airportOfDestination || ship.portOfDischarge || "—"}</Text>
//                         </View>
//                         <View style={[styles.microCol, { width: '25%' }]}>
//                             <Text style={styles.label}>Flight/Date</Text>
//                             <Text style={styles.value}>
//                                 {cargo.carrier || ""} {cargo.eta ? new Date(cargo.eta).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase() : "TBA"}
//                             </Text>
//                         </View>
//                         <View style={[styles.microCol, { width: '50%', borderRight: 'none' }]}>
//                             <Text style={styles.label}>Handling Information</Text>
//                             <Text style={styles.value}>{awb.handlingInformation || "—"}</Text>
//                         </View>
//                     </View>

//                     {/* MAIN CARGO GRID */}
//                     <View style={styles.cargoGridHeader}>
//                         <View style={styles.cwPkgs}><Text style={styles.label}>No. of Pieces</Text></View>
//                         <View style={styles.cwGross}><Text style={styles.label}>Gross Weight</Text></View>
//                         <View style={styles.cwKgLb}><Text style={styles.label}>kg/lb</Text></View>
//                         <View style={styles.cwClass}><Text style={styles.label}>Rate Class</Text></View>
//                         <View style={styles.cwChargeable}><Text style={styles.label}>Chargeable Wt</Text></View>
//                         <View style={styles.cwRate}><Text style={styles.label}>Rate / Charge</Text></View>
//                         <View style={styles.cwTotal}><Text style={styles.label}>Total</Text></View>
//                         <View style={styles.cwDesc}>
//                             <Text style={styles.label}>Nature and Quantity of Goods</Text>
//                             <Text style={styles.address}>(incl. Dimensions or Volume)</Text>
//                             </View>
//                     </View>

//                     <View style={styles.cargoGridRow}>
//                         <View style={styles.cwPkgs}><Text>{cargo.totalNoOfPackages || cargo.noOfPackages || "1"}</Text></View>
//                         <View style={styles.cwGross}><Text>{cargo.totalGrossWeight || cargo.grossWeight || "—"}</Text></View>
//                         <View style={styles.cwKgLb}><Text>K</Text></View>
//                         <View style={styles.cwClass}><Text>Q</Text></View>
//                         <View style={styles.cwChargeable}><Text>{chargeableWeight}</Text></View>
//                         <View style={styles.cwRate}><Text>AS AGREED</Text></View>
//                         <View style={styles.cwTotal}><Text>AS AGREED</Text></View>
//                         <View style={styles.cwDesc}>
//                             <View style={{ marginBottom: 5 }}>
//                                 <Text style={[styles.value, { fontWeight: 'bold' }]}>{cargo.commodity || "GENERAL CARGO"}</Text>
//                             </View>
                            
//                             {cargo.items && cargo.items.length > 0 ? (
//                                 cargo.items.map((item: any, i: number) => (
//                                     <View key={i} style={{ marginBottom: 4 }}>
//                                         <Text style={{ fontSize: 7, fontWeight: 'bold' }}>{item.description}</Text>
//                                         {item.hsnCode && <Text style={{ fontSize: 6, color: '#444' }}>HSN: {item.hsnCode}</Text>}
//                                     </View>
//                                 ))
//                             ) : (
//                                 <Text style={styles.value}>{cargo.description || ""}</Text>
//                             )}
                            
//                             <Text style={{ marginTop: 5, fontSize: 7, fontWeight: 'bold' }}>DIMENSIONS: AS PER ATTACHED PL</Text>
//                         </View>
//                     </View>

//                     {/* TOTAL SUMMARY ROW */}
//                     <View style={{ flexDirection: 'row', borderBottom: '1px solid #000', height: 25, alignItems: 'center' }}>
//                         <View style={[styles.cwPkgs, { borderRight: '1px solid #000', height: '100%', justifyContent: 'center' }]}>
//                             <Text style={styles.value}>{cargo.totalNoOfPackages || cargo.noOfPackages || "1"}</Text>
//                         </View>
//                         <View style={[styles.cwGross, { borderRight: '1px solid #000', height: '100%', justifyContent: 'center' }]}>
//                             <Text style={styles.value}>{cargo.totalGrossWeight || cargo.grossWeight || "—"}</Text>
//                         </View>
//                         <View style={{ width: '42%', borderRight: '1px solid #000', height: '100%', justifyContent: 'center', paddingLeft: 10 }}>
//                             <Text style={styles.value}>AS AGREED</Text>
//                         </View>
//                         <View style={{ width: '38%', height: '100%', justifyContent: 'center', paddingLeft: 5 }}>
//                             <Text style={styles.value}>VOL. WT IN KG: {volumetricWeight} KG</Text>
//                         </View>
//                     </View>

//                     {/* FOOTER SIGNATURES */}
//                     <View style={styles.row}>
//                         <View style={[styles.signatureBox, { borderRight: '1px solid #000' }]}>
//                             <Text style={{ fontSize: 6, marginBottom: 15, fontStyle: 'italic' }}>Signature of Shipper or his Agent</Text>
//                             <Text style={{ fontSize: 8 }}>FOR INTERNATIONAL CARGO MOVERS</Text>
//                         </View>
//                         <View style={styles.signatureBox}>
//                             <Text style={{ fontSize: 6, marginBottom: 15, fontStyle: 'italic' }}>Signature of Issuing Carrier or its Agent</Text>
//                             <Text style={{ fontSize: 8 }}>AS AUTHORIZED AGENT</Text>
//                         </View>
//                     </View>

//                 </View>
//             </Page>
//         </Document>
//     );
// }