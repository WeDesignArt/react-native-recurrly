import { useAuth, useSignUp } from "@clerk/expo";
import { clsx } from "clsx";
import { type Href, Link, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";

const StyledSafeAreaView = styled(SafeAreaView);

// ─── helpers ─────────────────────────────────────────────────────────────────

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── brand block (shared between form and verify steps) ──────────────────────

function BrandBlock({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View className="auth-brand-block">
      <View className="auth-logo-wrap">
        <View className="auth-logo-mark">
          <Text className="auth-logo-mark-text">R</Text>
        </View>
        <View className="gap-3">
          <Text className="auth-wordmark">Recurrly</Text>
          <Text className="auth-wordmark-sub">SMART BILLING</Text>
        </View>
      </View>
      <Text className="auth-title">{title}</Text>
      <Text className="auth-subtitle">{subtitle}</Text>
    </View>
  );
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function SignUp() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const posthog = usePostHog();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");

  // client-side validation messages (cleared on next submit attempt)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    code?: string;
  }>({});

  const isSubmitting = fetchStatus === "fetching";

  // ── helper: clear a single client-side field error while typing ─────────────
  function clearFieldError(field: keyof typeof fieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  // ── step 1: create the account ──────────────────────────────────────────────
  async function handleSignUp() {
    const errs: typeof fieldErrors = {};

    if (!email) errs.email = "Email address is required.";
    else if (!isValidEmail(email)) errs.email = "Enter a valid email address.";

    if (!password) errs.password = "Password is required.";
    else if (password.length < 8)
      errs.password = "Password must be at least 8 characters.";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    const { error } = await signUp.password({
      emailAddress: email.trim(),
      password,
    });

    if (error) return; // server errors surfaced via errors.fields.*

    await signUp.verifications.sendEmailCode();
  }

  // ── step 2: verify email ────────────────────────────────────────────────────
  async function handleVerify() {
    if (!code || code.length < 6) {
      setFieldErrors({ code: "Enter the 6-digit code sent to your email." });
      return;
    }
    setFieldErrors({});

    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === "complete") {
      posthog?.capture("user_signed_up", { method: "email_password" });
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          // handle any pending session tasks first
          if (session?.currentTask) return;

          const url = decorateUrl("/(tabs)");
          if (url.startsWith("http")) return; // web fallback — not needed in native
          router.replace(url as Href);
        },
      });
    }
  }

  // already signed in — render nothing while the guard redirects
  if (signUp.status === "complete" || isSignedIn) return null;

  // ── verification step ───────────────────────────────────────────────────────
  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  ) {
    const codeError =
      fieldErrors.code ?? errors.fields.code?.message ?? null;

    return (
      <StyledSafeAreaView className="auth-safe-area">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="auth-content">
              <BrandBlock
                title="Check your email"
                subtitle={`We sent a 6-digit code to ${email}. Enter it below to activate your account.`}
              />

              <View className="auth-card">
                <View className="auth-form">
                  {/* Code field */}
                  <View className="auth-field">
                    <Text className="auth-label">Verification code</Text>
                    <TextInput
                      className={clsx(
                        "auth-input",
                        codeError && "auth-input-error"
                      )}
                      value={code}
                      onChangeText={(v) => {
                        setCode(v);
                        clearFieldError("code");
                      }}
                      placeholder="000000"
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleVerify}
                    />
                    {codeError && (
                      <Text className="auth-error">{codeError}</Text>
                    )}
                  </View>

                  {/* Verify button */}
                  <Pressable
                    className={clsx(
                      "auth-button",
                      isSubmitting && "auth-button-disabled"
                    )}
                    onPress={handleVerify}
                    disabled={isSubmitting}
                    accessibilityRole="button"
                    accessibilityLabel="Verify email"
                  >
                    <Text className="auth-button-text">
                      {isSubmitting ? "Verifying…" : "Verify email"}
                    </Text>
                  </Pressable>

                  {/* Divider */}
                  <View className="auth-divider-row">
                    <View className="auth-divider-line" />
                    <Text className="auth-divider-text">or</Text>
                    <View className="auth-divider-line" />
                  </View>

                  {/* Resend */}
                  <Pressable
                    className={clsx(
                      "auth-secondary-button",
                      isSubmitting && "opacity-50"
                    )}
                    onPress={() => signUp.verifications.sendEmailCode()}
                    disabled={isSubmitting}
                    accessibilityRole="button"
                    accessibilityLabel="Resend verification code"
                  >
                    <Text className="auth-secondary-button-text">
                      Resend code
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Global / unexpected errors */}
              {errors.global && errors.global.length > 0 && (
                <Text className="auth-error mt-3 text-center">
                  {errors.global[0].message}
                </Text>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </StyledSafeAreaView>
    );
  }

  // ── sign-up form ────────────────────────────────────────────────────────────
  const emailError =
    fieldErrors.email ?? errors.fields.emailAddress?.message ?? null;
  const passwordError =
    fieldErrors.password ?? errors.fields.password?.message ?? null;
  const canSubmit = !!email && !!password && !isSubmitting;

  return (
    <StyledSafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-content">
            <BrandBlock
              title="Create your account"
              subtitle="Track every subscription, never miss a renewal."
            />

            {/* ── form card ─────────────────────────────────────────────── */}
            <View className="auth-card">
              <View className="auth-form">
                {/* Email */}
                <View className="auth-field">
                  <Text className="auth-label">Email</Text>
                  <TextInput
                    className={clsx(
                      "auth-input",
                      emailError && "auth-input-error"
                    )}
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      clearFieldError("email");
                    }}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    returnKeyType="next"
                    textContentType="emailAddress"
                  />
                  {emailError && (
                    <Text className="auth-error">{emailError}</Text>
                  )}
                </View>

                {/* Password */}
                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <View style={{ position: "relative" }}>
                    <TextInput
                      className={clsx(
                        "auth-input",
                        passwordError && "auth-input-error"
                      )}
                      style={{ paddingRight: 60 }}
                      value={password}
                      onChangeText={(v) => {
                        setPassword(v);
                        clearFieldError("password");
                      }}
                      placeholder="Create a password"
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      returnKeyType="done"
                      textContentType="newPassword"
                      onSubmitEditing={handleSignUp}
                    />
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      style={{
                        position: "absolute",
                        right: 16,
                        top: 0,
                        bottom: 0,
                        justifyContent: "center",
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      <Text className="text-sm font-sans-semibold text-accent">
                        {showPassword ? "Hide" : "Show"}
                      </Text>
                    </Pressable>
                  </View>
                  {passwordError ? (
                    <Text className="auth-error">{passwordError}</Text>
                  ) : (
                    <Text className="auth-helper">
                      Use 8+ characters for a strong password.
                    </Text>
                  )}
                </View>

                {/* Submit */}
                <Pressable
                  className={clsx(
                    "auth-button",
                    !canSubmit && "auth-button-disabled"
                  )}
                  onPress={handleSignUp}
                  disabled={!canSubmit}
                  accessibilityRole="button"
                  accessibilityLabel="Create account"
                >
                  <Text className="auth-button-text">
                    {isSubmitting ? "Creating account…" : "Create account"}
                  </Text>
                </Pressable>

                {/* Global / unexpected errors */}
                {errors.global && errors.global.length > 0 && (
                  <Text className="auth-error text-center">
                    {errors.global[0].message}
                  </Text>
                )}

                {/* ── navigation link (inside card, mirrors design) ──── */}
                <View className="auth-link-row">
                  <Text className="auth-link-copy">
                    Already on Recurrly?
                  </Text>
                  <Link href="/(auth)/sign-in" asChild>
                    <Pressable accessibilityRole="link">
                      <Text className="auth-link">Sign in</Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            </View>

            {/* Required by Clerk for bot protection */}
            <View nativeID="clerk-captcha" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </StyledSafeAreaView>
  );
}
