export const runtime = "nodejs";

type OrderRequest = {
  amount: number;
  customerName?: string;
  salonName?: string;
  service?: string;
};

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId.includes("replace") || keySecret.includes("replace")) {
    return null;
  }

  return { keyId, keySecret };
}

function buildBasicAuth(keyId: string, keySecret: string) {
  return Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

export async function POST(request: Request) {
  const credentials = getRazorpayCredentials();

  if (!credentials) {
    return Response.json(
      {
        error:
          "Razorpay keys are not configured. Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.",
      },
      { status: 500 },
    );
  }

  let body: OrderRequest;

  try {
    body = (await request.json()) as OrderRequest;
  } catch {
    return Response.json({ error: "Invalid payment request." }, { status: 400 });
  }

  const amount = Number(body.amount);

  if (!Number.isFinite(amount) || amount < 100 || amount > 250000) {
    return Response.json({ error: "Payment amount is outside the allowed range." }, { status: 400 });
  }

  const amountInPaise = Math.round(amount * 100);
  const currency = process.env.RAZORPAY_CURRENCY || "INR";
  const receipt = `glownest_${Date.now()}`;

  const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${buildBasicAuth(credentials.keyId, credentials.keySecret)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency,
      receipt,
      notes: {
        customerName: body.customerName || "Guest",
        salonName: body.salonName || "GlowNest partner",
        service: body.service || "Beauty service",
      },
    }),
  });

  const data = (await razorpayResponse.json()) as {
    id?: string;
    amount?: number;
    currency?: string;
    receipt?: string;
    error?: { description?: string };
  };

  if (!razorpayResponse.ok) {
    return Response.json(
      { error: data.error?.description || "Unable to create Razorpay order." },
      { status: razorpayResponse.status },
    );
  }

  return Response.json({
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    receipt: data.receipt,
    keyId: credentials.keyId,
  });
}
