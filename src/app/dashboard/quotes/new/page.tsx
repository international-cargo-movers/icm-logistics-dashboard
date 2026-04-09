"use client"

import * as React from "react"
import { useState } from "react"
import { pdf } from '@react-pdf/renderer'
import QuotePDF from '@/components/dashboard/quotes/QuotePDF' // Assuming this still exists from earlier!

export default function NewQuotePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 1. Initial State matching your UI exactly
  const [quoteData, setQuoteData] = useState({
    quoteRef: `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    validityDays: 15,
    customerName: "",
    customerEmail: "",
    lineItems: [
      { description: "Ocean Freight - 40' HC Container", rate: 3250.00 },
      { description: "Terminal Handling Charges", rate: 150.00 },
      { description: "Bunker Adjustment Factor", rate: 480.00 }
    ]
  })

  // 2. Live Math Calculation
  const totalAmount = quoteData.lineItems.reduce((acc, item) => acc + (Number(item.rate) || 0), 0)

  // 3. Dynamic Form Handlers
  const addLineItem = () => {
    setQuoteData({
      ...quoteData, 
      lineItems: [...quoteData.lineItems, { description: "", rate: 0 }]
    })
  }

  const removeLineItem = (indexToRemove: number) => {
    setQuoteData({
      ...quoteData,
      lineItems: quoteData.lineItems.filter((_, idx) => idx !== indexToRemove)
    })
  }

  const updateLineItem = (index: number, field: "description" | "rate", value: string | number) => {
    const newItems = [...quoteData.lineItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setQuoteData({ ...quoteData, lineItems: newItems })
  }

  // 4. The Backend Submission Pipeline
  const handleSendQuote = async () => {
    setIsSubmitting(true)
    try {
      const finalData = {
        ...quoteData,
        totalAmount,
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + quoteData.validityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }

      // Generate PDF & Base64
      const blob = await pdf(<QuotePDF data={finalData} />).toBlob()
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1]

        const response = await fetch('/api/quotes/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: finalData.customerEmail,
            customerName: finalData.customerName,
            quoteRef: finalData.quoteRef,
            pdfBase64: base64String 
          })
        })

        if (!response.ok) throw new Error("API Route failed.")
        
        const result = await response.json()
        if (result.success) {
          alert("Quote Successfully Sent to Customer!")
        }
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Failed to send quote:", error)
      alert("Something went wrong.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-16 py-12 bg-surface text-on-surface font-sans min-h-screen">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Create & Send Quote</h1>
          <p className="text-on-surface-variant text-lg">Generate precise freight quotes with real-time financial calculations.</p>
        </div>

        {/* Main Form Card */}
        <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-[0_12px_40px_rgba(25,28,30,0.04)] transition-all">
          <div className="p-8 space-y-10">
            
            {/* Customer Details */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Customer Details</h2>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Customer Name</label>
                  <input 
                    type="text"
                    value={quoteData.customerName}
                    onChange={(e) => setQuoteData({...quoteData, customerName: e.target.value})}
                    className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface outline-none" 
                    placeholder="e.g. Global Trade Corp" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Customer Email</label>
                  <input 
                    type="email"
                    value={quoteData.customerEmail}
                    onChange={(e) => setQuoteData({...quoteData, customerEmail: e.target.value})}
                    className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface outline-none" 
                    placeholder="billing@globaltrade.com" 
                  />
                </div>
              </div>
            </section>

            {/* Quote Settings */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Quote Settings</h2>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Quote Reference</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={quoteData.quoteRef}
                    className="w-full bg-surface-container-highest border-none rounded-lg py-3 px-4 text-on-surface-variant cursor-not-allowed font-mono outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Validity (Days)</label>
                  <input 
                    type="number" 
                    value={quoteData.validityDays}
                    onChange={(e) => setQuoteData({...quoteData, validityDays: parseInt(e.target.value) || 0})}
                    className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface outline-none" 
                  />
                </div>
              </div>
            </section>

            {/* Proposed Charges */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-l-4 border-primary pl-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Proposed Charges</h2>
                <button 
                  onClick={addLineItem}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Add Line Item
                </button>
              </div>
              
              <div className="rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low">
                      <th className="py-4 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Service Description</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Rate (USD)</th>
                      <th className="py-4 px-6 text-right w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    
                    {quoteData.lineItems.map((item, index) => (
                      <tr key={index} className="group hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-5 px-6">
                          <input 
                            type="text" 
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            className="w-full bg-transparent border-none p-0 focus:ring-0 font-medium text-on-surface outline-none" 
                            placeholder="Description"
                          />
                        </td>
                        <td className="py-5 px-6 text-right tabular-nums">
                          <input 
                            type="number" 
                            value={item.rate}
                            onChange={(e) => updateLineItem(index, 'rate', e.target.value)}
                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-right font-medium text-on-surface outline-none" 
                          />
                        </td>
                        <td className="py-5 px-6 text-right">
                          <button 
                            onClick={() => removeLineItem(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-error"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="bg-surface-container-low p-8 flex items-center justify-between border-t border-surface-container">
            <div className="space-y-1">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Estimated Total</span>
              <div className="text-3xl font-black text-primary tabular-nums">
                ${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-6 py-3 font-semibold text-secondary hover:text-on-background transition-colors flex items-center gap-2">
                Save as Draft
              </button>
              <button 
                onClick={handleSendQuote}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>send</span>
                {isSubmitting ? "Processing..." : "Send Quote via Email"}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Context/Help */}
        <div className="grid grid-cols-3 gap-8 text-sm text-on-surface-variant opacity-80">
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-surface-container-low/40">
            <span className="material-symbols-outlined text-primary">verified_user</span>
            <h4 className="font-bold text-on-surface">Encrypted Data</h4>
            <p>Financial details are encrypted and stored in secure cloud environments.</p>
          </div>
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-surface-container-low/40">
            <span className="material-symbols-outlined text-primary">schedule</span>
            <h4 className="font-bold text-on-surface">Auto-Expiry</h4>
            <p>Quotes will automatically expire if not accepted within the validity period.</p>
          </div>
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-surface-container-low/40">
            <span className="material-symbols-outlined text-primary">account_tree</span>
            <h4 className="font-bold text-on-surface">Audit Trail</h4>
            <p>Every quote generation is logged in the system for compliance monitoring.</p>
          </div>
        </div>

      </div>
    </div>
  )
}