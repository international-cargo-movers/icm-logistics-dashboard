import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create PDF styles (React-PDF uses a flexbox engine similar to React Native)
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#191c1e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111c2d' },
  metaText: { fontSize: 10, color: '#54647a', marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #c6c6cd', paddingBottom: 4, marginBottom: 8 },
  row: { flexDirection: 'row', borderBottom: '1px solid #e6e8ea', paddingVertical: 6 },
  colDesc: { width: '40%' },
  colSmall: { width: '15%', textAlign: 'center' },
  colAmount: { width: '15%', textAlign: 'right' },
  bold: { fontWeight: 'bold' }
});

// The actual PDF Component
export default function InvoicePDF({ data }: { data: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>TAX INVOICE</Text>
            <Text style={styles.metaText}>Invoice No: {data.invoiceNo}</Text>
            <Text style={styles.metaText}>Date: {data.issueDate}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.bold}>International Cargo Movers</Text>
            <Text style={styles.metaText}>International Forwarders, Consolidators & Shipping Agent</Text>
          </View>
        </View>

        {/* CUSTOMER DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BILL TO</Text>
          <Text style={styles.bold}>{data.customerName}</Text>
          <Text style={styles.metaText}>{data.billingAddress}</Text>
        </View>

        {/* LINE ITEMS TABLE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHARGES</Text>
          
          {/* Table Header */}
          <View style={[styles.row, { backgroundColor: '#f2f4f6', fontWeight: 'bold' }]}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colSmall}>SAC</Text>
            <Text style={styles.colSmall}>Rate</Text>
            <Text style={styles.colSmall}>GST %</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>

          {/* Table Rows */}
          {data.lineItems.map((item: any, i: number) => {
             const amount = (item.rate * item.roe).toFixed(2);
             return (
              <View key={i} style={styles.row}>
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colSmall}>{item.sacCode}</Text>
                <Text style={styles.colSmall}>{item.rate} {item.currency}</Text>
                <Text style={styles.colSmall}>{item.gstPercent}%</Text>
                <Text style={styles.colAmount}>{amount}</Text>
              </View>
             )
          })}
        </View>

      </Page>
    </Document>
  );
}