import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const creditNoteId = resolvedParams.id;

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/newbi';
  
  let client;
  try {
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Récupérer l'avoir
    const creditNote = await db.collection('creditnotes').findOne({
      _id: new ObjectId(creditNoteId)
    });
    
    if (!creditNote) {
      return NextResponse.json(
        { error: 'Avoir non trouvé' },
        { status: 404 }
      );
    }
    
    // Récupérer le client si nécessaire
    let client_data = null;
    if (creditNote.client) {
      try {
        const clientId = typeof creditNote.client === 'string' 
          ? new ObjectId(creditNote.client)
          : creditNote.client;
        
        client_data = await db.collection('clients').findOne({
          _id: clientId
        });
      } catch (err) {
        console.warn('⚠️ Erreur récupération client:', err.message);
      }
    }
    
    // Récupérer la facture originale si nécessaire
    let originalInvoiceData = null;
    if (creditNote.originalInvoice) {
      try {
        const invoiceId = typeof creditNote.originalInvoice === 'string' 
          ? new ObjectId(creditNote.originalInvoice)
          : creditNote.originalInvoice;
        
        originalInvoiceData = await db.collection('invoices').findOne({
          _id: invoiceId
        });
      } catch (err) {
        console.warn('⚠️ Erreur récupération facture originale:', err.message);
      }
    }
    
    // Formater les données
    const formattedData = {
      id: creditNote._id.toString(),
      number: creditNote.number,
      prefix: creditNote.prefix,
      issueDate: creditNote.issueDate || creditNote.date,
      status: creditNote.status,
      
      // Informations de la facture originale
      originalInvoice: originalInvoiceData ? {
        id: originalInvoiceData._id.toString(),
        number: originalInvoiceData.number,
        prefix: originalInvoiceData.prefix,
      } : null,
      originalInvoiceNumber: creditNote.originalInvoiceNumber || 
        (originalInvoiceData ? `${originalInvoiceData.prefix || 'F'}-${originalInvoiceData.number}` : null),
      
      totalHT: creditNote.totalHT || creditNote.subtotal,
      totalVAT: creditNote.totalVAT || creditNote.taxAmount,
      totalTTC: creditNote.totalTTC || creditNote.total,
      finalTotalHT: creditNote.finalTotalHT,
      finalTotalVAT: creditNote.finalTotalVAT,
      finalTotalTTC: creditNote.finalTotalTTC,
      
      headerNotes: creditNote.headerNotes,
      footerNotes: creditNote.footerNotes,
      termsAndConditions: creditNote.termsAndConditions,
      termsAndConditionsLink: creditNote.termsAndConditionsLink,
      termsAndConditionsLinkTitle: creditNote.termsAndConditionsLinkTitle,
      
      discount: creditNote.discount,
      discountType: creditNote.discountType,
      
      showBankDetails: creditNote.showBankDetails,
      isReverseCharge: creditNote.isReverseCharge,
      clientPositionRight: creditNote.clientPositionRight,
      
      appearance: creditNote.appearance || {
        textColor: '#000000',
        headerTextColor: '#ffffff',
        headerBgColor: '#1d1d1b',
      },
      
      bankDetails: creditNote.bankDetails,
      
      client: client_data ? {
        id: client_data._id.toString(),
        name: client_data.name,
        email: client_data.email,
        phone: client_data.phone,
        address: client_data.address,
      } : (creditNote.client || creditNote.clientInfo),
      
      items: creditNote.items,
      companyInfo: creditNote.companyInfo,
      customFields: creditNote.customFields,
    };
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
