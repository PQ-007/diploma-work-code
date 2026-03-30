import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

interface RecoverRequestBody {
  studentCode?: string;
}

const STUDENT_CODE_REGEX = /^[a-z0-9._-]{2,64}$/i;

function normalizeStudentCode(raw: string): string {
  return raw.trim().toLowerCase();
}

function buildAppBaseUrl(request: NextRequest): string {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, "");
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RecoverRequestBody;
    const rawCode = body.studentCode ?? "";
    const studentCode = normalizeStudentCode(rawCode);

    if (!studentCode || !STUDENT_CODE_REGEX.test(studentCode)) {
      return NextResponse.json(
        { error: "Valid student code is required." },
        { status: 400 },
      );
    }

    const email = `${studentCode}@nmct.edu.mn`;
    const appBaseUrl = buildAppBaseUrl(request);
    const redirectTo = `${appBaseUrl}/auth/callback?next=/auth/reset-password`;

    const successResponse = NextResponse.json(
      {
        message:
          "If the account exists, a password reset link has been sent to your email.",
      },
      { status: 200 },
    );

    // Primary path: use Supabase Auth mailer (SMTP configured in Supabase).
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo },
      );

      if (!resetError) {
        return successResponse;
      }

      console.warn("Supabase resetPasswordForEmail failed", resetError.message);
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey || !resendFrom) {
      // Keep response generic to avoid account/email enumeration.
      return successResponse;
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = createAdminClient();
    } catch (error) {
      console.warn("Admin client unavailable for Resend fallback", error);
      return successResponse;
    }

    const { data, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo,
        },
      });

    if (linkError) {
      console.warn("Admin generateLink failed", linkError.message);
      return successResponse;
    }

    const recoveryLink = data.properties?.action_link;
    if (!recoveryLink) {
      return successResponse;
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [email],
        subject: "Reset your Future Hub password",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
            <h2 style="margin-bottom: 8px;">Password reset requested</h2>
            <p style="margin-top: 0;">Click the button below to reset your password.</p>
            <p>
              <a
                href="${recoveryLink}"
                style="display: inline-block; padding: 10px 16px; border-radius: 8px; background: #111827; color: #ffffff; text-decoration: none;"
              >
                Reset password
              </a>
            </p>
            <p style="font-size: 12px; color: #6b7280;">If you did not request this, you can ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const resendErrorText = await resendResponse.text();
      console.warn("Resend send failed", resendErrorText);
      return successResponse;
    }

    return successResponse;
  } catch (error) {
    console.error("Error generating recovery email", error);
    return NextResponse.json(
      {
        message:
          "If the account exists, a password reset link has been sent to your email.",
      },
      { status: 200 },
    );
  }
}
