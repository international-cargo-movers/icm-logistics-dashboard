import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 8, color: '#191c1e' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '2px solid #111c2d', paddingBottom: 10, marginBottom: 15 },
  companyName: { fontSize: 16, fontWeight: 'bold', color: '#111c2d', marginBottom: 4 },
  companyDetails: { fontSize: 7, color: '#54647a', lineHeight: 1.4 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111c2d', textAlign: 'right', marginBottom: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 3 },
  metaLabel: { width: 60, textAlign: 'right', color: '#54647a', marginRight: 5 },
  metaValue: { width: 80, fontWeight: 'bold', textAlign: 'right' },
  
  box: { border: '1px solid #c6c6cd', padding: 8, borderRadius: 4, marginBottom: 15 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 6, color: '#111c2d', textTransform: 'uppercase' },
  
  // NEW: Split grid for Routing & Cargo
  gridBox: { flexDirection: 'row', justifyContent: 'space-between', border: '1px solid #c6c6cd', borderRadius: 4, marginBottom: 15 },
  gridCol: { width: '50%', padding: 8 },
  gridBorderContent: { borderRight: '1px solid #c6c6cd' },
  infoRow: { flexDirection: 'row', marginBottom: 4 },
  infoLabel: { width: '40%', color: '#54647a' },
  infoValue: { width: '60%', fontWeight: 'bold', color: '#111c2d' },

  // Table Styles
  table: { width: '100%', border: '1px solid #c6c6cd', borderRadius: 4, marginBottom: 15 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f2f4f6', borderBottom: '1px solid #c6c6cd', padding: 6, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #e6e8ea', padding: 6 },
  colDesc: { width: '50%' },
  colType: { width: '25%', color: '#54647a' },
  colAmount: { width: '25%', textAlign: 'right', fontWeight: 'bold' },
  
  totalsBox: { alignSelf: 'flex-end', width: '40%', border: '2px solid #111c2d', padding: 8, borderRadius: 4, backgroundColor: '#f8fafc' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  terms: { fontSize: 7, color: '#54647a', marginTop: 20, lineHeight: 1.4 }
});

export default function QuotePDF({ data }: { data: any }) {
  // Defensive checks to ensure data exists before rendering
  const lineItems = data.lineItems || [];
  const cargo = data.cargoSummary || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>ARCHITECT LOGISTICIAN</Text>
            <Text style={styles.companyDetails}>Global Command Center</Text>
            <Text style={styles.companyDetails}>quotes@architectlogistician.com</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>OFFICIAL QUOTATION</Text>
            <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Quote Ref:</Text>
                <Text style={styles.metaValue}>{data.quoteRef || "DRAFT"}</Text>
            </View>
            <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date:</Text>
                <Text style={styles.metaValue}>{data.date || new Date().toLocaleDateString()}</Text>
            </View>
            <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Valid Until:</Text>
                <Text style={styles.metaValue}>{data.validUntil || "TBD"}</Text>
            </View>
          </View>
        </View>

        {/* CUSTOMER INFO */}
        <View style={styles.box}>
          <Text style={styles.sectionTitle}>Prepared For</Text>
          <Text style={{ fontWeight: 'bold', marginBottom: 2, fontSize: 10 }}>{data.customerName || "Valued Client"}</Text>
          <Text style={{ color: '#54647a' }}>{data.customerEmail}</Text>
        </View>

        {/* NEW: ROUTING & CARGO SPECIFICATIONS */}
        <View style={styles.gridBox}>
            {/* Left Column: Routing */}
            <View style={[styles.gridCol, styles.gridBorderContent]}>
                <Text style={styles.sectionTitle}>Routing Details</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mode:</Text>
                    <Text style={styles.infoValue}>{data.mode || "TBD"}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Origin:</Text>
                    <Text style={styles.infoValue}>{data.originPort} ({data.originCountry})</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Destination:</Text>
                    <Text style={styles.infoValue}>{data.destinationPort} ({data.destinationCountry})</Text>
                </View>
            </View>
            
            {/* Right Column: Cargo */}
            <View style={styles.gridCol}>
                <Text style={styles.sectionTitle}>Cargo Specifications</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Commodity:</Text>
                    <Text style={styles.infoValue}>{cargo.commodity || "General Cargo"}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Volume/Eq:</Text>
                    <Text style={styles.infoValue}>{cargo.equipment || "TBD"}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Est. Weight:</Text>
                    <Text style={styles.infoValue}>{cargo.estimatedWeight || "TBD"}</Text>
                </View>
            </View>
        </View>

        {/* PROPOSED CHARGES TABLE */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Service Description</Text>
            <Text style={styles.colType}>Charge Category</Text>
            <Text style={styles.colAmount}>Total Amount</Text>
          </View>
          
          {/* THE BUG FIX: Mapping to chargeName and sellPrice */}
          {lineItems.map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.chargeName}</Text>
              <Text style={styles.colType}>{item.chargeType || "Freight"}</Text>
              <Text style={styles.colAmount}>{item.currency || "USD"} {Number(item.sellPrice || 0).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* ESTIMATED TOTAL */}
        <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
                <Text style={{ fontWeight: 'bold', fontSize: 10 }}>ESTIMATED TOTAL</Text>
                {/* THE BUG FIX: Using data.totalSell */}
                <Text style={{ fontWeight: 'bold', fontSize: 10 }}>
                    USD ${Number(data.totalSell || 0).toLocaleString()}
                </Text>
            </View>
        </View>

        <Text style={styles.terms}>
          * Terms & Conditions: This quotation is an estimate based on current market rates. Final charges may fluctuate based on actual gross weight, carrier capacity, and ROE at the time of official booking. Standard transit times are subject to weather and port congestion.
        </Text>
      </Page>
    </Document>
  );
}