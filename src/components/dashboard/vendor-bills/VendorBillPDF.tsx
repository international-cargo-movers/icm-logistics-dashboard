import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: '#000' },
    container: { border: '1px solid #000', display: 'flex', flexDirection: 'column' },
    
    headerRow: { flexDirection: 'row', borderBottom: '1px solid #000' },
    col60: { width: '60%', borderRight: '1px solid #000', padding: 5 },
    col40: { width: '40%', padding: 0 },
    
    title: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', padding: 5, borderBottom: '1px solid #000' },
    label: { fontSize: 7, color: '#555', marginBottom: 2 },
    value: { fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
    address: { fontSize: 8, lineHeight: 1.2, marginBottom: 4 },
    
    gridRow: { flexDirection: 'row', borderBottom: '1px solid #000', minHeight: 25 },
    gridCol: { flex: 1, borderRight: '1px solid #000', padding: 3 },
    gridColNoBorder: { flex: 1, padding: 3 },
    
    tableHeader: { flexDirection: 'row', borderBottom: '1px solid #000', backgroundColor: '#f0f0f0', fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', borderBottom: '1px solid #000', minHeight: 20 },
    
    colSl: { width: '5%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    colDesc: { width: '35%', borderRight: '1px solid #000', padding: 3 },
    colHsn: { width: '10%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    colGst: { width: '8%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    colQty: { width: '12%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    colRate: { width: '10%', borderRight: '1px solid #000', padding: 3, textAlign: 'right' },
    colPer: { width: '8%', borderRight: '1px solid #000', padding: 3, textAlign: 'center' },
    colAmount: { width: '12%', padding: 3, textAlign: 'right' },
    
    totalRow: { flexDirection: 'row', borderBottom: '1px solid #000', fontWeight: 'bold' },
    
    summaryRow: { flexDirection: 'row', borderBottom: '1px solid #000' },
    summaryColLeft: { width: '60%', borderRight: '1px solid #000', padding: 5 },
    summaryColRight: { width: '40%', padding: 5 },
    
    taxTable: { marginTop: 10, border: '1px solid #000' },
    taxHeader: { flexDirection: 'row', borderBottom: '1px solid #000', backgroundColor: '#f0f0f0' },
    taxRow: { flexDirection: 'row', borderBottom: '1px solid #000' },
    taxCol: { flex: 1, borderRight: '1px solid #000', padding: 3, textAlign: 'right' },
    taxColNoBorder: { flex: 1, padding: 3, textAlign: 'right' },
    
    footer: { padding: 5 },
    footerSignatures: { flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' },
    sigBox: { width: '30%', borderTop: '1px solid #000', textAlign: 'center', paddingTop: 5, fontSize: 8 }
});

export default function VendorBillPDF({ data }: { data: any }) {
    const seller = data?.sellerDetails || {};
    const consignee = data?.consigneeDetails || {};
    const buyer = data?.buyerDetails || {};
    const ship = data?.shippingDetails || {};
    const lineItems = data?.lineItems || [];
    const totals = data?.totals || {};

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.container}>
                    <Text style={styles.title}>Tax Invoice</Text>
                    
                    {/* Header Row 1 */}
                    <View style={styles.headerRow}>
                        <View style={styles.col60}>
                            <Text style={styles.value}>{seller.name || "Seller Name"}</Text>
                            <Text style={styles.address}>{seller.address || "Seller Address"}</Text>
                            <Text style={styles.address}>GSTIN/UIN: {seller.gstin}</Text>
                            <Text style={styles.address}>State Name: {seller.stateName}, Code: {seller.stateCode}</Text>
                            <Text style={styles.address}>E-Mail: {seller.email}</Text>
                        </View>
                        <View style={styles.col40}>
                            <View style={styles.gridRow}>
                                <View style={styles.gridCol}><Text style={styles.label}>Invoice No.</Text><Text style={styles.value}>{data.billNo}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Dated</Text><Text style={styles.value}>{new Date(data.billDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</Text></View>
                            </View>
                            <View style={styles.gridRow}>
                                <View style={styles.gridCol}><Text style={styles.label}>Delivery Note</Text><Text style={styles.value}>{ship.deliveryNote || "N/A"}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Mode/Terms of Payment</Text><Text style={styles.value}>{ship.modeTermsOfPayment || "N/A"}</Text></View>
                            </View>
                            <View style={styles.gridRow}>
                                <View style={styles.gridCol}><Text style={styles.label}>{"Reference No. & Date."}</Text><Text style={styles.value}>{ship.referenceNoAndDate || "N/A"}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Other References</Text><Text style={styles.value}>{ship.otherReferences || "N/A"}</Text></View>
                            </View>
                        </View>
                    </View>

                    {/* Header Row 2 */}
                    <View style={styles.headerRow}>
                        <View style={styles.col60}>
                            <Text style={styles.label}>Consignee (Ship to)</Text>
                            <Text style={styles.value}>{consignee.name || "Consignee Name"}</Text>
                            <Text style={styles.address}>{consignee.address || "Consignee Address"}</Text>
                            <Text style={styles.address}>GSTIN/UIN: {consignee.gstin}</Text>
                            <Text style={styles.address}>State Name: {consignee.stateName}, Code: {consignee.stateCode}</Text>
                        </View>
                        <View style={styles.col40}>
                            <View style={styles.gridRow}>
                                <View style={styles.gridCol}><Text style={styles.label}>{"Buyer's Order No."}</Text><Text style={styles.value}>{ship.buyersOrderNo || "N/A"}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Dated</Text><Text style={styles.value}>{ship.buyersOrderDated || "N/A"}</Text></View>
                            </View>
                            <View style={styles.gridRow}>
                                <View style={styles.gridCol}><Text style={styles.label}>Dispatch Doc No.</Text><Text style={styles.value}>{ship.dispatchDocNo || "N/A"}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Delivery Note Date</Text><Text style={styles.value}>{ship.deliveryNoteDate || "N/A"}</Text></View>
                            </View>
                            <View style={styles.gridRow}>
                                <View style={styles.gridCol}><Text style={styles.label}>Dispatched through</Text><Text style={styles.value}>{ship.dispatchedThrough || "N/A"}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Destination</Text><Text style={styles.value}>{ship.destination || "N/A"}</Text></View>
                            </View>
                        </View>
                    </View>

                    {/* Header Row 3 */}
                    <View style={styles.headerRow}>
                        <View style={styles.col60}>
                            <Text style={styles.label}>Buyer (Bill to)</Text>
                            <Text style={styles.value}>{buyer.name || "Buyer Name"}</Text>
                            <Text style={styles.address}>{buyer.address || "Buyer Address"}</Text>
                            <Text style={styles.address}>GSTIN/UIN: {buyer.gstin}</Text>
                            <Text style={styles.address}>State Name: {buyer.stateName}, Code: {buyer.stateCode}</Text>
                            <Text style={styles.address}>Place of Supply: {buyer.placeOfSupply}</Text>
                        </View>
                        <View style={styles.col40}>
                            <View style={styles.gridRow}>
                                <View style={styles.gridCol}><Text style={styles.label}>Vessel/Flight No.</Text><Text style={styles.value}>{ship.vesselFlightNo || "N/A"}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Place of receipt by shipper</Text><Text style={styles.value}>{ship.placeOfReceiptByShipper || "N/A"}</Text></View>
                            </View>
                            <View style={styles.gridRow}>
                                <View style={styles.gridCol}><Text style={styles.label}>City/Port of Loading</Text><Text style={styles.value}>{ship.portOfLoading || "N/A"}</Text></View>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>City/Port of Discharge</Text><Text style={styles.value}>{ship.portOfDischarge || "N/A"}</Text></View>
                            </View>
                            <View style={[styles.gridRow, { borderBottom: 'none' }]}>
                                <View style={styles.gridColNoBorder}><Text style={styles.label}>Terms of Delivery</Text><Text style={styles.value}>{ship.termsOfDelivery || "N/A"}</Text></View>
                            </View>
                        </View>
                    </View>

                    {/* Items Table */}
                    <View style={styles.tableHeader}>
                        <Text style={styles.colSl}>Sl No</Text>
                        <Text style={styles.colDesc}>Description of Goods</Text>
                        <Text style={styles.colHsn}>HSN/SAC</Text>
                        <Text style={styles.colGst}>GST Rate</Text>
                        <Text style={styles.colQty}>Quantity</Text>
                        <Text style={styles.colRate}>Rate</Text>
                        <Text style={styles.colPer}>per</Text>
                        <Text style={styles.colAmount}>Amount</Text>
                    </View>

                    {lineItems.map((item: any, idx: number) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={styles.colSl}>{idx + 1}</Text>
                            <View style={styles.colDesc}>
                                <Text style={styles.value}>{item.description}</Text>
                                {item.cgstAmount > 0 && <Text style={{ fontSize: 7, marginLeft: 10, marginTop: 5 }}>CGST</Text>}
                                {item.sgstAmount > 0 && <Text style={{ fontSize: 7, marginLeft: 10 }}>SGST</Text>}
                                {item.igstAmount > 0 && <Text style={{ fontSize: 7, marginLeft: 10, marginTop: 5 }}>IGST</Text>}
                            </View>
                            <Text style={styles.colHsn}>{item.hsnSac}</Text>
                            <Text style={styles.colGst}>{item.gstPercent}%</Text>
                            <View style={styles.colQty}>
                                <Text style={{ fontSize: 7 }}>Shipped: {item.quantityShipped} {item.unit}</Text>
                                <Text style={{ fontWeight: 'bold' }}>Billed: {item.quantityBilled} {item.unit}</Text>
                            </View>
                            <Text style={styles.colRate}>{item.rate.toFixed(2)}</Text>
                            <Text style={styles.colPer}>{item.unit}</Text>
                            <View style={styles.colAmount}>
                                <Text style={styles.value}>{item.amount.toFixed(2)}</Text>
                                {item.cgstAmount > 0 && <Text style={{ fontSize: 7, marginTop: 5 }}>{item.cgstAmount.toFixed(2)}</Text>}
                                {item.sgstAmount > 0 && <Text style={{ fontSize: 7 }}>{item.sgstAmount.toFixed(2)}</Text>}
                                {item.igstAmount > 0 && <Text style={{ fontSize: 7, marginTop: 5 }}>{item.igstAmount.toFixed(2)}</Text>}
                            </View>
                        </View>
                    ))}

                    {/* Table Totals */}
                    <View style={styles.totalRow}>
                        <Text style={{ width: '58%', textAlign: 'right', padding: 3 }}>Total</Text>
                        <Text style={styles.colQty}>{lineItems.reduce((acc: any, curr: any) => acc + curr.quantityBilled, 0)} {lineItems[0]?.unit}</Text>
                        <Text style={{ width: '18%' }}></Text>
                        <Text style={styles.colAmount}>{totals.netAmount?.toFixed(2)}</Text>
                    </View>

                    {/* Summary Section */}
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryColLeft}>
                            <Text style={styles.label}>Amount Chargeable (in words)</Text>
                            <Text style={styles.value}>INR {totals.amountInWords || "N/A"}</Text>
                            
                            {/* Tax Table */}
                            <View style={styles.taxTable}>
                                <View style={styles.taxHeader}>
                                    <Text style={[styles.taxCol, { textAlign: 'center' }]}>HSN/SAC</Text>
                                    <Text style={styles.taxCol}>Taxable Value</Text>
                                    <Text style={styles.taxCol}>CGST</Text>
                                    <Text style={styles.taxCol}>SGST</Text>
                                    <Text style={styles.taxColNoBorder}>Total Tax</Text>
                                </View>
                                {lineItems.map((item: any, idx: number) => (
                                    <View key={idx} style={styles.taxRow}>
                                        <Text style={[styles.taxCol, { textAlign: 'center' }]}>{item.hsnSac}</Text>
                                        <Text style={styles.taxCol}>{item.amount.toFixed(2)}</Text>
                                        <Text style={styles.taxCol}>{(item.cgstAmount || 0).toFixed(2)}</Text>
                                        <Text style={styles.taxCol}>{(item.sgstAmount || 0).toFixed(2)}</Text>
                                        <Text style={styles.taxColNoBorder}>{(item.cgstAmount + item.sgstAmount + (item.igstAmount || 0)).toFixed(2)}</Text>
                                    </View>
                                ))}
                            </View>
                            <Text style={[styles.label, { marginTop: 5 }]}>Tax Amount (in words): INR {totals.taxAmountInWords || "N/A"}</Text>
                        </View>
                        <View style={styles.summaryColRight}>
                            <Text style={{ fontSize: 7, fontStyle: 'italic', textAlign: 'right' }}>E. & O.E.</Text>
                            <View style={{ marginTop: 10 }}>
                                <Text style={styles.label}>Declaration</Text>
                                <Text style={{ fontSize: 7 }}>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer / Signatures */}
                    <View style={styles.footer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', minHeight: 60 }}>
                            <View style={{ width: '40%' }}>
                                <Text style={styles.label}>Customer's Seal and Signature</Text>
                            </View>
                            <View style={{ width: '40%', alignItems: 'flex-end' }}>
                                <Text style={[styles.label, { textAlign: 'right' }]}>for {seller.name || "Seller Name"}</Text>
                                <View style={{ height: 30 }} />
                                <Text style={styles.label}>Authorised Signatory</Text>
                            </View>
                        </View>
                        <View style={styles.footerSignatures}>
                            <Text style={styles.sigBox}>Prepared by</Text>
                            <Text style={styles.sigBox}>Verified by</Text>
                            <Text style={styles.sigBox}>Authorised Signatory</Text>
                        </View>
                    </View>

                </View>
            </Page>
        </Document>
    );
}
