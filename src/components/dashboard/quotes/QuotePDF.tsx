import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 8, color: '#191c1e' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '2px solid #111c2d', paddingBottom: 10, marginBottom: 15, alignItems: 'center' },
  logo: { width: 50 },
  companyInfo: { flex: 1, paddingLeft: 10 },
  companyName: { fontSize: 16, fontWeight: 'bold', color: '#111c2d', marginBottom: 4 },
  companyDetails: { fontSize: 7, color: '#54647a', lineHeight: 1.4 },
  titleContainer: { alignItems: 'flex-end' },
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

  // Table Styles
  table: { width: '100%', border: '1px solid #c6c6cd', borderRadius: 4, marginBottom: 5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#add8e6', borderBottom: '1px solid #c6c6cd', padding: 6, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #e6e8ea', padding: 6 },
  colSno: { width: '5%', textAlign: 'center' },
  colDesc: { width: '35%' },
  colQty: { width: '10%', textAlign: 'center' },
  colRate: { width: '20%', textAlign: 'center' },
  colAmount: { width: '15%', textAlign: 'right', fontWeight: 'bold' },
  colRemarks: { width: '15%', color: '#54647a', fontSize: 7, marginLeft: 5 },
  
  totalsBox: { alignSelf: 'flex-end', width: '45%', border: '2px solid #111c2d', padding: 8, borderRadius: 4, backgroundColor: '#f8fafc', marginBottom: 10 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  
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
  const company = data.companyDetails || {
    fullName: "INTERNATIONAL CARGO MOVERS",
    name: "International Cargo Movers",
    address: "193-A BASEMENT ARJUN NAGAR SAFDARJUNG ENCLAVE, NEW DELHI-110029, DELHI, INDIA",
    tagline: "International Forwarders, Consolidators & Shipping Agent",
    email: "accounts@internationalcargo.com",
    logo: "/ICM_logo.png"
  };

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
          <Image src={company.logo} style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.fullName}</Text>
            <Text style={styles.companyDetails}>{company.tagline}</Text>
            <Text style={styles.companyDetails}>{company.address}</Text>
            <Text style={styles.companyDetails}>{company.email}</Text>
          </View>
          <View style={styles.titleContainer}>
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
              <Text style={{ width: '30%', padding: 4 }}>Description</Text>
              <Text style={{ width: '15%', padding: 4, textAlign: 'center' }}>HSN</Text>
              <Text style={{ width: '15%', padding: 4, textAlign: 'center' }}>Pkgs</Text>
              <Text style={{ width: '20%', padding: 4, textAlign: 'center' }}>Gross Wt</Text>
              <Text style={{ width: '20%', padding: 4, textAlign: 'center' }}>Vol Wt</Text>
            </View>
            {cargo.items.map((item: any, i: number) => (
              <View key={i} style={styles.tableRow}>
                <Text style={{ width: '30%' }}>{item.description || '-'}</Text>
                <Text style={{ width: '15%', textAlign: 'center' }}>{item.hsnCode || '-'}</Text>
                <Text style={{ width: '15%', textAlign: 'center' }}>{item.noOfPackages || 0}</Text>
                <Text style={{ width: '20%', textAlign: 'center' }}>{item.grossWeight || 0} kg</Text>
                <Text style={{ width: '20%', textAlign: 'center' }}>{item.volumetricWeight || 0} kg</Text>
              </View>
            ))}
          </View>
        )}

        {/* DYNAMIC BANNER */}
        <View style={styles.quoteBanner}>
            <Text style={styles.quoteBannerText}>{dynamicTitle}</Text>
        </View>

        {/* LINE ITEMS TABLE */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colSno}>S.No</Text>
            <Text style={styles.colDesc}>Particulars</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colRate}>Rate ({data.currency})</Text>
            <Text style={[styles.colAmount, { width: '10%', textAlign: 'center' }]}>GST%</Text>
            <Text style={[styles.colAmount, { width: '15%' }]}>Total ({data.currency})</Text>
            <Text style={styles.colRemarks}>Unit</Text>
          </View>

          {lineItems.map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colSno}>{i + 1}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colRate}>{item.rate?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              <Text style={{ width: '10%', textAlign: 'center' }}>{item.gstPercent || 0}%</Text>
              <Text style={[styles.colAmount, { width: '15%' }]}>{item.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              <Text style={styles.colRemarks}>{item.unit}</Text>
            </View>
          ))}
        </View>

        {/* TOTALS BOX */}
        <View style={styles.totalsBox}>
          <View style={[styles.totalsRow, { marginBottom: 4 }]}>
            <Text style={{ color: '#54647a' }}>Subtotal (Excl. GST)</Text>
            <Text style={{ fontWeight: 'bold' }}>INR {data.subTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={[styles.totalsRow, { marginBottom: 4, borderBottom: '1px solid #c6c6cd', paddingBottom: 4 }]}>
            <Text style={{ color: '#54647a' }}>Total GST Amount</Text>
            <Text style={{ fontWeight: 'bold' }}>INR {data.totalGst?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={[styles.totalsRow, { marginTop: 4 }]}>
            <Text style={{ fontWeight: 'bold', fontSize: 10 }}>ESTIMATED TOTAL</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 11 }}>
              INR {data.netTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* DISCLAIMERS */}
        <Text style={styles.redDisclaimer}>* Rate Subject to GST as Applicable at the time of Invoicing</Text>
        <Text style={styles.blackDisclaimer}>* Subject to Space and Equipment availability at the time of booking.</Text>

        {/* NOTES & TERMS */}
        <View style={styles.notesContainer}>
          <Text style={styles.notesHeader}>Notes & Terms:</Text>
          <View style={styles.noteItem}>
            <Text style={styles.noteNumber}>1.</Text>
            <Text style={styles.noteText}>Above quoted rates are based on the dimensions and weight shared. Any variation will result in a revision of rates.</Text>
          </View>
          <View style={styles.noteItem}>
            <Text style={styles.noteNumber}>2.</Text>
            <Text style={styles.noteText}>Subject to {company.name} Standard Trading Conditions.</Text>
          </View>
          <View style={styles.noteItem}>
            <Text style={styles.noteNumber}>3.</Text>
            <Text style={styles.noteText}>Excludes any storage, detention or unforeseen charges at port/terminal unless specified.</Text>
          </View>
        </View>

        {/* SIGNATURE */}
        <View style={{ marginTop: 20, alignItems: 'flex-end' }}>
            <View style={{ width: '35%', borderBottom: '1px solid #111c2d', marginBottom: 30 }} />
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>For {company.fullName}</Text>
            <Text style={{ fontSize: 7, color: '#54647a' }}>Authorized Signatory</Text>
        </View>

      </Page>
    </Document>
  );
}
