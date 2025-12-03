import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const invoiceId = resolvedParams.id;

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/newbi';
  
  let client;
  try {
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Récupérer la facture
    const invoice = await db.collection('invoices').findOne({
      _id: new ObjectId(invoiceId)
    });
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }
    
    // Récupérer le client si nécessaire
    let client_data = null;
    if (invoice.client) {
      try {
        const clientId = typeof invoice.client === 'string' 
          ? new ObjectId(invoice.client)
          : invoice.client;
        
        client_data = await db.collection('clients').findOne({
          _id: clientId
        });
      } catch (err) {
        console.warn('⚠️ Erreur récupération client:', err.message);
      }
    }
    
    // Formater les données
    const formattedData = {
      id: invoice._id.toString(),
      number: invoice.number,
      prefix: invoice.prefix,
      issueDate: invoice.issueDate || invoice.date,
      dueDate: invoice.dueDate,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      paymentDate: invoice.paymentDate,
      
      totalHT: invoice.totalHT || invoice.subtotal,
      totalVAT: invoice.totalVAT || invoice.taxAmount,
      totalTTC: invoice.totalTTC || invoice.total,
      finalTotalHT: invoice.finalTotalHT,
      finalTotalVAT: invoice.finalTotalVAT,
      finalTotalTTC: invoice.finalTotalTTC,
      
      headerNotes: invoice.headerNotes,
      footerNotes: invoice.footerNotes,
      termsAndConditions: invoice.termsAndConditions,
      termsAndConditionsLink: invoice.termsAndConditionsLink,
      termsAndConditionsLinkTitle: invoice.termsAndConditionsLinkTitle,
      
      discount: invoice.discount,
      discountType: invoice.discountType,
      retenueGarantie: invoice.retenueGarantie,
      escompte: invoice.escompte,
      purchaseOrderNumber: invoice.purchaseOrderNumber,
      
      isDeposit: invoice.isDeposit,
      depositAmount: invoice.depositAmount,
      
      showBankDetails: invoice.showBankDetails,
      isReverseCharge: invoice.isReverseCharge,
      clientPositionRight: invoice.clientPositionRight,
      
      appearance: invoice.appearance || {
        textColor: '#000000',
        headerTextColor: '#ffffff',
        headerBgColor: '#1d1d1b',
      },
      
      shipping: invoice.shipping,
      bankDetails: invoice.bankDetails,
      
      client: client_data ? {
        id: client_data._id.toString(),
        name: client_data.name,
        email: client_data.email,
        phone: client_data.phone,
        address: client_data.address,
      } : (invoice.client || invoice.clientInfo),
      
      items: invoice.items,
      companyInfo: invoice.companyInfo,
      customFields: invoice.customFields,
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
