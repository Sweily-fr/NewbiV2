/**
 * API Route pour générer des PDF Factur-X 100% conformes
 * Convertit un PDF standard en PDF/A-3 avec métadonnées XMP
 */

import { NextResponse } from 'next/server';
import { PDFDocument, PDFName, PDFString, PDFArray } from 'pdf-lib';

export async function POST(request) {
  try {
    const { pdfBase64, xmlString, invoiceNumber, documentType } = await request.json();

    console.log('🔧 Génération Factur-X conforme...');

    // Décoder le PDF
    const pdfBytes = Buffer.from(pdfBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Encoder le XML
    const xmlBytes = new TextEncoder().encode(xmlString);

    // Nom du fichier XML (obligatoire : factur-x.xml)
    const attachmentName = 'factur-x.xml';

    // Créer l'objet FileSpec pour l'attachement
    const fileSpec = pdfDoc.context.obj({
      Type: 'Filespec',
      F: PDFString.of(attachmentName),
      UF: PDFString.of(attachmentName),
      AFRelationship: PDFName.of('Alternative'), // Requis pour PDF/A-3
      Desc: PDFString.of('Factur-X XML Invoice'),
    });

    // Créer le stream pour le fichier XML
    const embeddedFile = pdfDoc.context.flateStream(xmlBytes, {
      Type: 'EmbeddedFile',
      Subtype: 'text/xml',
      Params: pdfDoc.context.obj({
        Size: xmlBytes.length,
        CreationDate: PDFString.of(new Date().toISOString()),
        ModDate: PDFString.of(new Date().toISOString()),
      }),
    });

    // Lier le FileSpec au stream
    const embeddedFileRef = pdfDoc.context.register(embeddedFile);
    fileSpec.set(PDFName.of('EF'), pdfDoc.context.obj({ F: embeddedFileRef, UF: embeddedFileRef }));

    // Enregistrer le FileSpec
    const fileSpecRef = pdfDoc.context.register(fileSpec);

    // Ajouter à l'array des fichiers embarqués
    const catalog = pdfDoc.catalog;
    let names = catalog.get(PDFName.of('Names'));
    
    if (!names) {
      names = pdfDoc.context.obj({});
      catalog.set(PDFName.of('Names'), names);
    }

    let embeddedFiles = names.get(PDFName.of('EmbeddedFiles'));
    
    if (!embeddedFiles) {
      embeddedFiles = pdfDoc.context.obj({});
      names.set(PDFName.of('EmbeddedFiles'), embeddedFiles);
    }

    let namesArray = embeddedFiles.get(PDFName.of('Names'));
    
    if (!namesArray) {
      namesArray = pdfDoc.context.obj([]);
      embeddedFiles.set(PDFName.of('Names'), namesArray);
    }

    // Ajouter le fichier à l'array
    if (namesArray instanceof PDFArray) {
      namesArray.push(PDFString.of(attachmentName));
      namesArray.push(fileSpecRef);
    }

    // Ajouter l'array AF (Associated Files) au catalog pour PDF/A-3
    let af = catalog.get(PDFName.of('AF'));
    if (!af) {
      af = pdfDoc.context.obj([]);
      catalog.set(PDFName.of('AF'), af);
    }
    if (af instanceof PDFArray) {
      af.push(fileSpecRef);
    }

    // Créer les métadonnées XMP Factur-X conformes
    const xmpMetadata = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:format>application/pdf</dc:format>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${documentType === 'creditNote' ? 'Avoir' : 'Facture'} ${invoiceNumber || ''}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>Newbi</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">Factur-X Invoice</rdf:li>
        </rdf:Alt>
      </dc:description>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdf:Producer>Newbi Factur-X Generator</pdf:Producer>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <xmp:CreatorTool>Newbi</xmp:CreatorTool>
      <xmp:CreateDate>${new Date().toISOString()}</xmp:CreateDate>
      <xmp:ModifyDate>${new Date().toISOString()}</xmp:ModifyDate>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/" xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#" xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>fx</pdfaSchema:prefix>
            <pdfaSchema:property>
              <rdf:Seq>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentFileName</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Name of the embedded XML invoice file</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentType</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>INVOICE</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>Version</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>The actual version of the Factur-X XML schema</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>The conformance level of the embedded Factur-X data</pdfaProperty:description>
                </rdf:li>
              </rdf:Seq>
            </pdfaSchema:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>${attachmentName}</fx:DocumentFileName>
      <fx:Version>1.0.07</fx:Version>
      <fx:ConformanceLevel>EN16931</fx:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

    // Créer le stream de métadonnées XMP
    const xmpBytes = new TextEncoder().encode(xmpMetadata);
    const metadataStream = pdfDoc.context.stream(xmpBytes, {
      Type: 'Metadata',
      Subtype: 'XML',
      Length: xmpBytes.length,
    });

    // Ajouter les métadonnées au catalog
    const metadataStreamRef = pdfDoc.context.register(metadataStream);
    catalog.set(PDFName.of('Metadata'), metadataStreamRef);

    // Ajouter OutputIntent pour PDF/A-3
    const outputIntent = pdfDoc.context.obj({
      Type: 'OutputIntent',
      S: PDFName.of('GTS_PDFA1'),
      OutputConditionIdentifier: PDFString.of('sRGB IEC61966-2.1'),
      Info: PDFString.of('sRGB IEC61966-2.1'),
      RegistryName: PDFString.of('http://www.color.org'),
    });

    const outputIntentRef = pdfDoc.context.register(outputIntent);
    
    let outputIntents = catalog.get(PDFName.of('OutputIntents'));
    if (!outputIntents) {
      outputIntents = pdfDoc.context.obj([]);
      catalog.set(PDFName.of('OutputIntents'), outputIntents);
    }
    
    if (outputIntents instanceof PDFArray) {
      outputIntents.push(outputIntentRef);
    }

    // Marquer comme PDF/A-3
    catalog.set(PDFName.of('Version'), PDFName.of('1.7'));

    // Ajouter les métadonnées de base au dictionnaire Info
    const infoDict = pdfDoc.getInfoDict();
    infoDict.set(PDFName.of('Title'), PDFString.of(`${documentType === 'creditNote' ? 'Avoir' : 'Facture'} ${invoiceNumber || ''}`));
    infoDict.set(PDFName.of('Subject'), PDFString.of('Factur-X Invoice'));
    infoDict.set(PDFName.of('Creator'), PDFString.of('Newbi'));
    infoDict.set(PDFName.of('Producer'), PDFString.of('Newbi Factur-X Generator'));
    infoDict.set(PDFName.of('Keywords'), PDFString.of('Factur-X, Invoice, EN16931, PDF/A-3'));

    // Sauvegarder le PDF modifié
    const modifiedPdfBytes = await pdfDoc.save({
      useObjectStreams: false, // Requis pour PDF/A
      addDefaultPage: false,
      objectsPerTick: 50,
    });

    console.log('✅ PDF Factur-X conforme généré');

    // Retourner le PDF en base64
    return NextResponse.json({
      success: true,
      pdfBase64: Buffer.from(modifiedPdfBytes).toString('base64'),
      message: 'PDF Factur-X généré avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur génération Factur-X:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
