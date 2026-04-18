import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings, updateHomepageSettings } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const settings = await getHomepageSettings();
    return NextResponse.json({
      addBalanceTitle: settings.addBalanceTitle,
      addBalanceSubtitle: settings.addBalanceSubtitle,
      addBalanceMethodTitle: settings.addBalanceMethodTitle,
      addBalanceTransferInstruction: settings.addBalanceTransferInstruction,
      addBalanceWalletNumber: settings.addBalanceWalletNumber,
      addBalanceConfirmationNote: settings.addBalanceConfirmationNote,
      addBalanceWhatsappNumber: settings.addBalanceWhatsappNumber,
      addBalanceWhatsappButtonText: settings.addBalanceWhatsappButtonText,
      addBalanceWaitingNote: settings.addBalanceWaitingNote,
    });
  } catch {
    return NextResponse.json({ error: "فشل جلب الإعدادات" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const norm = (v: unknown) => {
    if (v === undefined) return undefined;
    const s = String(v ?? "").trim();
    return s.length > 0 ? s : null;
  };

  try {
    await updateHomepageSettings({
      add_balance_title: norm(body.addBalanceTitle),
      add_balance_subtitle: norm(body.addBalanceSubtitle),
      add_balance_method_title: norm(body.addBalanceMethodTitle),
      add_balance_transfer_instruction: norm(body.addBalanceTransferInstruction),
      add_balance_wallet_number: norm(body.addBalanceWalletNumber),
      add_balance_confirmation_note: norm(body.addBalanceConfirmationNote),
      add_balance_whatsapp_number: norm(body.addBalanceWhatsappNumber),
      add_balance_whatsapp_button_text: norm(body.addBalanceWhatsappButtonText),
      add_balance_waiting_note: norm(body.addBalanceWaitingNote),
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حفظ الإعدادات" }, { status: 500 });
  }
}
