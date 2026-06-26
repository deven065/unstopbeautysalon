"use client";

import Image from "next/image";
import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { animate, stagger, type JSAnimation } from "animejs";
import type { AuthUser } from "@/app/lib/auth";
import type { Salon, ServiceCategory } from "@/app/lib/marketplace-data";

// The city can be changed here if the buildathon entry pivots to another market.
const CITY_NAME = "Mumbai";
const SALONS_PER_PAGE = 9;
const BRAND_NAME = "GlowNest";
const BRAND_TAGLINE = "Beauty booked beautifully.";

const imageAssets = {
  hero: "/images/salon-hero-professional.webp",
  discovery: "/images/salon-discovery-professional.webp",
  aiMatch: "/images/salon-ai-match-professional.webp",
  booking: "/images/salon-booking-professional.webp",
};

const budgetOptions = [
  { value: "1000", label: "Under Rs. 1,000" },
  { value: "2500", label: "Under Rs. 2,500" },
  { value: "6000", label: "Under Rs. 6,000" },
  { value: "12000", label: "Under Rs. 12,000" },
];

const sortOptions = [
  { value: "ai", label: "AI match" },
  { value: "rating", label: "Rating" },
  { value: "price", label: "Price" },
  { value: "distance", label: "Distance" },
];

const needPresets = [
  {
    id: "fast",
    label: "Need it today",
    detail: "Prioritize nearby, quick-response salons with lower entry prices.",
    service: "Any service",
    budget: 2500,
    homeVisit: false,
    sortBy: "distance",
  },
  {
    id: "home",
    label: "At-home service",
    detail: "Show salons that can come home for facials, nails or prep.",
    service: "Any service",
    budget: 6000,
    homeVisit: true,
    sortBy: "ai",
  },
  {
    id: "bridal",
    label: "Bridal planning",
    detail: "Find trial-ready salons and quote-friendly bridal teams.",
    service: "Bridal Beauty",
    budget: 12000,
    homeVisit: false,
    sortBy: "ai",
  },
  {
    id: "budget",
    label: "Under Rs. 1,000",
    detail: "Surface value picks for grooming, cleanups and basics.",
    service: "Any service",
    budget: 1000,
    homeVisit: false,
    sortBy: "price",
  },
];

// AI copy is displayed beside the live recommendation result.
const aiHighlights = [
  "Scores salons by service fit, distance, budget, occasion, availability and trust.",
  "Creates instant bridal and group quote requests with structured customer context.",
  "Persists shortlist and booking confirmations locally for a complete MVP demo.",
];

// The visual moments reuse the generated salon asset with different crops and depths.
const visualMoments = [
  {
    title: "Discover polished salon spaces",
    copy: "A calm way to compare ambience, hygiene and service fit before booking.",
    image: imageAssets.discovery,
    position: "left center",
    speed: -0.035,
    tone: "bg-[#fce4ec]",
  },
  {
    title: "Match the right beauty goal",
    copy: "AI highlights bridal, skin, hair and nail options based on customer intent.",
    image: imageAssets.aiMatch,
    position: "center center",
    speed: -0.06,
    tone: "bg-[#e8f6f1]",
  },
  {
    title: "Move from shortlist to slot",
    copy: "Customers can save choices, request quotes and confirm appointment details.",
    image: imageAssets.booking,
    position: "right center",
    speed: -0.025,
    tone: "bg-[#f2edfb]",
  },
];

type PaginationItem = number | "ellipsis";

type GeoPoint = {
  lat: number;
  lng: number;
};

type Booking = {
  id: string;
  requestStatus?: string;
  salonId: string;
  salonName: string;
  customerName: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  service: string;
  notes: string;
  type: "booking" | "quote" | "callback";
  createdAt: string;
  amountPaid?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
};

type ModalMode = "booking" | "quote" | "callback";

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  keyId: string;
  error?: string;
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type SavedCustomerRequestResponse = {
  id?: string;
  status?: string;
  createdAt?: string;
  error?: string;
};

type RazorpayFailureResponse = {
  error?: {
    description?: string;
  };
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    salonName: string;
    service: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: {
    ondismiss: () => void;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
      on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
    };
  }
}

type IconName =
  | "calendar"
  | "check"
  | "heart"
  | "map"
  | "phone"
  | "search"
  | "spark"
  | "star"
  | "user"
  | "x";

// Shared SVG icon component avoids extra dependencies and keeps the UI consistent.
function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const paths = {
    calendar: (
      <>
        <path d="M7 3v3M17 3v3M4.5 9.5h15" />
        <path d="M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z" />
      </>
    ),
    check: <path d="m4.5 12.5 4.7 4.7L19.5 6.8" />,
    heart: (
      <path d="M20.3 5.7a5.1 5.1 0 0 0-7.2 0L12 6.8l-1.1-1.1a5.1 5.1 0 0 0-7.2 7.2L12 21.2l8.3-8.3a5.1 5.1 0 0 0 0-7.2Z" />
    ),
    map: (
      <>
        <path d="M12 21s6-5.1 6-11a6 6 0 0 0-12 0c0 5.9 6 11 6 11Z" />
        <path d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      </>
    ),
    phone: <path d="M6.6 3.8 4.4 6c-.6.6-.7 1.5-.3 2.2 2.2 4.7 6 8.5 10.7 10.7.8.4 1.6.2 2.2-.3l2.2-2.2-4.1-4.1-1.7 1.7c-1.8-.9-3.3-2.4-4.2-4.2l1.7-1.7-4.3-4.3Z" />,
    search: (
      <>
        <path d="m20 20-4.2-4.2" />
        <path d="M10.8 17.1a6.3 6.3 0 1 0 0-12.6 6.3 6.3 0 0 0 0 12.6Z" />
      </>
    ),
    spark: (
      <>
        <path d="M12 2.5 14.1 9l6.4 2.1-6.4 2.1L12 19.5l-2.1-6.3-6.4-2.1L9.9 9 12 2.5Z" />
        <path d="m18 16 .8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8L18 16Z" />
      </>
    ),
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
    user: (
      <>
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    x: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 44 44"
    >
      <rect
        height="44"
        rx="12"
        width="44"
        fill="#6e3038"
      />
      <rect
        height="42"
        rx="11"
        width="42"
        x="1"
        y="1"
        stroke="#f7d7dd"
        strokeOpacity="0.42"
      />
      <path
        d="M29.2 17.2a8.8 8.8 0 1 0 1.3 8.7h-7.1"
        stroke="#fffdfb"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M15.2 23.8c4.7-.1 8.4-3 9.5-7.7"
        stroke="#f4c8d0"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="m31.3 9.2.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6Z"
        fill="#f8dfe4"
      />
    </svg>
  );
}

type DropdownOption = {
  value: string;
  label: string;
};

function ProfessionalSelect({
  ariaLabel,
  className = "",
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  className?: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  value: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      className={`app-select ${className}`}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Currency formatting keeps all prices consistent across cards and summaries.
function formatPrice(price: number) {
  return `Rs. ${price.toLocaleString("en-IN")}`;
}

// Razorpay Checkout is loaded only when a customer confirms a paid booking.
function loadRazorpayCheckout() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById("razorpay-checkout-js");

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Scroll-linked transforms give image layers different visual depths.
function parallaxTransform(scrollY: number, speed: number, base = "") {
  const translateY = Math.round(Math.max(-220, Math.min(220, scrollY * speed)));
  const transform = `${base} translate3d(0, ${translateY}px, 0)`.trim();

  return { transform } as CSSProperties;
}

function scroll3dTransform(scrollY: number, index: number, intensity = 1, base = "") {
  const phase = scrollY * 0.006 + index * 0.72;
  const rotateX = Math.sin(phase) * 3.2 * intensity;
  const rotateY = Math.cos(phase) * 5.2 * intensity;
  const translateY = Math.sin(phase * 0.8) * 10 * intensity;
  const translateZ = Math.cos(phase) * 18 * intensity;
  const transform = [
    base,
    "perspective(1000px)",
    `translate3d(0, ${translateY.toFixed(1)}px, ${translateZ.toFixed(1)}px)`,
    `rotateX(${rotateX.toFixed(2)}deg)`,
    `rotateY(${rotateY.toFixed(2)}deg)`,
  ]
    .filter(Boolean)
    .join(" ");

  return { transform } as CSSProperties;
}

// Haversine distance keeps location matching fully client-side and deploy-safe.
function distanceBetweenKm(first: GeoPoint, second: GeoPoint) {
  const earthRadiusKm = 6371;
  const latDelta = ((second.lat - first.lat) * Math.PI) / 180;
  const lngDelta = ((second.lng - first.lng) * Math.PI) / 180;
  const firstLat = (first.lat * Math.PI) / 180;
  const secondLat = (second.lat * Math.PI) / 180;

  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

// Fallback distances preserve a complete demo if location permission is denied.
function getSalonDistance(salon: Salon, userLocation: GeoPoint | null) {
  return userLocation ? distanceBetweenKm(userLocation, salon.coords) : salon.distanceKm;
}

// Browser coordinates are mapped to the closest marketplace area.
function findNearestSalon(userLocation: GeoPoint, inventory: Salon[]) {
  return [...inventory].sort(
    (first, second) =>
      distanceBetweenKm(userLocation, first.coords) - distanceBetweenKm(userLocation, second.coords),
  )[0];
}

// Stored demo state is parsed defensively because users can edit localStorage.
function readStoredValue<T>(key: string, fallback: T) {
  if (typeof window === "undefined") return fallback;

  try {
    const savedValue = window.localStorage.getItem(key);
    return savedValue ? (JSON.parse(savedValue) as T) : fallback;
  } catch {
    return fallback;
  }
}

// AI scoring is intentionally transparent so judges can understand the logic.
function scoreSalon(
  salon: Salon,
  service: string,
  budget: number,
  needHomeVisit: boolean,
  userLocation: GeoPoint | null,
) {
  let score = 45;
  const distanceKm = getSalonDistance(salon, userLocation);

  if (service === "Any service" || salon.categories.includes(service)) score += 22;
  if (salon.basePrice <= budget) score += 12;
  if (needHomeVisit && salon.homeVisit) score += 10;
  if (!needHomeVisit) score += 4;

  score += Math.round((salon.rating - 4) * 10);
  score += Math.max(0, 10 - Math.round(distanceKm));
  score += Math.max(0, 8 - Math.round(salon.responseMins / 5));
  score += Math.round((salon.hygieneScore - 90) / 2);

  return Math.min(99, Math.max(55, score));
}

function getMatchReasons(
  salon: Salon,
  service: string,
  budget: number,
  needHomeVisit: boolean,
  userLocation: GeoPoint | null,
) {
  const distanceKm = getSalonDistance(salon, userLocation);
  const reasons: string[] = [];

  if (service !== "Any service" && salon.categories.includes(service)) {
    reasons.push(`${service} specialist`);
  }

  if (salon.basePrice <= budget) {
    reasons.push(`Fits ${formatPrice(budget)} budget`);
  }

  if (needHomeVisit && salon.homeVisit) {
    reasons.push("Home visit available");
  }

  if (salon.responseMins <= 15) {
    reasons.push(`${salon.responseMins} min response`);
  }

  if (salon.hygieneScore >= 96) {
    reasons.push(`${salon.hygieneScore}% hygiene`);
  }

  if (distanceKm <= 3) {
    reasons.push(`${distanceKm.toFixed(1)} km away`);
  }

  if (salon.rating >= 4.8) {
    reasons.push(`${salon.rating}/5 rating`);
  }

  if (reasons.length === 0) {
    reasons.push("Balanced price, trust and availability");
  }

  return reasons.slice(0, 3);
}

function getPaginationItems(currentPage: number, totalPages: number) {
  const pages: PaginationItem[] = [];

  for (let page = 1; page <= totalPages; page += 1) {
    const shouldShowPage =
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1 ||
      (currentPage <= 3 && page <= 4) ||
      (currentPage >= totalPages - 2 && page >= totalPages - 3);

    if (!shouldShowPage) continue;

    if (pages.length > 0 && page - Number(pages[pages.length - 1]) > 1) {
      pages.push("ellipsis");
    }

    pages.push(page);
  }

  return pages;
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isValidPhoneInput(value: string) {
  return /^[+\d][+\d\s().-]{6,24}$/.test(value.trim());
}

function isValidOptionalEmailInput(value: string) {
  return !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type SalonMarketplaceProps = {
  authError?: string;
  authUser: AuthUser | null;
  serviceCategories: ServiceCategory[];
  salons: Salon[];
};

export default function SalonMarketplace({
  authError,
  authUser,
  serviceCategories,
  salons,
}: SalonMarketplaceProps) {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [today, setToday] = useState(() => getTodayIso());

  // Search state controls the hero form and the live marketplace filters.
  const [area, setArea] = useState("Bandra West");
  const [service, setService] = useState("Bridal Beauty");
  const [date, setDate] = useState(() => getTodayIso());
  const [budget, setBudget] = useState(6000);
  const [needHomeVisit, setNeedHomeVisit] = useState(false);
  const [sortBy, setSortBy] = useState("ai");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeNeed, setActiveNeed] = useState(needPresets[2].id);
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(
    "Tap Near me to rank salons by your current location.",
  );

  // Product state makes the prototype behave like a real marketplace demo.
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [activeSalon, setActiveSalon] = useState<Salon | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("booking");
  const [statusMessage, setStatusMessage] = useState("Ready to match you with verified salons.");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const authMessage = authError || "";

  // Form state is shared by booking, quote and callback actions.
  const [customerName, setCustomerName] = useState(authUser?.name || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(authUser?.email || "");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");

  const serviceOptions = useMemo(
    () => [
      { value: "Any service", label: "Any service" },
      ...serviceCategories.map((category) => ({ value: category.slug, label: category.slug })),
    ],
    [serviceCategories],
  );
  const quickStats = useMemo(
    () => [
      { value: `${salons.length * 40}+`, label: "verified salon partners" },
      { value: "18 min", label: "average response time" },
      { value: "4.8/5", label: "city trust score" },
    ],
    [salons.length],
  );

  // Request browser location and map it to the nearest salon area in the inventory.
  const requestLocation = useCallback((automatic = false) => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("Location is not supported in this browser. You can type your area.");
      return;
    }

    if (!window.isSecureContext) {
      setLocationStatus("Location needs HTTPS or localhost. You can type your area.");
      return;
    }

    setIsLocating(true);
    setLocationStatus(
      automatic
        ? "Waiting for browser location permission..."
        : "Checking your current location...",
    );

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detectedLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const nearestSalon = findNearestSalon(detectedLocation, salons);

        if (!nearestSalon) {
          setIsLocating(false);
          setLocationStatus("No active salons are available in the database yet.");
          return;
        }

        const nearestDistance = getSalonDistance(nearestSalon, detectedLocation).toFixed(1);

        setUserLocation(detectedLocation);
        setArea(nearestSalon.area);
        setSortBy("distance");
        setActiveNeed("fast");
        setCurrentPage(1);
        setIsLocating(false);
        setLocationStatus(
          `Location detected. Showing salons nearest to ${nearestSalon.area} (${nearestDistance} km away).`,
        );
        setStatusMessage(
          `Using your live location to rank ${CITY_NAME} salons by distance and AI fit.`,
        );
      },
      (error) => {
        setIsLocating(false);
        setLocationStatus(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Type your area or try the button again."
            : "Could not detect location right now. Type your area to continue.",
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000 * 60 * 5,
        timeout: 10000,
      },
    );
  }, [salons]);

  // Update one scroll value per animation frame for the parallax image layers.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    let frameId = 0;

    const updateParallax = () => {
      frameId = 0;
      setScrollY(window.scrollY);
    };

    const queueUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateParallax);
    };

    queueUpdate();
    window.addEventListener("scroll", queueUpdate, { passive: true });

    return () => {
      window.removeEventListener("scroll", queueUpdate);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  // Refresh date bounds after hydration so stale static HTML cannot keep past dates selectable.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const currentToday = getTodayIso();
      setToday(currentToday);
      setDate((currentDate) => (currentDate < currentToday ? currentToday : currentDate));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  // Restore persisted demo state after hydration to avoid server/client mismatches.
  useEffect(() => {
    const restoreState = window.setTimeout(() => {
      setShortlist(readStoredValue<string[]>("glownest-shortlist", []));
      setBookings(readStoredValue<Booking[]>("glownest-bookings", []));
      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(restoreState);
  }, []);

  // Save shortlist changes after every user action.
  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem("glownest-shortlist", JSON.stringify(shortlist));
  }, [shortlist, storageReady]);
  // Save booking and quote history after every confirmed request.
  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem("glownest-bookings", JSON.stringify(bookings));
  }, [bookings, storageReady]);

  // The filtered result set responds to search, filters and sort order.
  const filteredSalons = useMemo(() => {
    const normalizedArea = area.trim().toLowerCase();
    const normalizedQuery = query.trim().toLowerCase();
    const hasSearchQuery = normalizedQuery.length > 0;

    const matches = salons.filter((salon) => {
      const searchableText = [
        salon.name,
        salon.area,
        CITY_NAME,
        salon.specialty,
        ...salon.categories,
        ...salon.tags,
      ]
        .join(" ")
        .toLowerCase();
      const matchesService =
        hasSearchQuery || service === "Any service" || salon.categories.includes(service);
      const matchesArea =
        hasSearchQuery ||
        Boolean(userLocation) ||
        !normalizedArea ||
        salon.area.toLowerCase().includes(normalizedArea.replace(", mumbai", "")) ||
        `${salon.area} ${CITY_NAME}`.toLowerCase().includes(normalizedArea);
      const matchesBudget = salon.basePrice <= budget;
      const matchesHomeVisit = !needHomeVisit || salon.homeVisit;
      const matchesQuery = !hasSearchQuery || searchableText.includes(normalizedQuery);

      return matchesService && matchesArea && matchesBudget && matchesHomeVisit && matchesQuery;
    });

    return [...matches].sort((first, second) => {
      if (sortBy === "rating") return second.rating - first.rating;
      if (sortBy === "price") return first.basePrice - second.basePrice;
      if (sortBy === "distance")
        return getSalonDistance(first, userLocation) - getSalonDistance(second, userLocation);

      return (
        scoreSalon(second, service, budget, needHomeVisit, userLocation) -
        scoreSalon(first, service, budget, needHomeVisit, userLocation)
      );
    });
  }, [area, budget, needHomeVisit, query, salons, service, sortBy, userLocation]);

  const totalPages = Math.max(1, Math.ceil(filteredSalons.length / SALONS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * SALONS_PER_PAGE;
  const pageEndIndex = Math.min(pageStartIndex + SALONS_PER_PAGE, filteredSalons.length);
  const paginatedSalons = useMemo(
    () => filteredSalons.slice(pageStartIndex, pageEndIndex),
    [filteredSalons, pageEndIndex, pageStartIndex],
  );
  const paginationItems = useMemo(
    () => getPaginationItems(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages],
  );

  // The top match updates as filters change, powering the AI recommendation panel.
  const bestMatch = filteredSalons[0] ?? salons[0];
  const bestMatchScore = scoreSalon(bestMatch, service, budget, needHomeVisit, userLocation);
  const bestMatchDistance = getSalonDistance(bestMatch, userLocation);
  const bestMatchReasons = getMatchReasons(bestMatch, service, budget, needHomeVisit, userLocation);

  const cardsAnimRef = useRef<JSAnimation | null>(null);

  // 1. Hero Entrance & Count-up Stats & Nav Entrance
  useEffect(() => {
    // Nav elements entrance
    animate("header nav > *", {
      translateY: [10, 0],
      opacity: [0, 1],
      easing: "easeOutQuart",
      duration: 800,
      delay: stagger(100),
    });

    // Hero content entrance
    animate(".hero-entrance-el", {
      translateY: [24, 0],
      opacity: [0, 1],
      easing: "cubicBezier(0.22, 1, 0.36, 1)",
      duration: 900,
      delay: stagger(100, { start: 150 }),
    });

    // Aside card entrance
    animate(".hero-aside-el", {
      translateX: [40, 0],
      opacity: [0, 1],
      scale: [0.96, 1],
      easing: "easeOutBack",
      duration: 1000,
      delay: 550,
    });

  }, []);

  // 2. Intersection Observers for Category Cards, Visual Moments, and AI Highlights
  useEffect(() => {
    const observerOptions = { threshold: 0.1 };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const className = entry.target.className;
          if (className.includes("categories-container")) {
            animate(".category-card-el", {
              translateY: [24, 0],
              opacity: [0, 1],
              scale: [0.97, 1],
              easing: "easeOutQuart",
              duration: 700,
              delay: stagger(80),
            });
          } else if (className.includes("visual-moments-container")) {
            animate(".visual-moment-el", {
              translateY: [30, 0],
              opacity: [0, 1],
              scale: [0.97, 1],
              easing: "easeOutQuart",
              duration: 800,
              delay: stagger(100),
            });
          } else if (className.includes("ai-highlights-container")) {
            animate(".ai-highlight-el", {
              translateX: [24, 0],
              opacity: [0, 1],
              easing: "easeOutQuart",
              duration: 600,
              delay: stagger(80),
            });
          }
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const categoriesTarget = document.querySelector(".categories-container");
    const momentsTarget = document.querySelector(".visual-moments-container");
    const highlightsTarget = document.querySelector(".ai-highlights-container");

    if (categoriesTarget) observer.observe(categoriesTarget);
    if (momentsTarget) observer.observe(momentsTarget);
    if (highlightsTarget) observer.observe(highlightsTarget);

    return () => observer.disconnect();
  }, []);

  // 3. Stagger Salon Cards on Filter Updates
  useEffect(() => {
    if (cardsAnimRef.current) {
      cardsAnimRef.current.cancel();
    }
    cardsAnimRef.current = animate(".salon-card-el", {
      translateY: [24, 0],
      opacity: [0, 1],
      scale: [0.97, 1],
      easing: "easeOutQuart",
      duration: 600,
      delay: stagger(60),
    });
  }, [paginatedSalons]);

  // 4. Modal Entrance Animation
  useEffect(() => {
    if (!activeSalon) return;

    const timeoutId = window.setTimeout(() => {
      animate(".modal-backdrop-anime", {
        opacity: [0, 1],
        duration: 250,
        easing: "easeOutQuad",
      });
      animate(".modal-content-anime", {
        translateY: [40, 0],
        scale: [0.95, 1],
        opacity: [0, 1],
        duration: 400,
        easing: "cubicBezier(0.34, 1.56, 0.64, 1)",
      });
    }, 30);

    return () => window.clearTimeout(timeoutId);
  }, [activeSalon]);

  // 5. Best AI Match Badge Pop
  useEffect(() => {
    animate(".best-match-badge-anime", {
      scale: [1, 1.25, 1],
      duration: 500,
      easing: "easeOutBack",
    });
  }, [bestMatchScore]);

  // 6. Wishlist Heart Pop Interaction helper
  const animateHeart = (id: string) => {
    animate(`.heart-icon-${id}`, {
      scale: [1, 1.4, 0.9, 1.1, 1],
      rotate: [0, -10, 10, -5, 0],
      duration: 600,
      easing: "easeInOutBack",
    });
  };


  function goToResultsPage(nextPage: number) {
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages));
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Submit search and scroll to the live results section.
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveNeed("");
    setCurrentPage(1);
    setStatusMessage(
      query.trim()
        ? `Found ${filteredSalons.length} Mumbai salon matches for "${query.trim()}".`
        : `Found ${filteredSalons.length} salon matches for ${service} near ${area}.`,
    );
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Manual typing intentionally turns off live coordinates and uses area text.
  function handleAreaChange(nextArea: string) {
    setArea(nextArea);
    setUserLocation(null);
    setActiveNeed("");
    setCurrentPage(1);
    setLocationStatus("Using typed area. Tap location to rank salons near you automatically.");
  }

  // Category cards behave as shortcuts into the marketplace.
  function chooseCategory(category: string) {
    setService(category);
    setActiveNeed("");
    setCurrentPage(1);
    setStatusMessage(`${category} selected. AI ranking refreshed for your budget and location.`);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function applyNeedPreset(preset: (typeof needPresets)[number]) {
    setActiveNeed(preset.id);
    setService(preset.service);
    setBudget(preset.budget);
    setNeedHomeVisit(preset.homeVisit);
    setSortBy(preset.sortBy);
    setQuery("");
    setCurrentPage(1);

    if (preset.id !== "fast") {
      setUserLocation(null);
      setArea("");
    }

    setStatusMessage(`${preset.label} selected. Filters tuned to solve that booking need.`);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Shortlist actions are persisted and visible in the saved list section.
  function toggleShortlist(salonId: string) {
    setShortlist((current) =>
      current.includes(salonId) ? current.filter((id) => id !== salonId) : [...current, salonId],
    );
  }

  // Open the correct modal and preload the first available slot.
  function openModal(salon: Salon, mode: ModalMode) {
    setActiveSalon(salon);
    setModalMode(mode);
    setSelectedTime(salon.slots[0] ?? "");
    setNotes("");
    setPaymentMessage("");
  }

  // Close the modal after the exit animation so the dialog does not disappear abruptly.
  function closeModal() {
    if (!activeSalon) return;

    const backdrop = document.querySelector(".modal-backdrop-anime");
    const content = document.querySelector(".modal-content-anime");

    if (!backdrop || !content) {
      setActiveSalon(null);
      return;
    }

    animate(".modal-backdrop-anime", {
      opacity: [1, 0],
      duration: 180,
      easing: "easeInQuad",
    });
    animate(".modal-content-anime", {
      translateY: [0, 24],
      scale: [1, 0.97],
      opacity: [1, 0],
      duration: 180,
      easing: "easeInQuad",
      complete: () => setActiveSalon(null),
    });
  }

  // Save verified payments or non-payment requests into Postgres, then mirror them locally.
  async function saveCustomerRequest(
    requestSalon: Salon,
    requestType: ModalMode,
    payment?: { amountPaid: number; orderId: string; paymentId: string },
  ) {
    setPaymentMessage(
      requestType === "booking" ? "Saving confirmed booking..." : "Saving request securely...",
    );

    const saveResponse = await fetch("/api/customer-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salonId: requestSalon.id,
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        date,
        time: selectedTime,
        service,
        notes: notes.trim(),
        type: requestType,
        paymentOrderId: payment?.orderId,
        paymentId: payment?.paymentId,
        amountPaid: payment?.amountPaid,
      }),
    });

    const savedRequest = (await saveResponse.json()) as SavedCustomerRequestResponse;

    if (!saveResponse.ok || savedRequest.error) {
      throw new Error(savedRequest.error || "Could not save request.");
    }

    const newBooking: Booking = {
      id: savedRequest.id || crypto.randomUUID(),
      requestStatus: savedRequest.status,
      salonId: requestSalon.id,
      salonName: requestSalon.name,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      date,
      time: selectedTime,
      service,
      notes: notes.trim(),
      type: requestType,
      createdAt: savedRequest.createdAt || new Date().toISOString(),
      amountPaid: payment?.amountPaid,
      razorpayOrderId: payment?.orderId,
      razorpayPaymentId: payment?.paymentId,
    };

    setBookings((current) => [newBooking, ...current]);
    setStatusMessage(
      requestType === "booking"
        ? `Payment verified. Booking confirmed with ${requestSalon.name} for ${selectedTime}.`
        : requestType === "quote"
          ? `Quote request sent to ${requestSalon.name}.`
          : `Callback request saved for ${requestSalon.name}.`,
    );
    closeModal();
    setPaymentMessage("");
  }

  // Create a Razorpay order, open Checkout and verify the signature on success.
  async function collectRazorpayPayment(requestSalon: Salon) {
    setIsPaying(true);
    setPaymentMessage("Creating secure Razorpay order...");

    const orderResponse = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salonId: requestSalon.id,
        customerName: customerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        service,
      }),
    });

    const order = (await orderResponse.json()) as RazorpayOrderResponse;

    if (!orderResponse.ok || order.error) {
      throw new Error(order.error || "Unable to create Razorpay order.");
    }

    const scriptReady = await loadRazorpayCheckout();

    if (!scriptReady || !window.Razorpay) {
      throw new Error("Razorpay Checkout could not be loaded. Please check your connection.");
    }

    const RazorpayCheckout = window.Razorpay;

    setPaymentMessage("Opening Razorpay Checkout...");

    return new Promise<{ amountPaid: number; orderId: string; paymentId: string }>(
      (resolve, reject) => {
        const checkout = new RazorpayCheckout({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: process.env.NEXT_PUBLIC_SITE_NAME || `${BRAND_NAME} ${CITY_NAME}`,
          description: `${service} at ${requestSalon.name}`,
          order_id: order.id,
          prefill: {
            name: customerName.trim(),
            email: email.trim(),
            contact: phone.trim(),
          },
          notes: {
            salonName: requestSalon.name,
            service,
          },
          theme: {
            color: "#6e3038",
          },
          handler: async (response) => {
            try {
              setPaymentMessage("Verifying payment signature...");

              const verificationResponse = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              });

              const verification = (await verificationResponse.json()) as {
                verified?: boolean;
                error?: string;
              };

              if (!verificationResponse.ok || !verification.verified) {
                throw new Error(verification.error || "Payment verification failed.");
              }

              resolve({
                amountPaid: order.amount / 100,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
              });
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment window closed before completion.")),
          },
        });

        checkout.on("payment.failed", (response) => {
          reject(new Error(response.error?.description || "Razorpay payment failed."));
        });

        checkout.open();
      },
    );
  }

  // Confirm booking, quote, or callback requests into local demo history.
  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const salonToSubmit = activeSalon;
    if (!salonToSubmit || !customerName.trim() || !phone.trim() || !selectedTime) {
      setStatusMessage("Please add your name, phone number and preferred time.");
      return;
    }

    if (!isValidPhoneInput(phone)) {
      setStatusMessage("Please enter a valid phone number.");
      return;
    }

    if (!isValidOptionalEmailInput(email)) {
      setStatusMessage("Please enter a valid email address.");
      return;
    }

    if (date < today) {
      setDate(today);
      setStatusMessage("Please choose today or a future date.");
      return;
    }

    if (modalMode !== "booking") {
      try {
        setIsPaying(true);
        await saveCustomerRequest(salonToSubmit, modalMode);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Request could not be saved.";
        setPaymentMessage(message);
        setStatusMessage(message);
      } finally {
        setIsPaying(false);
      }
      return;
    }

    try {
      const payment = await collectRazorpayPayment(salonToSubmit);
      await saveCustomerRequest(salonToSubmit, "booking", payment);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment could not be completed.";
      setPaymentMessage(message);
      setStatusMessage(message);
    } finally {
      setIsPaying(false);
    }
  }

  // Reset demo state without affecting the source code or browser session.
  function clearDemoData() {
    setShortlist([]);
    setBookings([]);
    setStatusMessage("Demo data cleared. Start a fresh customer journey.");
  }

  useEffect(() => {
    if (!activeSalon) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeSalon]);

  const shortlistedSalons = salons.filter((salon) => shortlist.includes(salon.id));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fff9f7] text-[#2d2525]">
      {/* Header keeps navigation and the main booking action available everywhere. */}
      <header className="sticky top-0 z-50 border-b border-[#eadbd6]/80 bg-[#fff9f7]/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-8">
          <a className="flex min-w-0 items-center gap-3" href="#top" aria-label={`${BRAND_NAME} home`}>
            <BrandMark className="h-9 w-9 shrink-0 drop-shadow-[0_10px_22px_rgba(110,48,56,0.24)] sm:h-10 sm:w-10" />
            <span className="min-w-0">
              <span className="block text-base font-semibold tracking-[0.02em] text-[#6e3038] sm:text-lg">
                {BRAND_NAME}
              </span>
              <span className="block truncate text-xs font-medium text-[#7d6e6b]">
                {BRAND_TAGLINE}
              </span>
            </span>
          </a>

          <div className="hidden items-center gap-7 text-sm font-medium text-[#6f6260] md:flex">
            <a className="transition hover:text-[#6e3038]" href="#services">
              Services
            </a>
            <a className="transition hover:text-[#6e3038]" href="#salons">
              Salons
            </a>
            <a className="transition hover:text-[#6e3038]" href="#ai">
              AI Match
            </a>
            <a className="transition hover:text-[#6e3038]" href="#saved">
              Saved
            </a>
            <a className="transition hover:text-[#6e3038]" href="/admin">
              Admin
            </a>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {authUser ? (
              <>
                {authUser.role === "admin" && (
                  <a
                    className="motion-button hidden h-10 items-center rounded-full border border-[#e7d6d0] bg-white px-3 text-sm font-semibold text-[#6e3038] shadow-sm transition hover:border-[#cdaaa1] sm:inline-flex"
                    href="/admin"
                  >
                    Admin
                  </a>
                )}
                <a
                  aria-label={`Signed in as ${authUser.name}. Sign out`}
                  className="motion-button grid h-10 w-10 place-items-center rounded-full border border-[#e7d6d0] bg-white text-[#6e3038] shadow-sm transition hover:border-[#cdaaa1]"
                  href="/api/auth/logout"
                  title={`Signed in as ${authUser.name}. Sign out`}
                >
                  <Icon name="user" className="h-4 w-4" />
                </a>
              </>
            ) : (
              <a
                className="motion-button inline-flex h-10 items-center gap-2 rounded-full border border-[#e7d6d0] bg-white px-3 text-sm font-semibold text-[#6e3038] shadow-sm transition hover:border-[#cdaaa1]"
                href="/login?returnTo=/"
              >
                <Icon name="user" className="h-4 w-4" />
                <span className="hidden min-[420px]:inline">Sign in</span>
              </a>
            )}
            <button
              className="motion-button inline-flex h-10 items-center gap-2 rounded-full bg-[#2d2525] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6e3038] sm:h-11 sm:px-4"
              onClick={() => openModal(bestMatch, "booking")}
            >
              <Icon name="calendar" className="h-4 w-4" />
              <span className="hidden min-[380px]:inline">Book now</span>
            </button>
          </div>
        </nav>
      </header>

      {authMessage && (
        <section className="border-b border-[#eadbd6] bg-[#fff3ef] px-4 py-3 text-sm font-semibold text-[#8d4a55] sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>{authMessage}</p>
            <a className="underline underline-offset-4" href="/login?returnTo=/">
              Open sign in
            </a>
          </div>
        </section>
      )}

      {/* Hero gives the product a strong startup-style first impression. */}
      <section id="top" className="hero-cinematic relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={imageAssets.hero}
            alt="Premium modern beauty salon interior with warm mirrors and styling chairs"
            fill
            priority
            sizes="100vw"
            className="hero-bg-image parallax-layer object-cover"
            style={parallaxTransform(scrollY, 0.16, "scale(1.08)")}
          />
          <div className="hero-grid-lines absolute inset-0" />
          <div className="hero-light-sweep absolute inset-0" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,249,247,0.98)_0%,rgba(255,249,247,0.92)_42%,rgba(255,249,247,0.62)_70%,rgba(255,249,247,0.28)_100%)]" />
        </div>

        <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl content-center gap-10 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.04fr_0.96fr] lg:py-20">
          <div className="max-w-3xl">
            <p className="hero-entrance-el opacity-0 mb-5 inline-flex rounded-full border border-[#e6cdc6] bg-white/70 px-4 py-2 text-sm font-semibold text-[#8d4a55] shadow-sm">
              {BRAND_TAGLINE}
            </p>
            <h1
              className="hero-entrance-el opacity-0 max-w-4xl text-4xl font-semibold leading-[1.04] text-[#2d2525] sm:text-6xl lg:text-7xl"
            >
              {CITY_NAME} salon bookings, matched to your moment.
            </h1>
            <p
              className="hero-entrance-el opacity-0 mt-6 max-w-2xl text-base leading-7 text-[#665957] sm:text-xl sm:leading-8"
            >
              Search verified salons, compare transparent pricing, shortlist
              favorites, request quotes and confirm demo bookings in one smooth
              marketplace journey.
            </p>

            {/* Search panel is fully functional and drives the results below. */}
            <form
              id="booking"
              className="hero-entrance-el opacity-0 mt-8 grid gap-3 rounded-lg border border-white/80 bg-white/88 p-3 shadow-[0_24px_80px_rgba(110,48,56,0.14)] backdrop-blur lg:grid-cols-[1fr_1fr_auto]"
              onSubmit={handleSearch}
            >
              <label className="motion-input flex min-h-16 items-center gap-3 rounded-lg bg-[#fff3ef] px-4">
                <Icon name="map" className="h-5 w-5 text-[#b86470]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7770]">
                    Area
                  </span>
                  <input
                    className="w-full bg-transparent text-base font-semibold text-[#2d2525] outline-none placeholder:text-[#9c8b86]"
                    onChange={(event) => handleAreaChange(event.target.value)}
                    placeholder="Bandra West"
                    value={area}
                  />
                </span>
              </label>

              <label className="motion-input flex min-h-16 items-center gap-3 rounded-lg bg-[#edf8f3] px-4">
                <Icon name="spark" className="h-5 w-5 text-[#4b8a76]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#6b8a80]">
                    Service
                  </span>
                  <ProfessionalSelect
                    ariaLabel="Select service"
                    className="app-select--hero mt-1 w-full rounded-md text-base font-semibold outline-none"
                    onChange={(nextService) => {
                      setService(nextService);
                      setActiveNeed("");
                      setCurrentPage(1);
                    }}
                    options={serviceOptions}
                    value={service}
                  />
                </span>
              </label>

              <button className="motion-button inline-flex min-h-16 items-center justify-center gap-2 rounded-lg bg-[#2d2525] px-6 font-semibold text-white transition hover:bg-[#6e3038]">
                <Icon name="search" className="h-5 w-5" />
                Search
              </button>
            </form>

            <div
              className="hero-entrance-el opacity-0 mt-3 flex flex-col gap-3 rounded-lg border border-white/80 bg-white/72 p-3 text-sm text-[#6b5d5a] shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="inline-flex items-center gap-2">
                <Icon name="map" className="h-4 w-4 text-[#b86470]" />
                {locationStatus}
              </span>
              <button
                className="motion-button inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#f4c8d0] px-4 font-semibold text-[#6e3038] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLocating}
                onClick={() => requestLocation(false)}
                type="button"
              >
                <Icon name="map" className="h-4 w-4" />
                {isLocating ? "Locating..." : "Use my location"}
              </button>
            </div>

            {/* Stats communicate product traction in a compact way. */}
            <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 min-[480px]:grid-cols-3">
              {quickStats.map((stat, index) => (
                <div
                  className="hero-entrance-el opacity-0 rounded-lg border border-white/80 bg-white/72 p-4 shadow-sm backdrop-blur"
                  key={stat.label}
                >
                  <p id={`stat-val-${index}`} className="text-2xl font-semibold text-[#6e3038]">{stat.value}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[#83716d]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-aside-el opacity-0 relative min-h-[560px] w-full self-center lg:ml-auto lg:w-[470px]">
            <div className="hero-device-card absolute inset-x-0 top-0 h-[320px] overflow-hidden rounded-lg border border-white/80 bg-white shadow-[0_28px_90px_rgba(74,63,60,0.18)]">
              <Image
                src={imageAssets.booking}
                alt="Animated salon booking preview"
                fill
                loading="eager"
                sizes="(min-width: 1024px) 470px, 100vw"
                className="object-cover"
                style={{ objectPosition: "right center" }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(45,37,37,0.02)_0%,rgba(45,37,37,0.48)_100%)]" />
              <div className="hero-card-ticker absolute left-4 right-4 top-4 grid gap-2">
                <span className="inline-flex w-fit rounded-full bg-white/86 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#6e3038]">
                  {CITY_NAME} live
                </span>
                <span className="inline-flex w-fit rounded-full bg-[#e8f6f1]/92 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#356c5c]">
                  {salons.length} salons
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-white/88 p-4 shadow-sm backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9b5963]">
                  Smart recommendation
                </p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <span className="text-2xl font-semibold text-[#2d2525]">{bestMatchScore}%</span>
                  <span className="text-right text-sm font-semibold text-[#356c5c]">
                    {bestMatch.slots[0]} · {formatPrice(bestMatch.basePrice)}
                  </span>
                </div>
              </div>
            </div>

            <div className="hero-orbit-gallery" aria-hidden="true">
              {[
                imageAssets.discovery,
                imageAssets.aiMatch,
                imageAssets.booking,
              ].map((image, index) => (
                <div className={`hero-orbit-frame hero-orbit-frame-${index + 1}`} key={image}>
                  <div className="hero-orbit-image relative">
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="140px"
                      className="object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI match card updates live as search filters change. */}
            <aside className="motion-ai-card hero-match-card absolute inset-x-0 bottom-0 z-10 rounded-lg border border-white/80 bg-white/92 p-5 shadow-[0_28px_90px_rgba(74,63,60,0.18)] backdrop-blur">
              <div className="flex items-start justify-between gap-4 border-b border-[#efe1dc] pb-4">
                <div>
                  <p className="text-sm font-semibold text-[#9b5963]">Best AI match now</p>
                  <h2 className="mt-1 text-2xl font-semibold">{bestMatch.name}</h2>
                  <p className="mt-1 text-sm text-[#776966]">{bestMatch.area}</p>
                </div>
                <span className="best-match-badge-anime rounded-full bg-[#e6f5ed] px-3 py-1 text-sm font-semibold text-[#497461]">
                  {bestMatchScore}%
                </span>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-[#655856]">
                <p className="flex items-center justify-between rounded-lg bg-[#fff3ef] p-4">
                  <span>Next slot</span>
                  <strong className="text-[#6e3038]">{bestMatch.slots[0]}</strong>
                </p>
                <p className="flex items-center justify-between rounded-lg bg-[#edf8f3] p-4">
                  <span>{userLocation ? "Distance" : "Response time"}</span>
                  <strong className="text-[#356c5c]">
                    {userLocation ? `${bestMatchDistance.toFixed(1)} km` : `${bestMatch.responseMins} min`}
                  </strong>
                </p>
                <p className="flex items-center justify-between rounded-lg bg-[#f2edfb] p-4">
                  <span>Starting price</span>
                  <strong className="text-[#635083]">{formatPrice(bestMatch.basePrice)}</strong>
                </p>
              </div>
              <div className="mt-4 rounded-lg bg-[#fff9f7] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9b5963]">
                  Why this solves it
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {bestMatchReasons.map((reason) => (
                    <span
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#6e3038] shadow-sm"
                      key={reason}
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  className="motion-button inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#2d2525] text-sm font-semibold text-white transition hover:bg-[#6e3038]"
                  onClick={() => openModal(bestMatch, "booking")}
                  type="button"
                >
                  <Icon name="calendar" className="h-4 w-4" />
                  Book
                </button>
                <button
                  className="motion-button inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#e7d6d0] bg-white text-sm font-semibold text-[#6e3038] transition hover:bg-[#fff3ef]"
                  onClick={() => {
                    toggleShortlist(bestMatch.id);
                    animateHeart(bestMatch.id);
                  }}
                  type="button"
                >
                  <span className={`heart-icon-${bestMatch.id} inline-block`}>
                    <Icon name="heart" className="h-4 w-4" />
                  </span>
                  {shortlist.includes(bestMatch.id) ? "Saved" : "Save"}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Scroll parallax brings the generated salon visuals to life between product beats. */}
      <section className="overflow-hidden bg-[#fff9f7] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b5963]">
                Visual marketplace
              </p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                Salon discovery that feels alive
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#6b5d5a]">
              Professional salon imagery helps customers inspect ambience,
              consultation quality and booking readiness before they decide.
            </p>
          </div>

          <div className="visual-moments-container mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.1fr_0.95fr]">
            {visualMoments.map((moment, index) => (
              <article
                className="visual-moment-el opacity-0 motion-card scroll-3d-surface overflow-hidden rounded-lg border border-white bg-white shadow-[0_18px_60px_rgba(68,51,47,0.08)]"
                key={moment.title}
                style={scroll3dTransform(scrollY, index + 2, 0.44)}
              >
                <div className="relative h-[260px] overflow-hidden sm:h-[390px]">
                  <Image
                    src={moment.image}
                    alt={moment.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="parallax-layer object-cover"
                    style={{
                      objectPosition: moment.position,
                      ...parallaxTransform(scrollY, moment.speed, "scale(1.18)"),
                    }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(45,37,37,0.02)_0%,rgba(45,37,37,0.42)_100%)]" />
                </div>
                <div className={`${moment.tone} p-5`}>
                  <h3 className="text-xl font-semibold">{moment.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#665957]">{moment.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Service category cards double as shortcuts that update marketplace search. */}
      <section id="services" className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b5963]">
              Browse by need
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Services built for city life
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-[#6b5d5a]">
            Pick a category to refresh the AI results for office touch-ups,
            weekend self-care, wedding prep and at-home convenience.
          </p>
        </div>

        <div className="categories-container mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {serviceCategories.map((category) => (
            <button
              className={`${category.tone} category-card-el opacity-0 motion-card relative rounded-lg border border-white/80 p-6 text-left shadow-sm`}
              key={category.slug}
              onClick={() => chooseCategory(category.slug)}
              type="button"
            >
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-white/70 text-[#6e3038]">
                <Icon name="spark" />
              </span>
              <span className="mt-7 block text-xl font-semibold">{category.name}</span>
              <span className="mt-2 block text-sm leading-6 text-[#675956]">{category.detail}</span>
              <span className="mt-5 block text-sm font-semibold text-[#6e3038]">
                {category.price}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Results section contains filters, sorting and all user actions. */}
      <section id="salons" className="bg-[#f7efec] py-12 sm:py-16" ref={resultsRef}>
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b5963]">
                Live marketplace
              </p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                {filteredSalons.length} salons matched
              </h2>
            </div>
            <p className="motion-scale-in max-w-full break-words rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#6e3038] shadow-sm">
              {statusMessage}
            </p>
          </div>

          <div className="motion-scale-in mt-8 rounded-lg border border-white bg-white/82 p-4 shadow-sm">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b5963]">
                  Problem solver
                </p>
                <h3 className="mt-1 text-xl font-semibold">I need...</h3>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-[#6b5d5a]">
                Pick a real customer situation and GlowNest tunes service, budget, home visit
                preference and sorting in one tap.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {needPresets.map((preset) => (
                <button
                  className={`motion-card relative rounded-lg border p-4 text-left transition ${
                    activeNeed === preset.id
                      ? "border-[#6e3038] bg-[#2d2525] text-white shadow-[0_18px_50px_rgba(45,37,37,0.22)]"
                      : "border-[#eadbd6] bg-white text-[#2d2525] hover:bg-[#fff9f7]"
                  }`}
                  key={preset.id}
                  onClick={() => applyNeedPreset(preset)}
                  type="button"
                >
                  <span className="text-base font-semibold">{preset.label}</span>
                  <span
                    className={`mt-2 block text-sm leading-6 ${
                      activeNeed === preset.id ? "text-[#f5ebe8]" : "text-[#6b5d5a]"
                    }`}
                  >
                    {preset.detail}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter controls are native inputs so they work reliably on mobile. */}
          <div className="motion-scale-in mt-8 grid gap-3 rounded-lg border border-white bg-white/82 p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto]">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7772]">
                Search salons
              </span>
              <input
                className="motion-input mt-2 h-12 w-full rounded-lg border border-[#eadbd6] bg-white px-3 text-sm outline-none"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveNeed("");
                  setCurrentPage(1);
                }}
                placeholder="Salon, area, service or tag"
                value={query}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7772]">
                Date
              </span>
              <input
                className="motion-input mt-2 h-12 w-full rounded-lg border border-[#eadbd6] bg-white px-3 text-sm outline-none"
                min={today}
                onChange={(event) => {
                  setDate(event.target.value);
                  setActiveNeed("");
                  setCurrentPage(1);
                }}
                type="date"
                value={date}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7772]">
                Budget
              </span>
              <ProfessionalSelect
                ariaLabel="Select budget"
                className="motion-input mt-2 h-12 w-full rounded-lg border border-[#eadbd6] px-3 text-sm outline-none"
                onChange={(nextBudget) => {
                  setBudget(Number(nextBudget));
                  setActiveNeed("");
                  setCurrentPage(1);
                }}
                options={budgetOptions}
                value={String(budget)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7772]">
                Sort by
              </span>
              <ProfessionalSelect
                ariaLabel="Select sort order"
                className="motion-input mt-2 h-12 w-full rounded-lg border border-[#eadbd6] px-3 text-sm outline-none"
                onChange={(nextSort) => {
                  setSortBy(nextSort);
                  setActiveNeed("");
                  setCurrentPage(1);
                }}
                options={sortOptions}
                value={sortBy}
              />
            </label>
            <label className="flex h-full min-h-16 items-center gap-3 rounded-lg bg-[#edf8f3] px-4 text-sm font-semibold text-[#356c5c]">
              <input
                checked={needHomeVisit}
                className="h-4 w-4 accent-[#4f8a74]"
                onChange={(event) => {
                  setNeedHomeVisit(event.target.checked);
                  setActiveNeed("");
                  setCurrentPage(1);
                }}
                type="checkbox"
              />
              Home visit
            </label>
            <button
              className="motion-button flex h-full min-h-16 items-center justify-center gap-2 rounded-lg bg-[#fce4ec] px-4 text-sm font-semibold text-[#8d4a55] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2 xl:col-span-1"
              disabled={isLocating}
              onClick={() => requestLocation(false)}
              type="button"
            >
              <Icon name="map" className="h-4 w-4" />
              {isLocating ? "Locating" : "Near me"}
            </button>
          </div>

          {filteredSalons.length > 0 && (
            <div className="mt-6 flex flex-col justify-between gap-3 rounded-lg bg-white/70 px-4 py-3 text-sm font-semibold text-[#6b5d5a] shadow-sm sm:flex-row sm:items-center">
              <span>
                Showing {pageStartIndex + 1}-{pageEndIndex} of {filteredSalons.length} salons
              </span>
              <span className="text-[#8d4a55]">
                Page {safeCurrentPage} of {totalPages}
              </span>
            </div>
          )}

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paginatedSalons.map((salon) => {
              const salonDistance = getSalonDistance(salon, userLocation);
              const salonScore = scoreSalon(salon, service, budget, needHomeVisit, userLocation);
              const salonReasons = getMatchReasons(
                salon,
                service,
                budget,
                needHomeVisit,
                userLocation,
              );
              const saved = shortlist.includes(salon.id);

              return (
                <article
                  className="salon-card-el opacity-0 motion-card relative isolate rounded-lg border border-white bg-[#fffdfb] p-6 shadow-[0_18px_60px_rgba(68,51,47,0.08)]"
                  key={salon.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full bg-[#fce4ec] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#8d4a55]">
                      {salonScore}% match
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3cf] px-3 py-1 text-sm font-semibold text-[#735f21]">
                      <Icon name="star" className="h-4 w-4 fill-current" />
                      {salon.rating}
                    </span>
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold">{salon.name}</h3>
                  <p className="mt-1 text-sm font-medium text-[#8a7773]">
                    {salon.area} · {salonDistance.toFixed(1)} km · {salon.reviews} reviews
                  </p>
                  <p className="mt-5 min-h-14 text-base leading-7 text-[#5e514f]">
                    {salon.specialty}
                  </p>
                  <div className="mt-4 rounded-lg bg-[#fff9f7] p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9b5963]">
                      Why it fits
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {salonReasons.map((reason) => (
                        <span
                          className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#6e3038] shadow-sm"
                          key={reason}
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {salon.tags.map((tag) => (
                      <span
                        className="rounded-full bg-[#f7efec] px-3 py-1 text-xs font-semibold text-[#74615c]"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-2 border-t border-[#f0e4df] pt-5 text-sm min-[420px]:grid-cols-3">
                    <p>
                      <span className="block text-[#8a7773]">From</span>
                      <strong>{formatPrice(salon.basePrice)}</strong>
                    </p>
                    <p>
                      <span className="block text-[#8a7773]">Reply</span>
                      <strong>{salon.responseMins} min</strong>
                    </p>
                    <p>
                      <span className="block text-[#8a7773]">Hygiene</span>
                      <strong>{salon.hygieneScore}%</strong>
                    </p>
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                    <button
                      className="motion-button relative z-10 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#2d2525] text-sm font-semibold text-white transition hover:bg-[#6e3038]"
                      onClick={() => openModal(salon, "booking")}
                      type="button"
                    >
                      <Icon name="calendar" className="h-4 w-4" />
                      Book
                    </button>
                    <button
                      className="motion-button relative z-10 inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#e7d6d0] bg-white text-sm font-semibold text-[#6e3038] transition hover:bg-[#fff3ef]"
                      onClick={() => {
                        toggleShortlist(salon.id);
                        animateHeart(salon.id);
                      }}
                      type="button"
                    >
                      <span className={`heart-icon-${salon.id} inline-block`}>
                        <Icon name="heart" className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                      </span>
                      {saved ? "Saved" : "Save"}
                    </button>
                    <button
                      className="motion-button relative z-10 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#e8f6f1] text-sm font-semibold text-[#356c5c] transition hover:bg-[#d9f0e8] min-[420px]:col-span-2"
                      onClick={() => openModal(salon, salon.bridalReady ? "quote" : "callback")}
                      type="button"
                    >
                      <Icon name="phone" className="h-4 w-4" />
                      {salon.bridalReady ? "Request quote" : "Request callback"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredSalons.length > SALONS_PER_PAGE && (
            <nav
              aria-label="Salon results pagination"
              className="mt-8 flex flex-col items-center justify-between gap-4 rounded-lg border border-white bg-white/82 p-4 shadow-sm md:flex-row"
            >
              <button
                className="motion-button inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#e7d6d0] bg-white px-4 text-sm font-semibold text-[#6e3038] disabled:cursor-not-allowed disabled:opacity-45 md:w-auto"
                disabled={safeCurrentPage === 1}
                onClick={() => goToResultsPage(safeCurrentPage - 1)}
                type="button"
              >
                Previous
              </button>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {paginationItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span
                      className="grid h-10 w-10 place-items-center text-sm font-semibold text-[#8b7772]"
                      key={`ellipsis-${index}`}
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      aria-current={item === safeCurrentPage ? "page" : undefined}
                      className={`motion-button grid h-10 min-w-10 place-items-center rounded-lg px-3 text-sm font-semibold transition ${
                        item === safeCurrentPage
                          ? "bg-[#2d2525] text-white"
                          : "border border-[#eadbd6] bg-white text-[#6e3038] hover:bg-[#fff3ef]"
                      }`}
                      key={item}
                      onClick={() => goToResultsPage(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>

              <button
                className="motion-button inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#e7d6d0] bg-white px-4 text-sm font-semibold text-[#6e3038] disabled:cursor-not-allowed disabled:opacity-45 md:w-auto"
                disabled={safeCurrentPage === totalPages}
                onClick={() => goToResultsPage(safeCurrentPage + 1)}
                type="button"
              >
                Next
              </button>
            </nav>
          )}

          {filteredSalons.length === 0 && (
            <div className="mt-8 rounded-lg border border-[#eadbd6] bg-white p-8 text-center">
              <h3 className="text-2xl font-semibold">No exact matches yet</h3>
              <p className="mt-2 text-[#6b5d5a]">
                Raise your budget, clear the area text, or switch to any service.
              </p>
              <button
                className="mt-5 rounded-lg bg-[#2d2525] px-5 py-3 text-sm font-semibold text-white"
                onClick={() => {
                  setArea("");
                  setUserLocation(null);
                  setService("Any service");
                  setBudget(12000);
                  setNeedHomeVisit(false);
                  setActiveNeed("");
                  setCurrentPage(1);
                  setLocationStatus("Filters reset. Tap location to rank salons near you.");
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* AI section explains the product intelligence while showing live data. */}
      <section id="ai" className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b5963]">
            Applied AI layer
          </p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Recommendations that respond to real customer intent
          </h2>
          <p className="mt-5 text-base leading-7 text-[#6b5d5a]">
            The MVP ranks inventory using service fit, travel distance, budget,
            home service needs, response speed, rating and hygiene score.
          </p>
          <button
            className="motion-button mt-6 inline-flex h-12 items-center gap-2 rounded-lg bg-[#2d2525] px-5 text-sm font-semibold text-white transition hover:bg-[#6e3038]"
            onClick={() => {
              setSortBy("ai");
              setStatusMessage(`${bestMatch.name} is currently your strongest AI match.`);
              resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <Icon name="spark" className="h-4 w-4" />
            Run AI match
          </button>
        </div>

        <div className="ai-highlights-container grid gap-4">
          {aiHighlights.map((highlight, index) => (
            <article
              className="ai-highlight-el opacity-0 motion-card scroll-3d-surface flex gap-4 rounded-lg border border-[#efe2dd] bg-white p-5 shadow-sm"
              key={highlight}
              style={scroll3dTransform(scrollY, index + 14, 0.28)}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#e8f6f1] text-sm font-bold text-[#4f8a74]">
                0{index + 1}
              </span>
              <p className="leading-7 text-[#5d514f]">{highlight}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Saved section proves user flows persist during the demo. */}
      <section id="saved" className="bg-[#2d2525] py-12 text-white sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f4c8d0]">
              Customer workspace
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Saved salons and confirmed requests
            </h2>
            <p className="mt-5 leading-7 text-[#f5ebe8]">
              Judges can shortlist salons, submit bookings or quote requests,
              refresh the page and still see the demo history.
            </p>
            {(shortlist.length > 0 || bookings.length > 0) && (
              <button
                className="motion-button mt-6 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#6e3038]"
                onClick={clearDemoData}
              >
                Clear demo data
              </button>
            )}
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg bg-white/8 p-5">
              <h3 className="text-xl font-semibold">Shortlist</h3>
              <div className="mt-4 grid gap-3">
                {shortlistedSalons.length > 0 ? (
                  shortlistedSalons.map((salon) => (
                    <div
                      className="motion-fade-up flex flex-col gap-3 rounded-lg bg-white/8 p-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between"
                      key={salon.id}
                    >
                      <span>
                        <strong className="block">{salon.name}</strong>
                        <span className="text-sm text-[#f5d9d4]">{salon.area}</span>
                      </span>
                      <button
                        className="motion-button rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold"
                        onClick={() => toggleShortlist(salon.id)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#f5d9d4]">No saved salons yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white/8 p-5">
              <h3 className="text-xl font-semibold">Request history</h3>
              <div className="mt-4 grid max-h-72 gap-3 overflow-auto pr-1">
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <div
                      className="motion-fade-up rounded-lg bg-white/8 p-3 text-sm"
                      key={booking.id}
                    >
                      <strong className="block">{booking.salonName}</strong>
                      <span className="block text-[#f5d9d4]">
                        {booking.type} · {booking.service} · {booking.date} at {booking.time}
                      </span>
                      {booking.requestStatus && (
                        <span className="mt-1 block text-[#f5d9d4]">
                          Status {booking.requestStatus}
                        </span>
                      )}
                      {booking.razorpayPaymentId && (
                        <span className="mt-1 block text-[#dff3ed]">
                          Paid {formatPrice(booking.amountPaid || 0)} · Payment{" "}
                          {booking.razorpayPaymentId}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#f5d9d4]">No bookings or quote requests yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer captures the hackathon submission positioning. */}
      <footer className="border-t border-[#eadbd6] bg-[#fff9f7] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-[#746663] md:flex-row md:items-center">
          <p>
            Built for SuperXgen AI Startup Buildathon 2026: live marketplace,
            responsive UI, AI ranking, booking flow and persisted demo actions.
          </p>
          <div className="flex items-center gap-3 font-semibold text-[#6e3038]">
            <BrandMark className="h-8 w-8 shrink-0" />
            <span>
              {BRAND_NAME} {CITY_NAME}
              <span className="block text-xs font-medium text-[#8a7b78]">{BRAND_TAGLINE}</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Modal handles booking, quote and callback workflows with one validated form. */}
      {activeSalon && (
        <div className="modal-backdrop-anime fixed inset-0 z-[80] grid place-items-center bg-[#2d2525]/55 px-3 py-4 opacity-0 backdrop-blur-sm sm:px-4 sm:py-6">
          <form
            aria-labelledby="booking-dialog-title"
            aria-modal="true"
            className="modal-content-anime max-h-[92vh] w-full max-w-2xl overflow-auto rounded-lg bg-[#fffdfb] p-4 opacity-0 shadow-2xl sm:p-5"
            onSubmit={submitRequest}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#efe1dc] pb-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9b5963]">
                  {modalMode === "booking"
                    ? "Confirm booking"
                    : modalMode === "quote"
                      ? "Request quote"
                      : "Request callback"}
                </p>
                <h2 className="mt-2 text-xl font-semibold sm:text-2xl" id="booking-dialog-title">
                  {activeSalon.name}
                </h2>
                <p className="mt-1 text-sm text-[#776966]">{activeSalon.area}</p>
              </div>
              <button
                aria-label="Close modal"
                className="motion-button grid h-10 w-10 place-items-center rounded-lg bg-[#f7efec] text-[#6e3038] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPaying}
                onClick={closeModal}
                type="button"
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-[#5e514f]">Name</span>
                <input
                  className="motion-input mt-2 h-12 w-full rounded-lg border border-[#eadbd6] px-3 outline-none"
                  autoComplete="name"
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Your name"
                  required
                  value={customerName}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[#5e514f]">Phone</span>
                <input
                  className="motion-input mt-2 h-12 w-full rounded-lg border border-[#eadbd6] px-3 outline-none"
                  autoComplete="tel"
                  onChange={(event) => setPhone(event.target.value)}
                  pattern="[+\d][+\d\s().-]{6,24}"
                  placeholder="+91 98765 43210"
                  required
                  type="tel"
                  value={phone}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[#5e514f]">Email</span>
                <input
                  className="motion-input mt-2 h-12 w-full rounded-lg border border-[#eadbd6] px-3 outline-none"
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[#5e514f]">Time</span>
                <ProfessionalSelect
                  ariaLabel="Select appointment time"
                  className="motion-input mt-2 h-12 w-full rounded-lg border border-[#eadbd6] px-3 outline-none"
                  onChange={setSelectedTime}
                  options={activeSalon.slots.map((slot) => ({ value: slot, label: slot }))}
                  value={selectedTime}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-[#5e514f]">Notes</span>
                <textarea
                  className="motion-input mt-2 min-h-24 w-full rounded-lg border border-[#eadbd6] p-3 outline-none"
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Occasion, preferred stylist, group size or skin/hair goals"
                  value={notes}
                />
              </label>
            </div>

            <div className="mt-5 rounded-lg bg-[#edf8f3] p-4 text-sm text-[#356c5c]">
              <strong className="block">Summary</strong>
              {service} on {date} at {selectedTime || "selected time"} · Starts at{" "}
              {formatPrice(activeSalon.basePrice)}
              {modalMode === "booking" && (
                <span className="mt-2 block">
                  Secure payment will open in Razorpay Checkout before the booking is confirmed.
                </span>
              )}
            </div>

            {paymentMessage && (
              <p className="mt-4 rounded-lg bg-[#fff3ef] p-3 text-sm font-semibold text-[#8d4a55]">
                {paymentMessage}
              </p>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                className="motion-button min-h-12 rounded-lg border border-[#e7d6d0] bg-white px-4 py-3 font-semibold text-[#6e3038]"
                onClick={closeModal}
                disabled={isPaying}
                type="button"
              >
                Cancel
              </button>
              <button
                className="motion-button min-h-12 rounded-lg bg-[#2d2525] px-4 py-3 font-semibold text-white transition hover:bg-[#6e3038] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isPaying}
              >
                {modalMode === "booking"
                  ? isPaying
                    ? "Processing payment..."
                    : `Pay ${formatPrice(activeSalon.basePrice)} & confirm`
                  : modalMode === "quote"
                    ? "Send quote request"
                    : "Request callback"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
