import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { TOKEN_PACKAGES, type TokenType, type PackageSize } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const { tokenType, packageSize } = body as { tokenType: TokenType; packageSize: PackageSize };

  if (!TOKEN_PACKAGES[tokenType]?.[packageSize]) {
    return NextResponse.json({ error: "Pacote inválido" }, { status: 400 });
  }

  const pkg = TOKEN_PACKAGES[tokenType][packageSize];
  if (!pkg.priceId || pkg.priceId === "price_...") {
    return NextResponse.json(
      { error: "Pacote não configurado. Adicione o Price ID no .env" },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, stripeCustomerId: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card", "pix"],
    line_items: [{ price: pkg.priceId, quantity: 1 }],
    metadata: { userId, tokenType, packageSize },
    success_url: `${baseUrl}/dashboard/tokens?purchased=1&type=${tokenType}`,
    cancel_url:  `${baseUrl}/dashboard/tokens?canceled=1`,
    locale: "pt-BR",
  });

  return NextResponse.json({ url: checkoutSession.url });
}
