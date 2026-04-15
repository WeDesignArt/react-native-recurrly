import { useSignIn } from "@clerk/expo";
import { clsx } from "clsx";
import { type Href, Link, useRouter } from "expo-router";
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

// ─── brand block ─────────────────────────────────────────────────────────────

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

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    code?: string;
  }>({});

  const isSubmitting = fetchStatus === "fetching";

  function clearFieldError(field: keyof typeof fieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  // ── step 1: password sign-in ────────────────────────────────────────────────
  async function handleSignIn() {
    const errs: typeof fieldErrors = {};

    if (!email) errs.email = "Email address is required.";
    if (!password) errs.password = "Password is required.";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    const { error } = await signIn.password({
      emailAddress: email.trim(),
      password,
    });

    if (error) return; // server errors surface via errors.fields.*

    if (signIn.status === "complete") {
      await finalizeSignIn();
    } else if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      // find email-code second factor and send it
      const emailFactor = signIn.supportedSecondFactors?.find(
        (f) => f.strategy === "email_code"
      );
      if (emailFactor) {
        await signIn.mfa.sendEmailCode();
      }
    }
  }

  // ── step 2: verify MFA / client-trust code ──────────────────────────────────
  async function handleVerify() {
    if (!code || code.length < 6) {
      setFieldErrors({ code: "Enter the 6-digit code sent to your email." });
      return;
    }
    setFieldErrors({});

    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === "complete") {
      await finalizeSignIn();
    }
  }

  async function finalizeSignIn() {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) return;

        const url = decorateUrl("/(tabs)");
        if (url.startsWith("http")) return; // web fallback — not needed in native
        router.replace(url as Href);
      },
    });
  }

  // ── MFA / client-trust verification step ───────────────────────────────────
  if (
    signIn.status === "needs_second_factor" ||
    signIn.status === "needs_client_trust"
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
                title="Verify your identity"
                subtitle={`We sent a 6-digit code to ${email}. Enter it below to continue.`}
              />

              <View className="auth-card">
                <View className="auth-form">
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

                  {/* Verify */}
                  <Pressable
                    className={clsx(
                      "auth-button",
                      isSubmitting && "auth-button-disabled"
                    )}
                    onPress={handleVerify}
                    disabled={isSubmitting}
                    accessibilityRole="button"
                    accessibilityLabel="Verify"
                  >
                    <Text className="auth-button-text">
                      {isSubmitting ? "Verifying…" : "Verify"}
                    </Text>
                  </Pressable>

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
                    onPress={() => signIn.mfa.sendEmailCode()}
                    disabled={isSubmitting}
                    accessibilityRole="button"
                    accessibilityLabel="Resend code"
                  >
                    <Text className="auth-secondary-button-text">
                      Resend code
                    </Text>
                  </Pressable>

                  {/* Start over */}
                  <Pressable
                    className={clsx(
                      "auth-secondary-button",
                      isSubmitting && "opacity-50"
                    )}
                    onPress={() => signIn.reset()}
                    disabled={isSubmitting}
                    accessibilityRole="button"
                    accessibilityLabel="Start over"
                  >
                    <Text className="auth-secondary-button-text">
                      Start over
                    </Text>
                  </Pressable>
                </View>
              </View>

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

  // ── sign-in form ────────────────────────────────────────────────────────────
  const emailError =
    fieldErrors.email ?? errors.fields.identifier?.message ?? null;
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
              title="Welcome back"
              subtitle="Sign in to continue managing your subscriptions."
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
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      secureTextEntry={!showPassword}
                      autoComplete="current-password"
                      returnKeyType="done"
                      textContentType="password"
                      onSubmitEditing={handleSignIn}
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
                  {passwordError && (
                    <Text className="auth-error">{passwordError}</Text>
                  )}
                </View>

                {/* Submit */}
                <Pressable
                  className={clsx(
                    "auth-button",
                    !canSubmit && "auth-button-disabled"
                  )}
                  onPress={handleSignIn}
                  disabled={!canSubmit}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in"
                >
                  <Text className="auth-button-text">
                    {isSubmitting ? "Signing in…" : "Sign in"}
                  </Text>
                </Pressable>

                {/* Global / unexpected errors */}
                {errors.global && errors.global.length > 0 && (
                  <Text className="auth-error text-center">
                    {errors.global[0].message}
                  </Text>
                )}

                {/* ── navigation link (inside card, as per design) ──── */}
                <View className="auth-link-row">
                  <Text className="auth-link-copy">New to Recurrly?</Text>
                  <Link href="/(auth)/sign-up" asChild>
                    <Pressable accessibilityRole="link">
                      <Text className="auth-link">Create an account</Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </StyledSafeAreaView>
  );
}
