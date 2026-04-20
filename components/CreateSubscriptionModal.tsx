import { Ionicons } from "@expo/vector-icons";
import { clsx } from "clsx";
import dayjs from "dayjs";
import React, { useState } from "react";
import {
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { icons } from "@/constant/icons";
import { colors } from "@/constant/theme";
import { useSubscriptions } from "@/context/subscriptions";

// ─── icon resolution ──────────────────────────────────────────────────────────

const LOCAL_ICON_MAP: Record<string, ImageSourcePropType> = {
  spotify: icons.spotify,
  notion: icons.notion,
  figma: icons.figma,
  adobe: icons.adobe,
  "adobe creative cloud": icons.adobe,
  github: icons.github,
  "github pro": icons.github,
  claude: icons.claude,
  "claude pro": icons.claude,
  canva: icons.canva,
  "canva pro": icons.canva,
  dropbox: icons.dropbox,
  medium: icons.medium,
  openai: icons.openai,
  chatgpt: icons.openai,
};

const LOGO_DEV_KEY = process.env.EXPO_PUBLIC_LOGO_DEV_KEY ?? "";

function resolveIcon(name: string): ImageSourcePropType {
  const lower = name.trim().toLowerCase();

  // 1. Local bundled asset — exact match
  if (LOCAL_ICON_MAP[lower]) return LOCAL_ICON_MAP[lower];

  // 2. Local bundled asset — partial match (e.g. "Adobe Creative Cloud" → adobe)
  for (const key of Object.keys(LOCAL_ICON_MAP)) {
    if (lower.includes(key)) return LOCAL_ICON_MAP[key];
  }

  // 3. logo.dev fallback — derive domain from first alphanumeric word
  const firstWord = lower.split(/\s+/)[0].replace(/[^a-z0-9]/g, "");
  const domain = `${firstWord}.com`;
  return {
    uri: `https://img.logo.dev/${domain}?token=${LOGO_DEV_KEY}&format=png&size=128`,
  };
}

// ─── constants ────────────────────────────────────────────────────────────────

const COLOR_SWATCHES = [
  "#f5c542",
  "#ea7a53",
  "#e8def8",
  "#b8d4e3",
  "#b8e8d0",
  "#8fd1bd",
  "#ffd6cc",
  "#d4a5c9",
  "#a8d8a8",
  "#c9d4f5",
  "#3D405B",
  "#F2CC8F",
  "#E07A5F",
  "#81B622",
  "#F4F1DE",
];

const CATEGORIES = [
  "AI Tools",
  "Entertainment",
  "Gaming",
  "Productivity",
  "Design",
  "Developer Tools",
  "Finance",
  "Health",
  "Education",
  "Music",
  "Streaming",
  "Storage",
  "News",
  "Social",
  "Other",
];

type Frequency = "Monthly" | "Yearly";
type Status = "active" | "paused" | "cancelled";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
];

// ─── component ────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CreateSubscriptionModal({ visible, onClose }: Props) {
  const { addSubscription } = useSubscriptions();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [category, setCategory] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState<Status>("active");
  const [errors, setErrors] = useState<{
    name?: string;
    price?: string;
    startDate?: string;
  }>({});

  function reset() {
    setName("");
    setPrice("");
    setColor(COLOR_SWATCHES[0]);
    setFrequency("Monthly");
    setCategory(null);
    setStartDate("");
    setPaymentMethod("");
    setStatus("active");
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    const errs: typeof errors = {};

    if (!name.trim()) errs.name = "Name is required.";

    const parsed = parseFloat(price);
    if (!price) errs.price = "Price is required.";
    else if (isNaN(parsed) || parsed <= 0) errs.price = "Enter a valid price.";

    let resolvedStart = dayjs();
    if (startDate.trim()) {
      const parsed = dayjs(startDate.trim(), "MM/DD/YYYY", true);
      if (!parsed.isValid()) errs.startDate = "Use MM/DD/YYYY format.";
      else resolvedStart = parsed;
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const renewalDate =
      frequency === "Monthly"
        ? resolvedStart.add(1, "month").toISOString()
        : resolvedStart.add(1, "year").toISOString();

    const sub: Subscription = {
      id: `custom-${Date.now()}`,
      icon: resolveIcon(name),
      name: name.trim(),
      price: parseFloat(price),
      currency: "USD",
      billing: frequency,
      color,
      category: category ?? undefined,
      status,
      startDate: resolvedStart.toISOString(),
      renewalDate,
      paymentMethod: paymentMethod.trim() || undefined,
    };

    addSubscription(sub);
    reset();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Overlay — tap to dismiss */}
      <Pressable className="modal-overlay" onPress={handleClose}>
        {/* Inner pressable stops propagation so sheet taps don't close */}
        <Pressable onPress={(e) => e.stopPropagation()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View className="modal-container">
              {/* ── header ── */}
              <View className="modal-header">
                <Text className="modal-title">New Subscription</Text>
                <Pressable
                  className="modal-close"
                  onPress={handleClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                >
                  <Ionicons name="close" size={18} color={colors.primary} />
                </Pressable>
              </View>

              {/* ── scrollable body ── */}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
              >
                <View className="modal-body">

                  {/* ── Name ── */}
                  <View className="auth-field">
                    <Text className="auth-label">Name</Text>
                    <TextInput
                      className={clsx("auth-input", errors.name && "auth-input-error")}
                      value={name}
                      onChangeText={(v) => {
                        setName(v);
                        if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                      }}
                      placeholder="e.g. Netflix, Spotify…"
                      placeholderTextColor={colors.mutedForeground}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                    />
                    {errors.name && <Text className="auth-error">{errors.name}</Text>}
                  </View>

                  {/* ── Price ── */}
                  <View className="auth-field">
                    <Text className="auth-label">Price (USD)</Text>
                    <TextInput
                      className={clsx("auth-input", errors.price && "auth-input-error")}
                      value={price}
                      onChangeText={(v) => {
                        setPrice(v);
                        if (errors.price) setErrors((p) => ({ ...p, price: undefined }));
                      }}
                      placeholder="0.00"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                    />
                    {errors.price && <Text className="auth-error">{errors.price}</Text>}
                  </View>

                  {/* ── Start Date ── */}
                  <View className="auth-field">
                    <Text className="auth-label">Start Date</Text>
                    <TextInput
                      className={clsx("auth-input", errors.startDate && "auth-input-error")}
                      value={startDate}
                      onChangeText={(v) => {
                        setStartDate(v);
                        if (errors.startDate) setErrors((p) => ({ ...p, startDate: undefined }));
                      }}
                      placeholder="MM/DD/YYYY  (leave blank for today)"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numbers-and-punctuation"
                      returnKeyType="next"
                      maxLength={10}
                    />
                    {errors.startDate
                      ? <Text className="auth-error">{errors.startDate}</Text>
                      : <Text className="auth-helper">When did this subscription start?</Text>
                    }
                  </View>

                  {/* ── Payment Method ── */}
                  <View className="auth-field">
                    <Text className="auth-label">Payment Method</Text>
                    <TextInput
                      className="auth-input"
                      value={paymentMethod}
                      onChangeText={setPaymentMethod}
                      placeholder="e.g. Visa ending in 4242"
                      placeholderTextColor={colors.mutedForeground}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="done"
                    />
                  </View>

                  {/* ── Status ── */}
                  <View className="auth-field">
                    <Text className="auth-label">Status</Text>
                    <View className="picker-row">
                      {STATUS_OPTIONS.map((opt) => (
                        <Pressable
                          key={opt.value}
                          className={clsx(
                            "picker-option",
                            status === opt.value && "picker-option-active"
                          )}
                          onPress={() => setStatus(opt.value)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: status === opt.value }}
                        >
                          <Text
                            className={clsx(
                              "picker-option-text",
                              status === opt.value && "picker-option-text-active"
                            )}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* ── Billing Frequency ── */}
                  <View className="auth-field">
                    <Text className="auth-label">Billing Frequency</Text>
                    <View className="picker-row">
                      {(["Monthly", "Yearly"] as Frequency[]).map((opt) => (
                        <Pressable
                          key={opt}
                          className={clsx(
                            "picker-option",
                            frequency === opt && "picker-option-active"
                          )}
                          onPress={() => setFrequency(opt)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: frequency === opt }}
                        >
                          <Text
                            className={clsx(
                              "picker-option-text",
                              frequency === opt && "picker-option-text-active"
                            )}
                          >
                            {opt}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* ── Color Swatches ── */}
                  <View className="auth-field">
                    <Text className="auth-label">Color</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
                      {COLOR_SWATCHES.map((swatch) => (
                        <Pressable
                          key={swatch}
                          onPress={() => setColor(swatch)}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: swatch,
                            borderWidth: color === swatch ? 3 : 1.5,
                            borderColor: color === swatch ? colors.primary : "rgba(0,0,0,0.12)",
                          }}
                          accessibilityRole="radio"
                          accessibilityLabel={`Color ${swatch}`}
                          accessibilityState={{ selected: color === swatch }}
                        />
                      ))}
                    </View>
                  </View>

                  {/* ── Category Chips ── */}
                  <View className="auth-field">
                    <Text className="auth-label">Category</Text>
                    <View className="category-scroll">
                      {CATEGORIES.map((cat) => (
                        <Pressable
                          key={cat}
                          className={clsx(
                            "category-chip",
                            category === cat && "category-chip-active"
                          )}
                          onPress={() => setCategory((curr) => (curr === cat ? null : cat))}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: category === cat }}
                        >
                          <Text
                            className={clsx(
                              "category-chip-text",
                              category === cat && "category-chip-text-active"
                            )}
                          >
                            {cat}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* ── Live Preview ── */}
                  {!!name.trim() && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        padding: 16,
                        borderRadius: 16,
                        backgroundColor: color,
                        borderWidth: 1,
                        borderColor: "rgba(0,0,0,0.08)",
                      }}
                    >
                      <Image
                        source={resolveIcon(name)}
                        style={{ width: 48, height: 48, borderRadius: 10 }}
                        resizeMode="contain"
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 16, fontFamily: "sans-bold", color: colors.primary }}
                          numberOfLines={1}
                        >
                          {name}
                        </Text>
                        {!!category && (
                          <Text
                            style={{
                              fontSize: 13,
                              fontFamily: "sans-medium",
                              color: colors.mutedForeground,
                              marginTop: 2,
                            }}
                          >
                            {category}
                          </Text>
                        )}
                      </View>
                      <Text style={{ fontSize: 16, fontFamily: "sans-bold", color: colors.primary }}>
                        ${parseFloat(price || "0").toFixed(2)}
                      </Text>
                    </View>
                  )}

                  {/* ── Submit ── */}
                  <Pressable
                    className="auth-button"
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                    onPress={handleSubmit}
                    accessibilityRole="button"
                    accessibilityLabel="Add subscription"
                  >
                    <Text className="auth-button-text">Add Subscription</Text>
                  </Pressable>

                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
