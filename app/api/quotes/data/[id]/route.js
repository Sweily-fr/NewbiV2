import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const quoteId = resolvedParams.id;

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/newbi';
  
  let client;
  try {
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Récupérer le devis
    const quote = await db.collection('quotes').findOne({
      _id: new ObjectId(quoteId)
    });
    
    if (!quote) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      );
    }
    
    // Récupérer le client si nécessaire
    let client_data = null;
    if (quote.client) {
      try {
        const clientId = typeof quote.client === 'string' 
          ? new ObjectId(quote.client)
          : quote.client;
        
        client_data = await db.collection('clients').findOne({
          _id: clientId
        });
      } catch (err) {
        console.warn('⚠️ Erreur récupération client:', err.message);
      }
    }
    
    // Formater les données
    const formattedData = {
      id: quote._id.toString(),
      number: quote.number,
      prefix: quote.prefix,
      issueDate: quote.issueDate || quote.date,
      validUntil: quote.validUntil,
      status: quote.status,
      
      totalHT: quote.totalHT || quote.subtotal,
      totalVAT: quote.totalVAT || quote.taxAmount,
      totalTTC: quote.totalTTC || quote.total,
      finalTotalHT: quote.finalTotalHT,
      finalTotalVAT: quote.finalTotalVAT,
      finalTotalTTC: quote.finalTotalTTC,
      
      headerNotes: quote.headerNotes,
      footerNotes: quote.footerNotes,
      termsAndConditions: quote.termsAndConditions,
      termsAndConditionsLink: quote.termsAndConditionsLink,
      termsAndConditionsLinkTitle: quote.termsAndConditionsLinkTitle,
      
      discount: quote.discount,
      discountType: quote.discountType,
      retenueGarantie: quote.retenueGarantie,
      escompte: quote.escompte,
      purchaseOrderNumber: quote.purchaseOrderNumber,
      
      isDeposit: quote.isDeposit,
      depositAmount: quote.depositAmount,
      
      showBankDetails: quote.showBankDetails,
      isReverseCharge: quote.isReverseCharge,
      clientPositionRight: quote.clientPositionRight,
      
      appearance: quote.appearance || {
        textColor: '#000000',
        headerTextColor: '#ffffff',
        headerBgColor: '#1d1d1b',
      },
      
      shipping: quote.shipping,
      bankDetails: quote.bankDetails,
      
      client: client_data ? {
        id: client_data._id.toString(),
        name: client_data.name,
        email: client_data.email,
        phone: client_data.phone,
        address: client_data.address,
      } : (quote.client || quote.clientInfo),
      
      items: quote.items,
      companyInfo: quote.companyInfo,
      customFields: quote.customFields,
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
