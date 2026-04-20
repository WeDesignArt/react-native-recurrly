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

/** Map of lowercase name fragments → local bundled icon assets */
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

/**
 * Given a subscription name, return the best icon:
 *   1. Check local asset map (exact or partial match).
 *   2. Fall back to Clearbit Logo API using the first word as the domain.
 */
function resolveIcon(name: string): ImageSourcePropType {
  const lower = name.trim().toLowerCase();

  // exact match
  if (LOCAL_ICON_MAP[lower]) return LOCAL_ICON_MAP[lower];

  // partial match — check if any known key is a substring of the name
  for (const key of Object.keys(LOCAL_ICON_MAP)) {
    if (lower.includes(key)) return LOCAL_ICON_MAP[key];
  }

  // Clearbit fallback: derive domain from the first alphanumeric word
  const firstWord = lower
    .split(/\s+/)[0]
    .replace(/[^a-z0-9]/g, "");
  const domain = `${firstWord}.com`;
  return { uri: `https://logo.clearbit.com/${domain}?size=128` };
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
];

const CATEGORIES = [
  "Productivity",
  "Design",
  "Entertainment",
  "Developer Tools",
  "AI Tools",
  "Finance",
  "Health",
  "Education",
  "Other",
];

type Frequency = "Monthly" | "Yearly";

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
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  function reset() {
    setName("");
    setPrice("");
    setColor(COLOR_SWATCHES[0]);
    setFrequency("Monthly");
    setCategory(null);
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

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const now = dayjs();
    const renewalDate =
      frequency === "Monthly"
        ? now.add(1, "month").toISOString()
        : now.add(1, "year").toISOString();

    const sub: Subscription = {
      id: `custom-${Date.now()}`,
      icon: resolveIcon(name),
      name: name.trim(),
      price: parsed,
      currency: "USD",
      billing: frequency,
      color,
      category: category ?? undefined,
      status: "active",
      startDate: now.toISOString(),
      renewalDate,
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
      {/* Tap overlay to dismiss */}
      <Pressable className="modal-overlay" onPress={handleClose}>
        {/* Stop propagation so taps inside the sheet don't dismiss */}
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
                  {/* Name */}
                  <View className="auth-field">
                    <Text className="auth-label">Name</Text>
                    <TextInput
                      className={clsx(
                        "auth-input",
                        errors.name && "auth-input-error"
                      )}
                      value={name}
                      onChangeText={(v) => {
                        setName(v);
                        if (errors.name)
                          setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="e.g. Netflix, Spotify…"
                      placeholderTextColor={colors.mutedForeground}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                    />
                    {errors.name && (
                      <Text className="auth-error">{errors.name}</Text>
                    )}
                  </View>

                  {/* Price */}
                  <View className="auth-field">
                    <Text className="auth-label">Price (USD)</Text>
                    <TextInput
                      className={clsx(
                        "auth-input",
                        errors.price && "auth-input-error"
                      )}
                      value={price}
                      onChangeText={(v) => {
                        setPrice(v);
                        if (errors.price)
                          setErrors((prev) => ({ ...prev, price: undefined }));
                      }}
                      placeholder="0.00"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                    />
                    {errors.price && (
                      <Text className="auth-error">{errors.price}</Text>
                    )}
                  </View>

                  {/* Color swatches */}
                  <View className="auth-field">
                    <Text className="auth-label">Color</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 10,
                        marginTop: 4,
                      }}
                    >
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
                            borderColor:
                              color === swatch
                                ? colors.primary
                                : "rgba(0,0,0,0.12)",
                          }}
                          accessibilityRole="radio"
                          accessibilityLabel={`Color ${swatch}`}
                          accessibilityState={{ selected: color === swatch }}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Frequency */}
                  <View className="auth-field">
                    <Text className="auth-label">Billing frequency</Text>
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

                  {/* Category chips */}
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
                          onPress={() =>
                            setCategory((curr) =>
                              curr === cat ? null : cat
                            )
                          }
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

                  {/* Preview */}
                  {!!name.trim() && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        padding: 16,
                        borderRadius: 16,
                        backgroundColor: color,
                      }}
                    >
                      <Image
                        source={resolveIcon(name)}
                        style={{ width: 48, height: 48, borderRadius: 10 }}
                        resizeMode="contain"
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontFamily: "sans-bold",
                            color: colors.primary,
                          }}
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
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: "sans-bold",
                          color: colors.primary,
                        }}
                      >
                        ${parseFloat(price || "0").toFixed(2)}
                      </Text>
                    </View>
                  )}

                  {/* Submit */}
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
