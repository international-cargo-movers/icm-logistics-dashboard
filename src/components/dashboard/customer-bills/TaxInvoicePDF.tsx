import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 30, fontFamily: 'Helvetica', fontSize: 7, color: '#000' },
    container: { border: '1px solid #000', display: 'flex', flexDirection: 'column' },
    
    headerRow: { flexDirection: 'row', borderBottom: '1px solid #000' },
    col50: { width: '50%', borderRight: '1px solid #000', padding: 4 },
    col50NoBorder: { width: '50%', padding: 0 },
    
    title: { fontSize: 9, fontWeight: 'bold', textAlign: 'center', padding: 4, borderBottom: '1px solid #000', textTransform: 'uppercase' },
    label: { fontSize: 5.5, color: '#555', marginBottom: 1, textTransform: 'uppercase' },
    value: { fontSize: 7.5, fontWeight: 'bold', marginBottom: 2 },
    address: { fontSize: 6.5, lineHeight: 1.1, marginBottom: 2 },
    
    gridRow: { flexDirection: 'row', borderBottom: '1px solid #000', minHeight: 20 },
    gridCol: { flex: 1, borderRight: '1px solid #000', padding: 2 },
    gridColNoBorder: { flex: 1, padding: 2 },
    
    tableHeader: { flexDirection: 'row', borderBottom: '1px solid #000', backgroundColor: '#f0f0f0', fontWeight: 'bold', textAlign: 'center' },
    tableRow: { flexDirection: 'row', borderBottom: '1px solid #000', minHeight: 18 },
    
    colMarks: { width: '10%', borderRight: '1px solid #000', padding: 2 },
    colDesc: { width: '25%', borderRight: '1px solid #000', padding: 2 },
    colHsn: { width: '8%', borderRight: '1px solid #000', padding: 2 },
    colQty: { width: '8%', borderRight: '1px solid #000', padding: 2 },
    colRate: { width: '10%', borderRight: '1px solid #000', padding: 2, textAlign: 'right' },
    colTaxable: { width: '12%', borderRight: '1px solid #000', padding: 2, textAlign: 'right' },
    colGstPct: { width: '8%', borderRight: '1px solid #000', padding: 2 },
    colGstAmt: { width: '9%', borderRight: '1px solid #000', padding: 2, textAlign: 'right' },
    colTotal: { width: '10%', padding: 2, textAlign: 'right' },
    
    totalRow: { flexDirection: 'row', borderBottom: '1px solid #000', fontWeight: 'bold' },
    
    footer: { padding: 4 },
    footerSignatures: { flexDirection: 'row', marginTop: 10, justifyContent: 'flex-end' },
});

export default function TaxInvoicePDF({ data }: { data: any }) {
    const exp = data?.exporterDetails || {};
    const con = data?.consigneeDetails || {};
    const ship = data?.shippingDetails || {};
    const lineItems = data?.lineItems || [];
    const fin = data?.financials || {};

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.container}>
                    <Text style={styles.title}>Invoice GST</Text>
                    
                    {/* Header Section (Consolidated for space) */}
                    <View style={styles.headerRow}>
                        <View style={styles.col50}>
                            <Text style={styles.label}>Exporter</Text>
                            <Text style={styles.value}>{exp.name}</Text>
                            <Text style={styles.address}>{exp.address}</Text>
                            <Text style={styles.value}>GST NO.{exp.gstin}</Text>
                            
                            <View style={{ marginTop: 5, borderTop: '1px solid #eee', pt: 2 }}>
                                <Text style={styles.label}>Consignee</Text>
                                <Text style={styles.value}>{con.name}</Text>
                                <Text style={styles.address}>{con.address}</Text>
                                <Text style={styles.address}>{con.tel && `TEL : ${con.tel}`}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.col50NoBorder}>
                            <View style={styles.gridRow}>
                                <View style={styles.gridCol}><Text style={styles.label}>Invoice No.</Text><Text style={styles.value}>{data.billNo}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Date</Text><Text style={styles.value}>{new Date(data.billDate).toLocaleDateString('en-GB')}</Text></View>
                            </View>
                            <View style={styles.gridRow}>
                                <View style={styles.gridCol}><Text style={styles.label}>Exporter Ref.</Text><Text style={styles.value}>{exp.exporterRef || "N/A"}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>IEC NO.</Text><Text style={styles.value}>{exp.iecNo}</Text></View>
                            </View>
                            <View style={styles.gridRow}>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Country of origin of goods</Text><Text style={styles.value}>{ship.countryOfOrigin}</Text></View>
                            </View>
                            <View style={[styles.gridRow, { borderBottom: 'none' }]}>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Country of final destination</Text><Text style={styles.value}>{ship.countryOfDestination}</Text></View>
                            </View>
                        </View>
                    </View>

                    {/* Pre-Carriage Row */}
                    <View style={styles.headerRow}>
                        <View style={styles.gridCol}><Text style={styles.label}>Pre-Carriage by</Text><Text style={styles.value}>{ship.preCarriageBy}</Text></View>
                        <View style={styles.gridCol}><Text style={styles.label}>Place of Receipt</Text><Text style={styles.value}>{ship.placeOfReceipt}</Text></View>
                        <View style={styles.gridCol}><Text style={styles.label}>Vessel / Flight No.</Text><Text style={styles.value}>{ship.vesselFlightNo}</Text></View>
                        <View style={styles.gridColNoBorder}><Text style={styles.label}>Port of Loading</Text><Text style={styles.value}>{ship.portOfLoading}</Text></View>
                    </View>

                    {/* Items Table */}
                    <View style={styles.tableHeader}>
                        <Text style={styles.colMarks}>Marks & Numbers</Text>
                        <Text style={styles.colDesc}>Description of Goods</Text>
                        <Text style={styles.colHsn}>HS CODE</Text>
                        <Text style={styles.colQty}>Quantity</Text>
                        <Text style={styles.colRate}>U/PRICE INR</Text>
                        <Text style={styles.colTaxable}>TOTAL INR</Text>
                        <Text style={styles.colGstPct}>PERCENTAGE</Text>
                        <Text style={styles.colGstAmt}>GST AMT</Text>
                        <Text style={styles.colTotal}>TOTAL INR</Text>
                    </View>

                    {lineItems.map((item: any, idx: number) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={styles.colMarks}>{idx === 0 ? ship.marksAndNumbers : ""}</Text>
                            <Text style={styles.colDesc}>{item.description}</Text>
                            <Text style={styles.colHsn}>{item.hsnCode}</Text>
                            <Text style={styles.colQty}>{item.quantity.toFixed(2)} {item.unit}</Text>
                            <Text style={styles.colRate}>{item.unitPriceINR.toFixed(4)}</Text>
                            <Text style={styles.colTaxable}>{item.taxableAmountINR.toFixed(2)}</Text>
                            <Text style={[styles.colGstPct, { textAlign: 'center' }]}>{item.gstPercentage}%</Text>
                            <Text style={styles.colGstAmt}>{item.gstAmountINR.toFixed(2)}</Text>
                            <Text style={styles.colTotal}>{item.totalAmountINR.toFixed(2)}</Text>
                        </View>
                    ))}

                    {/* Totals Row */}
                    <View style={styles.totalRow}>
                        <View style={{ width: '51%', textAlign: 'right', padding: 3, borderRight: '1px solid #000' }}>
                            <Text>Total</Text>
                        </View>
                        <Text style={[styles.colTaxable, { fontWeight: 'bold' }]}>{fin.totalTaxableINR.toFixed(2)}</Text>
                        <Text style={styles.colGstPct}></Text>
                        <Text style={[styles.colGstAmt, { fontWeight: 'bold' }]}>{fin.totalGstINR.toFixed(2)}</Text>
                        <Text style={[styles.colTotal, { fontWeight: 'bold' }]}>{fin.totalAmountINR.toFixed(2)}</Text>
                    </View>

                    {/* Footer Info */}
                    <View style={styles.footer}>
                        <Text style={[styles.value, { marginTop: 5 }]}>TOTAL AMOUNT: {fin.amountInWordsINR}</Text>
                        
                        <View style={{ flexDirection: 'row', marginTop: 10 }}>
                            <View style={{ width: '60%' }}>
                                <Text style={styles.label}>Declaration:</Text>
                                <Text style={{ fontSize: 6 }}>We declaration that invoice shows the actual price of goods described and that all particularss are true & correct.</Text>
                            </View>
                            <View style={{ width: '40%', alignItems: 'center' }}>
                                <Text style={styles.label}>For {exp.name}</Text>
                                <View style={{ height: 30 }} />
                                <Text style={[styles.label, { fontWeight: 'bold' }]}>AUTH. SIGN.</Text>
                            </View>
                        </View>
                    </View>

                </View>
            </Page>
        </Document>
    );
}
