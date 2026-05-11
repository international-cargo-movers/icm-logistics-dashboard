import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 30, fontFamily: 'Helvetica', fontSize: 8, color: '#000' },
    container: { border: '1px solid #000', display: 'flex', flexDirection: 'column' },
    
    headerRow: { flexDirection: 'row', borderBottom: '1px solid #000' },
    col50: { width: '50%', borderRight: '1px solid #000', padding: 5 },
    col50NoBorder: { width: '50%', padding: 0 },
    
    title: { fontSize: 10, fontWeight: 'bold', textAlign: 'center', padding: 5, borderBottom: '1px solid #000', textTransform: 'uppercase' },
    label: { fontSize: 6, color: '#555', marginBottom: 1, textTransform: 'uppercase' },
    value: { fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
    address: { fontSize: 7, lineHeight: 1.2, marginBottom: 2 },
    
    gridRow: { flexDirection: 'row', borderBottom: '1px solid #000', minHeight: 25 },
    gridCol: { flex: 1, borderRight: '1px solid #000', padding: 3 },
    gridColNoBorder: { flex: 1, padding: 3 },
    
    tableHeader: { flexDirection: 'row', borderBottom: '1px solid #000', backgroundColor: '#f0f0f0', fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', borderBottom: '1px solid #000', minHeight: 20 },
    
    colMarks: { width: '15%', borderRight: '1px solid #000', padding: 3 },
    colDesc: { width: '35%', borderRight: '1px solid #000', padding: 3 },
    colHsn: { width: '10%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    colQty: { width: '10%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    colUnit: { width: '10%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    colRate: { width: '10%', borderRight: '1px solid #000', padding: 3, textAlign: 'right' },
    colAmount: { width: '10%', padding: 3, textAlign: 'right' },
    
    totalRow: { flexDirection: 'row', borderBottom: '1px solid #000', fontWeight: 'bold' },
    
    bankRow: { flexDirection: 'row', padding: 5, minHeight: 60, borderBottom: '1px solid #000' },
    bankCol: { width: '60%', borderRight: '1px solid #000' },
    
    footer: { padding: 5 },
    footerSignatures: { flexDirection: 'row', marginTop: 10, justifyContent: 'flex-end' },
});

export default function CommercialInvoicePDF({ data }: { data: any }) {
    const company = data?.companyDetails || {
        fullName: "INTERNATIONAL CARGO MOVERS",
        address: "193-A BASEMENT ARJUN NAGAR SAFDARJUNG ENCLAVE, NEW DELHI-110029, DELHI, INDIA",
        gstin: "07AAACI1234E1Z5",
        logo: "/ICM_logo.png"
    };
    const exp = data?.exporterDetails || {};
    const con = data?.consigneeDetails || {};
    const buyer = data?.buyerDetails || {};
    const ship = data?.shippingDetails || {};
    const bank = data?.bankDetails || {};
    const lineItems = data?.lineItems || [];
    const fin = data?.financials || {};

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.container}>
                    <Text style={styles.title}>Commercial Invoice</Text>
                    
                    {/* Header Row 1 */}
                    <View style={styles.headerRow}>
                        <View style={styles.col50}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                                <Image src={company.logo} style={{ width: 35, marginRight: 8 }} />
                                <View>
                                    <Text style={styles.label}>Exporter</Text>
                                    <Text style={styles.value}>{company.fullName}</Text>
                                </View>
                            </View>
                            <Text style={styles.address}>{company.address}</Text>
                            <Text style={styles.value}>GST NO.{company.gstin}</Text>
                        </View>
                        <View style={styles.col50NoBorder}>
                            <View style={styles.gridRow}>
                                <View style={styles.gridCol}><Text style={styles.label}>Inv. No.</Text><Text style={styles.value}>{data.billNo}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Date</Text><Text style={styles.value}>{new Date(data.billDate).toLocaleDateString('en-GB')}</Text></View>
                            </View>
                            <View style={[styles.gridRow, { borderBottom: 'none' }]}>
                                <View style={styles.gridCol}><Text style={styles.label}>Exporter Ref.</Text><Text style={styles.value}>{exp.exporterRef || "N/A"}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>IEC NO.</Text><Text style={styles.value}>{exp.iecNo || "0512091251"}</Text></View>
                            </View>
                        </View>
                    </View>

                    {/* Header Row 2 */}
                    <View style={styles.headerRow}>
                        <View style={styles.col50}>
                            <Text style={styles.label}>Consignee</Text>
                            <Text style={styles.value}>{con.name}</Text>
                            <Text style={styles.address}>{con.address}</Text>
                            <Text style={styles.address}>{con.poBox && `PO BOX NO.${con.poBox}`} {con.tel && `TEL : ${con.tel}`}</Text>
                        </View>
                        <View style={styles.col50NoBorder}>
                            <View style={styles.gridRow}>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Buyer's Order No. & Date</Text><Text style={styles.value}>{ship.buyersOrderNo} {ship.buyersOrderDate}</Text></View>
                            </View>
                            <View style={[styles.gridRow, { borderBottom: 'none' }]}>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>AD CODE</Text><Text style={styles.value}>{ship.adCode || "6380006"}</Text></View>
                            </View>
                        </View>
                    </View>

                    {/* Header Row 3 */}
                    <View style={styles.headerRow}>
                        <View style={styles.col50}>
                            <Text style={styles.label}>Buyer (If other than consignee)</Text>
                            <Text style={styles.value}>{buyer.name || "SAME AS CONSIGNEE"}</Text>
                            <Text style={styles.address}>{buyer.address || ""}</Text>
                        </View>
                        <View style={styles.col50NoBorder}>
                            <View style={styles.gridRow}>
                                <View style={styles.gridCol}><Text style={styles.label}>Country of origin of goods</Text><Text style={styles.value}>{ship.countryOfOrigin || "INDIA"}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Country of final destination</Text><Text style={styles.value}>{ship.countryOfDestination}</Text></View>
                            </View>
                        </View>
                    </View>

                    {/* Shipping Details Grid */}
                    <View style={styles.headerRow}>
                        <View style={styles.col50NoBorder}>
                            <View style={styles.gridRow}>
                                <View style={styles.gridCol}><Text style={styles.label}>Pre-Carriage by</Text><Text style={styles.value}>{ship.preCarriageBy}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Place of Receipt</Text><Text style={styles.value}>{ship.placeOfReceipt}</Text></View>
                            </View>
                            <View style={styles.gridRow}>
                                <View style={styles.gridCol}><Text style={styles.label}>Vessel / Flight No.</Text><Text style={styles.value}>{ship.vesselFlightNo}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Port of Loading</Text><Text style={styles.value}>{ship.portOfLoading}</Text></View>
                            </View>
                            <View style={[styles.gridRow, { borderBottom: 'none' }]}>
                                <View style={styles.gridCol}><Text style={styles.label}>Port of Discharge</Text><Text style={styles.value}>{ship.portOfDischarge}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Final Destination</Text><Text style={styles.value}>{ship.finalDestination}</Text></View>
                            </View>
                        </View>
                        <View style={styles.col50NoBorder}>
                            <View style={{ padding: 5 }}>
                                <Text style={styles.label}>Terms of Delivery & payment</Text>
                                <Text style={[styles.value, { marginTop: 10 }]}>{ship.termsOfDeliveryPayment}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Items Table */}
                    <View style={styles.tableHeader}>
                        <Text style={styles.colMarks}>Marks & Numbers</Text>
                        <Text style={styles.colDesc}>Description</Text>
                        <Text style={styles.colHsn}>HSN CODE</Text>
                        <Text style={styles.colQty}>QTY</Text>
                        <Text style={styles.colUnit}>UNIT</Text>
                        <Text style={styles.colRate}>U/PRICE USD</Text>
                        <Text style={styles.colAmount}>AMOUNT USD</Text>
                    </View>

                    <View style={{ minHeight: 200 }}>
                        {lineItems.map((item: any, idx: number) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={styles.colMarks}>{idx === 0 ? ship.marksAndNumbers : ""}</Text>
                                <Text style={styles.colDesc}>{item.description}</Text>
                                <Text style={styles.colHsn}>{item.hsnCode}</Text>
                                <Text style={styles.colQty}>{item.quantity?.toFixed(2)}</Text>
                                <Text style={styles.colUnit}>{item.unit}</Text>
                                <Text style={styles.colRate}>{item.unitPriceUSD?.toFixed(3)}</Text>
                                <Text style={styles.colAmount}>{item.amountUSD?.toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Total USD row */}
                    <View style={styles.totalRow}>
                        <View style={{ width: '90%', textAlign: 'right', padding: 3, borderRight: '1px solid #000' }}>
                            <Text>Total (FOB)</Text>
                        </View>
                        <Text style={[styles.colAmount, { fontWeight: 'bold' }]}>{fin.totalUSD?.toFixed(2)}</Text>
                    </View>

                    {/* Bank Details & Total in Words */}
                    <View style={styles.bankRow}>
                        <View style={styles.bankCol}>
                            <Text style={styles.value}>TOTAL: {fin.amountInWordsUSD}</Text>
                            <View style={{ marginTop: 5 }}>
                                <Text style={styles.label}>OUR BANK DETAILS: {company.fullName}</Text>
                                <Text style={styles.address}>BANK NAME: {bank.bankName}</Text>
                                <Text style={styles.address}>ACCOUNT NO.{bank.accountNo}</Text>
                                <Text style={styles.address}>BRANCH ADRESS :- {bank.branchAddress}</Text>
                                <Text style={styles.address}>SWIFT CODE:- {bank.swiftCode}</Text>
                                <Text style={styles.address}>RTGS/NEFT IFSC:- {bank.ifscCode}</Text>
                            </View>
                        </View>
                        <View style={{ width: '40%', padding: 5 }}>
                            <Text style={styles.label}>Declaration:</Text>
                            <Text style={{ fontSize: 6 }}>We declare that invoice shows the actual price of goods described and that all particulars are true & correct.</Text>
                        </View>
                    </View>

                    {/* Final Signatures */}
                    <View style={styles.footer}>
                        <View style={styles.footerSignatures}>
                            <View style={{ width: '40%', alignItems: 'center' }}>
                                <Text style={styles.label}>For {company.fullName}</Text>
                                <View style={{ height: 30 }} />
                                <Text style={[styles.label, { fontWeight: 'bold' }]}>AUTH.SIGN.</Text>
                            </View>
                        </View>
                    </View>

                </View>
            </Page>
        </Document>
    );
}
