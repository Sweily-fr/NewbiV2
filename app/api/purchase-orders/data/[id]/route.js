import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const purchaseOrderId = resolvedParams.id;

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/newbi';

  let client;
  try {
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    const purchaseOrder = await db.collection('purchaseorders').findOne({
      _id: new ObjectId(purchaseOrderId)
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Bon de commande non trouvé' },
        { status: 404 }
      );
    }

    const formattedData = {
      id: purchaseOrder._id.toString(),
      number: purchaseOrder.number,
      prefix: purchaseOrder.prefix,
      issueDate: purchaseOrder.issueDate,
      validUntil: purchaseOrder.validUntil,
      deliveryDate: purchaseOrder.deliveryDate,
      status: purchaseOrder.status,
      purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,

      totalHT: purchaseOrder.totalHT,
      totalVAT: purchaseOrder.totalVAT,
      totalTTC: purchaseOrder.totalTTC,
      finalTotalHT: purchaseOrder.finalTotalHT,
      finalTotalVAT: purchaseOrder.finalTotalVAT,
      finalTotalTTC: purchaseOrder.finalTotalTTC,

      headerNotes: purchaseOrder.headerNotes,
      footerNotes: purchaseOrder.footerNotes,
      termsAndConditions: purchaseOrder.termsAndConditions,
      termsAndConditionsLink: purchaseOrder.termsAndConditionsLink,
      termsAndConditionsLinkTitle: purchaseOrder.termsAndConditionsLinkTitle,

      discount: purchaseOrder.discount,
      discountType: purchaseOrder.discountType,
      discountAmount: purchaseOrder.discountAmount,
      retenueGarantie: purchaseOrder.retenueGarantie,
      escompte: purchaseOrder.escompte,

      showBankDetails: purchaseOrder.showBankDetails,
      isReverseCharge: purchaseOrder.isReverseCharge,
      clientPositionRight: purchaseOrder.clientPositionRight,

      appearance: purchaseOrder.appearance || {
        textColor: '#000000',
        headerTextColor: '#ffffff',
        headerBgColor: '#1d1d1b',
      },

      shipping: purchaseOrder.shipping,

      client: purchaseOrder.client,
      items: purchaseOrder.items,
      companyInfo: purchaseOrder.companyInfo,
      customFields: purchaseOrder.customFields,
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
