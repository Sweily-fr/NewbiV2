import { NextResponse } from "next/server";

/**
 * POST /api/unified-expenses/match
 * Recherche une transaction bancaire correspondante aux données OCR
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, date, vendor, workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId requis" },
        { status: 400 }
      );
    }

    // Récupérer le token d'auth depuis les cookies ou headers
    const authCookie = request.cookies.get("better-auth.session_token")?.value
      || request.cookies.get("__Secure-better-auth.session_token")?.value;
    const authHeader = request.headers.get("authorization");

    const graphqlUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/").replace(/\/$/, "") + "/graphql";

    // Rechercher les transactions correspondantes via GraphQL
    const query = `
      query GetTransactions($workspaceId: ID!, $limit: Int) {
        transactions(workspaceId: $workspaceId, limit: $limit) {
          id
          amount
          description
          date
          category
          provider
          status
          receiptFile {
            url
          }
          metadata
        }
      }
    `;

    const headers = {
      "Content-Type": "application/json",
    };
    if (authCookie) {
      headers["Cookie"] = `better-auth.session_token=${authCookie}`;
    }
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables: { workspaceId, limit: 500 },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return NextResponse.json(
        { error: data.errors[0]?.message || "Erreur GraphQL" },
        { status: 500 }
      );
    }

    const transactions = data.data?.transactions || [];

    // Rechercher une correspondance par montant et date
    const targetAmount = Math.abs(parseFloat(amount));
    const targetDate = date ? new Date(date) : null;

    let bestMatch = null;
    let bestScore = 0;

    for (const tx of transactions) {
      // Ignorer les transactions qui ont déjà un justificatif
      if (tx.receiptFile?.url) continue;

      let score = 0;
      const txAmount = Math.abs(tx.amount);

      // Score par montant (tolérance de 1%)
      if (targetAmount > 0) {
        const amountDiff = Math.abs(txAmount - targetAmount) / targetAmount;
        if (amountDiff < 0.01) score += 50;
        else if (amountDiff < 0.05) score += 30;
        else if (amountDiff < 0.10) score += 10;
      }

      // Score par date (tolérance de 3 jours)
      if (targetDate && tx.date) {
        const txDate = new Date(tx.date);
        const daysDiff = Math.abs(targetDate - txDate) / (1000 * 60 * 60 * 24);
        if (daysDiff < 1) score += 30;
        else if (daysDiff < 3) score += 20;
        else if (daysDiff < 7) score += 10;
      }

      // Score par vendeur
      if (vendor && tx.description) {
        const vendorLower = vendor.toLowerCase();
        const descLower = tx.description.toLowerCase();
        if (descLower.includes(vendorLower) || vendorLower.includes(descLower)) {
          score += 20;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = tx;
      }
    }

    // Retourner le match si le score est suffisant
    if (bestMatch && bestScore >= 50) {
      return NextResponse.json({
        found: true,
        transaction: bestMatch,
        score: bestScore,
        candidates: [bestMatch],
      });
    }

    return NextResponse.json({
      found: false,
      transaction: null,
      score: 0,
      candidates: [],
    });
  } catch (error) {
    console.error("❌ [MATCH] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}
