import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 8, color: '#000000' },
  
  // The Master Outer Box
  outerBorder: { border: '1px solid #000', flexGrow: 1, display: 'flex', flexDirection: 'column' },
  
  // Text Styles
  headerTitle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #000', padding: 4 },
  companyName: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 4 },
  companyAddress: { fontSize: 8, textAlign: 'center', lineHeight: 1.3 },
  boldText: { fontWeight: 'bold' },
  
  // Grid System
  rowBorderBottom: { borderBottom: '1px solid #000', display: 'flex', flexDirection: 'row' },
  colBorderRight: { borderRight: '1px solid #000', padding: 4 },
  colNoBorder: { padding: 4 },

  // Splits
  halfWidth: { width: '50%' },
  metaLabel: { width: '45%', fontWeight: 'bold' },
  metaValue: { width: '55%' },
  flexRow: { flexDirection: 'row', marginBottom: 2 },

  // Table Structure
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #000', backgroundColor: '#f0f0f0', fontWeight: 'bold' },
  tableRow: { flexDirection: 'row' }, // Borders handled individually
  
  // Columns
  wSno: { width: '4%', borderRight: '1px solid #000', textAlign: 'center', padding: 3 },
  wDesc: { width: '24%', borderRight: '1px solid #000', padding: 3 },
  wSac: { width: '8%', borderRight: '1px solid #000', textAlign: 'center', padding: 3 },
  wUnit: { width: '4%', borderRight: '1px solid #000', textAlign: 'center', padding: 3 },
  wRate: { width: '10%', borderRight: '1px solid #000', textAlign: 'right', padding: 3 },
  wCurr: { width: '5%', borderRight: '1px solid #000', textAlign: 'center', padding: 3 },
  wRoe: { width: '9%', borderRight: '1px solid #000', textAlign: 'right', padding: 3 },
  wGstP: { width: '5%', borderRight: '1px solid #000', textAlign: 'center', padding: 3 },
  wTaxable: { width: '15%', borderRight: '1px solid #000', textAlign: 'right', padding: 3 },
  wGstAmt: { width: '16%', textAlign: 'right', padding: 3 },

  // HSN Summary Table
  wHsnSac: { width: '20%', borderRight: '1px solid #000', padding: 3 },
  wHsnTaxable: { width: '20%', borderRight: '1px solid #000', textAlign: 'right', padding: 3 },
  wHsnCgstRate: { width: '10%', borderRight: '1px solid #000', textAlign: 'center', padding: 3 },
  wHsnCgstAmt: { width: '15%', borderRight: '1px solid #000', textAlign: 'right', padding: 3 },
  wHsnSgstRate: { width: '10%', borderRight: '1px solid #000', textAlign: 'center', padding: 3 },
  wHsnSgstAmt: { width: '15%', borderRight: '1px solid #000', textAlign: 'right', padding: 3 },
  wHsnTotal: { width: '10%', textAlign: 'right', padding: 3 },

  footerBox: { padding: 4, minHeight: 60 }
});

export default function InvoicePDF({ data }: { data: any }) {
  const lineItems = data.lineItems || [];
  const snapshot = data.shipmentSnapshot || {};
  const cust = data.customerDetails || {};

  // Group items by SAC for the HSN summary table at the bottom
  const hsnSummaryMap = lineItems.reduce((acc: any, item: any) => {
    const sac = item.sacCode || "996511";
    if (!acc[sac]) {
      acc[sac] = { sac, taxable: 0, gstAmt: 0, rate: item.gstPercent };
    }
    acc[sac].taxable += item.taxableValue;
    acc[sac].gstAmt += item.gstAmount;
    return acc;
  }, {});
  const hsnSummaryArray = Object.values(hsnSummaryMap);
  console.log("Invoice PDF job reference: ",data.jobReference);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.outerBorder}>
          
          {/* HEADER TITLE */}
          <Text style={styles.headerTitle}>Tax Invoice</Text>

          {/* COMPANY HEADER */}
          <View style={[styles.rowBorderBottom, { padding: 8, justifyContent: 'center' }]}>
            <View style={{ width: '100%' }}>
              <Text style={styles.companyName}>INTERNATIONAL CARGO MOVERS</Text>
              <Text style={styles.companyAddress}>123 GLOBAL LOGISTICS PARK, NEW DELHI 110037</Text>
              <Text style={styles.companyAddress}><Text style={styles.boldText}>GSTIN/UIN:</Text> 07AAACI1234E1Z5</Text>
              <Text style={styles.companyAddress}><Text style={styles.boldText}>State Name:</Text> Delhi, Code: 07</Text>
              <Text style={styles.companyAddress}><Text style={styles.boldText}>E-Mail:</Text> accounts@internationalcargo.com</Text>
            </View>
          </View>

          {/* BILL TO & INVOICE META */}
          <View style={styles.rowBorderBottom}>
            {/* Left: Recipient */}
            <View style={[styles.colBorderRight, styles.halfWidth]}>
              <Text style={styles.boldText}>Recipient / Bill To:</Text>
              <Text style={[styles.boldText, { fontSize: 9, marginTop: 4 }]}>{cust.name?.toUpperCase()}</Text>
              <Text style={{ marginTop: 2 }}>{cust.billingAddress}</Text>
              <Text style={{ marginTop: 4 }}><Text style={styles.boldText}>GSTIN/UIN:</Text> {cust.gstin || "URD"}</Text>
              <Text><Text style={styles.boldText}>State Name & Code:</Text> {cust.stateCode || "07"}</Text>
            </View>

            {/* Right: Invoice Meta */}
            <View style={[styles.colNoBorder, styles.halfWidth]}>
              <View style={styles.flexRow}><Text style={styles.metaLabel}>Tax Invoice No:</Text><Text style={[styles.metaValue, styles.boldText]}>{data.invoiceNo}</Text></View>
              <View style={styles.flexRow}><Text style={styles.metaLabel}>Invoice Date:</Text><Text style={styles.metaValue}>{new Date(data.invoiceDate).toLocaleDateString()}</Text></View>
              <View style={styles.flexRow}><Text style={styles.metaLabel}>Job No:</Text><Text style={styles.metaValue}>{data.jobReference}</Text></View>
              <View style={styles.flexRow}><Text style={styles.metaLabel}>OBL / MAWB No:</Text><Text style={styles.metaValue}>{snapshot.oblMawb || "—"}</Text></View>
              <View style={styles.flexRow}><Text style={styles.metaLabel}>HBL / HAWB No:</Text><Text style={styles.metaValue}>{snapshot.hblHawb || "—"}</Text></View>
            </View>
          </View>

          {/* SHIPMENT PARTICULARS (3 Column Grid) */}
          <View style={styles.rowBorderBottom}>
            <View style={[styles.colBorderRight, { width: '40%' }]}>
              <Text style={{ fontWeight: 'bold', marginBottom: 2, fontSize: 7 }}>Cargo Description & Details:</Text>
              {snapshot.items && snapshot.items.length > 0 ? (
                snapshot.items.map((item: any, i: number) => (
                  <View key={i} style={{ marginBottom: 3 }}>
                    <Text style={{ fontWeight: 'bold' }}>{item.description}</Text>
                    <Text style={{ fontSize: 6.5, color: '#333' }}>
                      {item.noOfPackages} {item.packageUnit} | GW: {item.grossWeight} KGS | {item.dimensions || ""}
                    </Text>
                  </View>
                ))
              ) : (
                <Text>{snapshot.commodity || "General Cargo"}</Text>
              )}
            </View>
            <View style={[styles.colBorderRight, { width: '30%' }]}>
              <View style={styles.flexRow}><Text style={{ width: '50%' }}>Total Pkgs:</Text><Text style={{ width: '50%' }}>{snapshot.noOfPackages || "—"}</Text></View>
              <View style={styles.flexRow}><Text style={{ width: '50%' }}>Total GW:</Text><Text style={{ width: '50%' }}>{snapshot.grossWeight || "—"} KGS</Text></View>
              <View style={styles.flexRow}><Text style={{ width: '50%' }}>Total VW:</Text><Text style={{ width: '50%' }}>{snapshot.volumetricWeight || "—"} CBM</Text></View>
              <View style={styles.flexRow}><Text style={{ width: '50%' }}>Ch. Wt:</Text><Text style={{ width: '50%' }}>{snapshot.chargeableWeight || "—"} KGS</Text></View>
              <View style={styles.flexRow}><Text style={{ width: '50%' }}>Cont. No:</Text><Text style={{ width: '50%', fontSize: 7 }}>{snapshot.containerNo || "—"}</Text></View>
            </View>
            <View style={[styles.colNoBorder, { width: '30%' }]}>
              <View style={styles.flexRow}><Text style={{ width: '50%' }}>Origin:</Text><Text style={{ width: '50%' }}>{snapshot.origin || "—"}</Text></View>
              <View style={styles.flexRow}><Text style={{ width: '50%' }}>Destination:</Text><Text style={{ width: '50%' }}>{snapshot.destination || "—"}</Text></View>
              <View style={styles.flexRow}><Text style={{ width: '50%' }}>Vessel/Flt:</Text><Text style={{ width: '50%' }}>{snapshot.vesselFlight || "—"}</Text></View>
              <View style={styles.flexRow}><Text style={{ width: '50%' }}>SB No:</Text><Text style={{ width: '50%' }}>{snapshot.sbNo || "—"}</Text></View>
            </View>
          </View>

          {/* MAIN ITEM TABLE */}
          <View style={{ minHeight: 250 }}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.wSno}>S.No</Text>
              <Text style={styles.wDesc}>Charges Description</Text>
              <Text style={styles.wSac}>SAC</Text>
              <Text style={styles.wUnit}>Unit</Text>
              <Text style={styles.wRate}>Rate</Text>
              <Text style={styles.wCurr}>Curr</Text>
              <Text style={styles.wRoe}>ROE</Text>
              <Text style={styles.wGstP}>GST%</Text>
              <Text style={styles.wTaxable}>Taxable (INR)</Text>
              <Text style={styles.wGstAmt}>GST Amt (INR)</Text>
            </View>

            {/* Rows */}
            {lineItems.map((item: any, i: number) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.wSno}>{i + 1}</Text>
                <Text style={styles.wDesc}>{item.description}</Text>
                <Text style={styles.wSac}>{item.sacCode}</Text>
                <Text style={styles.wUnit}>1</Text>
                <Text style={styles.wRate}>{item.rate?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                <Text style={styles.wCurr}>{item.currency}</Text>
                <Text style={styles.wRoe}>{item.roe}</Text>
                <Text style={styles.wGstP}>{item.gstPercent}%</Text>
                <Text style={styles.wTaxable}>{item.taxableValue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                <Text style={styles.wGstAmt}>{item.gstAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </View>
            ))}
          </View>

          {/* SUBTOTAL ROW */}
          <View style={[styles.rowBorderBottom, { borderTop: '1px solid #000' }]}>
            <Text style={[{ width: '69%', textAlign: 'right', padding: 3 }, styles.boldText]}>TOTAL</Text>
            <Text style={[{ width: '15%', borderLeft: '1px solid #000', borderRight: '1px solid #000', textAlign: 'right', padding: 3 }, styles.boldText]}>
              {data.totals?.totalTaxable?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
            <Text style={[{ width: '16%', textAlign: 'right', padding: 3 }, styles.boldText]}>
              {data.totals?.totalGst?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {/* HSN / SAC SUMMARY BLOCK */}
          <View style={styles.rowBorderBottom}>
            {/* Left Box (HSN Calculation) */}
            <View style={{ width: '69%', borderRight: '1px solid #000' }}>
              <View style={styles.tableHeader}>
                <Text style={styles.wHsnSac}>HSN/SAC</Text>
                <Text style={styles.wHsnTaxable}>Taxable Value</Text>
                <Text style={styles.wHsnCgstRate}>CGST%</Text>
                <Text style={styles.wHsnCgstAmt}>CGST Amt</Text>
                <Text style={styles.wHsnSgstRate}>SGST%</Text>
                <Text style={styles.wHsnSgstAmt}>SGST Amt</Text>
              </View>
              {hsnSummaryArray.map((row: any, i: number) => {
                const halfRate = row.rate / 2;
                const halfAmt = row.gstAmt / 2;
                return (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.wHsnSac}>{row.sac}</Text>
                    <Text style={styles.wHsnTaxable}>{row.taxable?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                    <Text style={styles.wHsnCgstRate}>{halfRate}%</Text>
                    <Text style={styles.wHsnCgstAmt}>{halfAmt?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                    <Text style={styles.wHsnSgstRate}>{halfRate}%</Text>
                    <Text style={styles.wHsnSgstAmt}>{halfAmt?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                  </View>
                );
              })}
            </View>

            {/* Right Box (Final Totals) */}
            <View style={{ width: '31%', padding: 4 }}>
              <View style={[styles.flexRow, { justifyContent: 'space-between', marginBottom: 6 }]}>
                <Text style={styles.boldText}>Total Amount (INR):</Text>
                <Text style={styles.boldText}>{data.totals?.totalTaxable?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={[styles.flexRow, { justifyContent: 'space-between', marginBottom: 6 }]}>
                <Text style={styles.boldText}>GST Amount:</Text>
                <Text style={styles.boldText}>{data.totals?.totalGst?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={[styles.flexRow, { justifyContent: 'space-between', marginBottom: 6 }]}>
                <Text>RoundOff Amount:</Text>
                <Text>0.00</Text>
              </View>
            </View>
          </View>

          {/* NET AMOUNT & WORDS */}
          <View style={[styles.rowBorderBottom, { padding: 4, backgroundColor: '#f0f0f0' }]}>
            <Text style={{ width: '70%' }}><Text style={styles.boldText}>Amount in Words:</Text> {data.totals?.amountInWords}</Text>
            <Text style={[{ width: '30%', textAlign: 'right', fontSize: 10 }, styles.boldText]}>Net Amount: INR{data.totals?.netAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>

          {/* BANK DETAILS */}
          <View style={[styles.rowBorderBottom, { padding: 4 }]}>
            <View style={{ width: '60%', borderRight: '1px solid #000', paddingRight: 4 }}>
              <Text style={[styles.boldText, { textDecoration: 'underline', marginBottom: 4 }]}>Company's Bank Details</Text>
              <View style={styles.flexRow}><Text style={{ width: '30%' }}>A/c Holder Name:</Text><Text style={styles.boldText}>INTERNATIONAL CARGO MOVERS</Text></View>
              <View style={styles.flexRow}><Text style={{ width: '30%' }}>Bank Name:</Text><Text style={styles.boldText}>HDFC BANK A/C</Text></View>
              <View style={styles.flexRow}><Text style={{ width: '30%' }}>A/c No.:</Text><Text style={styles.boldText}>50200050661247</Text></View>
              <View style={styles.flexRow}><Text style={{ width: '30%' }}>Branch & IFSC:</Text><Text style={styles.boldText}>SAFDARJUNG ENCLAVE & HDFC0000503</Text></View>
            </View>
            <View style={{ width: '40%', paddingLeft: 4, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
               <Text style={{ fontSize: 9, marginBottom: 30, textAlign: 'center', width: '100%' }}>for INTERNATIONAL CARGO MOVERS</Text>
               <Text style={{ fontSize: 7 }}>Authorised Signatory</Text>
            </View>
          </View>

          {/* TERMS AND CONDITIONS */}
          <View style={styles.footerBox}>
            <Text style={[styles.boldText, { textDecoration: 'underline', marginBottom: 2 }]}>Terms And Conditions</Text>
            <Text style={[styles.boldText, { fontSize: 7 }]}>ALL PAYMENTS TO BE MADE BY CHEQUE/NEFT/RTGS FAVOURING INTERNATIONAL CARGO MOVERS. INTEREST @ 24% P.A. WILL BE CHARGED IF NOT PAID ON PRESENTATION. DISCREPANCY IF ANY BILLED ITEMS MUST BE COMMUNICATED WITHIN 7 DAYS.</Text>
            <Text style={{ fontSize: 7, marginTop: 4, textAlign: 'center' }}>All business transactions are done in accordance with our company's standard trading terms and conditions.</Text>
          </View>

        </View>
      </Page>
    </Document>
  );
}