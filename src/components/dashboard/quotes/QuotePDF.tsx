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
  
  box: { border: '1px solid #c6c6cd', padding: 8, borderRadius: 4, marginBottom: 10 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 6, color: '#111c2d', textTransform: 'uppercase' },
  
  // Split grid for Routing & Cargo
  gridBox: { flexDirection: 'row', justifyContent: 'space-between', border: '1px solid #c6c6cd', borderRadius: 4, marginBottom: 10 },
  gridCol: { width: '50%', padding: 8 },
  gridBorderContent: { borderRight: '1px solid #c6c6cd' },
  infoRow: { flexDirection: 'row', marginBottom: 4 },
  infoLabel: { width: '40%', color: '#54647a' },
  infoValue: { width: '60%', fontWeight: 'bold', color: '#111c2d' },

  // Dynamic Quote Banner
  quoteBanner: { backgroundColor: '#fdf04b', padding: 6, textAlign: 'center', border: '1px solid #111c2d', marginBottom: 10, borderRadius: 2 },
  quoteBannerText: { fontSize: 10, fontWeight: 'bold', color: '#111c2d', textTransform: 'uppercase' },

  // Table Styles (Updated to match reference image)
  table: { width: '100%', border: '1px solid #c6c6cd', borderRadius: 4, marginBottom: 5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#add8e6', borderBottom: '1px solid #c6c6cd', padding: 6, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #e6e8ea', padding: 6 },
  colSno: { width: '8%', textAlign: 'center' },
  colDesc: { width: '42%' },
  colAmount: { width: '25%', textAlign: 'center', fontWeight: 'bold' },
  colRemarks: { width: '25%', color: '#54647a', fontSize: 7 },
  
  totalsBox: { alignSelf: 'flex-end', width: '40%', border: '2px solid #111c2d', padding: 8, borderRadius: 4, backgroundColor: '#f8fafc', marginBottom: 10 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  
  // Notes & Disclaimers
  redDisclaimer: { color: '#d32f2f', fontWeight: 'bold', fontStyle: 'italic', fontSize: 9, marginBottom: 4 },
  blackDisclaimer: { fontWeight: 'bold', fontSize: 8, marginBottom: 8 },
  notesContainer: { marginTop: 5, borderTop: '1px solid #c6c6cd', paddingTop: 5 },
  notesHeader: { fontSize: 8, textDecoration: 'underline', marginBottom: 4 },
  noteItem: { flexDirection: 'row', marginBottom: 3 },
  noteNumber: { width: '4%', fontSize: 7 },
  noteText: { width: '96%', fontSize: 7, lineHeight: 1.3 }
});

export default function QuotePDF({ data }: { data: any }) {
  const lineItems = data.lineItems || [];
  const cargo = data.cargoSummary || {};

  // Construct dynamic banner title based on routing data
  const modeText = data.mode ? data.mode.toUpperCase() : "FREIGHT";
  const weightText = cargo.totalGrossWeight ? `${cargo.totalGrossWeight} KG` : "";
  const pol = data.originPort ? data.originPort.toUpperCase() : "ORIGIN";
  const pod = data.destinationPort ? data.destinationPort.toUpperCase() : "DEST";
  const dynamicTitle = `QUOTE FOR ${modeText} ${weightText} - ${pol} - ${pod} (PORT TO PORT)`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>INTERNATIONAL CARGO MOVERS</Text>
            <Text style={styles.companyDetails}>International Forwarders, Consolidators & Shipping Agent</Text>
            <Text style={styles.companyDetails}>{process.env.EMAIL_USER || "quotes@icm.com"}</Text>
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

        {/* ROUTING & CARGO SPECIFICATIONS */}
        <View style={styles.gridBox}>
            <View style={[styles.gridCol, styles.gridBorderContent]}>
                <Text style={styles.sectionTitle}>Routing Details</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mode:</Text>
                    <Text style={styles.infoValue}>{data.mode || "TBD"}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>POL (Origin):</Text>
                    <Text style={styles.infoValue}>{data.originPort} ({data.originCountry})</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>POD (Dest):</Text>
                    <Text style={styles.infoValue}>{data.destinationPort} ({data.destinationCountry})</Text>
                </View>
            </View>
            
            <View style={styles.gridCol}>
                <Text style={styles.sectionTitle}>Cargo Specifications</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Commodity:</Text>
                    <Text style={styles.infoValue}>{cargo.commodity || "General Cargo"}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Equipment:</Text>
                    <Text style={styles.infoValue}>{cargo.equipment || "TBD"}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Pkgs:</Text>
                    <Text style={styles.infoValue}>{cargo.totalNoOfPackages || cargo.items?.reduce((a: any, b: any) => a + (Number(b.noOfPackages) || 0), 0) || 0}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Weight:</Text>
                    <Text style={styles.infoValue}>{cargo.totalGrossWeight || cargo.items?.reduce((a: any, b: any) => a + (Number(b.grossWeight) || 0), 0) || 0} kg</Text>
                </View>
            </View>
        </View>

        {/* CARGO ITEMS TABLE (If multiple items exist) */}
        {cargo.items && cargo.items.length > 0 && (
          <View style={[styles.table, { marginBottom: 10 }]}>
            <View style={[styles.tableHeader, { backgroundColor: '#f0f4f8' }]}>
              <Text style={{ width: '40%', padding: 4 }}>Description</Text>
              <Text style={{ width: '20%', padding: 4, textAlign: 'center' }}>Pkgs</Text>
              <Text style={{ width: '20%', padding: 4, textAlign: 'center' }}>Gross Wt</Text>
              <Text style={{ width: '20%', padding: 4, textAlign: 'center' }}>Vol Wt</Text>
            </View>
            {cargo.items.map((item: any, i: number) => (
              <View key={i} style={styles.tableRow}>
                <Text style={{ width: '40%' }}>{item.description || '-'}</Text>
                <Text style={{ width: '20%', textAlign: 'center' }}>{item.noOfPackages || 0}</Text>
                <Text style={{ width: '20%', textAlign: 'center' }}>{item.grossWeight || 0} kg</Text>
                <Text style={{ width: '20%', textAlign: 'center' }}>{item.volumetricWeight || 0} kg</Text>
              </View>
            ))}
          </View>
        )}

        {/* DYNAMIC YELLOW BANNER */}
        <View style={styles.quoteBanner}>
            <Text style={styles.quoteBannerText}>{dynamicTitle}</Text>
        </View>

        <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' }}>ORIGIN AND FREIGHT CHARGES</Text>

        {/* PROPOSED CHARGES TABLE */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colSno}>S.No.</Text>
            <Text style={styles.colDesc}>Particulars</Text>
            <Text style={styles.colAmount}>Rate</Text>
            <Text style={styles.colRemarks}>Remarks</Text>
          </View>
          
          {lineItems.map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colSno}>{i + 1}</Text>
              <Text style={styles.colDesc}>{item.chargeName}</Text>
              <Text style={styles.colAmount}>{item.currency || "INR"} {Number(item.sellPrice || 0).toLocaleString()}</Text>
              <Text style={styles.colRemarks}>{item.notes || "PER SET"}</Text>
            </View>
          ))}
        </View>

        {/* ESTIMATED TOTAL */}
        <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
                <Text style={{ fontWeight: 'bold', fontSize: 10 }}>ESTIMATED TOTAL</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 10 }}>
                    INR ₹{Number(data.totalSell || 0).toLocaleString()}
                </Text>
            </View>
        </View>

        {/* DISCLAIMERS */}
        <Text style={styles.redDisclaimer}>* The above rates are subject to booking and space confirmation.</Text>
        <Text style={styles.blackDisclaimer}>** Local Transportation at actual</Text>

        {/* DETAILED 12-POINT NOTES */}
        <View style={styles.notesContainer}>
            <Text style={styles.notesHeader}>NOTES:</Text>
            
            <View style={styles.noteItem}>
                <Text style={styles.noteNumber}>1.</Text>
                <Text style={styles.noteText}>Government of India has announced implementation of Goods and Service Tax (GST) @ 18% with effect from 1st July 2017 will be applicable.</Text>
            </View>
            <View style={styles.noteItem}>
                <Text style={styles.noteNumber}>2.</Text>
                <Text style={styles.noteText}>The above charges are subject to Duty/Taxes, Storage, and Demurrage if any will be on consignee account.</Text>
            </View>
            <View style={styles.noteItem}>
                <Text style={styles.noteNumber}>3.</Text>
                <Text style={styles.noteText}>The above charges are without or subject to Insurance/storage/detention if any.</Text>
            </View>
            <View style={styles.noteItem}>
                <Text style={styles.noteNumber}>4.</Text>
                <Text style={styles.noteText}>Quote based on Household/General Non-Hazardous Goods.</Text>
            </View>
            <View style={styles.noteItem}>
                <Text style={styles.noteNumber}>5.</Text>
                <Text style={styles.noteText}>The above rates are without packing and insurance charges.</Text>
            </View>
            <View style={styles.noteItem}>
                <Text style={styles.noteNumber}>6.</Text>
                <Text style={styles.noteText}>Local Transportation and Loading/unloading will be as actual.</Text>
            </View>
            <View style={styles.noteItem}>
                <Text style={styles.noteNumber}>7.</Text>
                <Text style={styles.noteText}>It is the shipper/exporter's responsibility to ensure the cargo has air/sea worthiness packing.</Text>
            </View>
            <View style={styles.noteItem}>
                <Text style={styles.noteNumber}>8.</Text>
                <Text style={styles.noteText}>The above rates are subject to booking confirmation.</Text>
            </View>
            <View style={styles.noteItem}>
                <Text style={styles.noteNumber}>9.</Text>
                <Text style={styles.noteText}>MISC/Incidental Charges if any will be as actual.</Text>
            </View>
            <View style={styles.noteItem}>
                <Text style={styles.noteNumber}>10.</Text>
                <Text style={styles.noteText}>Without Stencil marking on packages bearing Shipper & consignee address, cargo is not allowed to enter terminal for custom clearance.</Text>
            </View>
            <View style={styles.noteItem}>
                <Text style={styles.noteNumber}>11.</Text>
                <Text style={styles.noteText}>Warehouse charges will be applicable.</Text>
            </View>
            <View style={styles.noteItem}>
                <Text style={styles.noteNumber}>12.</Text>
                <Text style={styles.noteText}>Rate Valid till - {data.validUntil || "TBD"}</Text>
            </View>
        </View>

      </Page>
    </Document>
  );
}