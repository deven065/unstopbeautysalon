"use client";

import Image from "next/image";
import {
  type CSSProperties,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { animate, stagger } from "animejs";

// The city can be changed here if the buildathon entry pivots to another market.
const CITY_NAME = "Mumbai";

// Service categories power the hero search, category cards, and listing filters.
const serviceCategories = [
  {
    name: "Hair Studio",
    slug: "Hair Studio",
    detail: "Color, cuts, spa and care routines",
    price: "from Rs. 699",
    tone: "bg-[#fce4ec]",
  },
  {
    name: "Bridal Beauty",
    slug: "Bridal Beauty",
    detail: "Trials, makeup, draping and packages",
    price: "from Rs. 4,999",
    tone: "bg-[#f9dfd0]",
  },
  {
    name: "Skin & Facial",
    slug: "Skin & Facial",
    detail: "Glow facials, cleanups and skin care",
    price: "from Rs. 899",
    tone: "bg-[#dff3ed]",
  },
  {
    name: "Nails & Spa",
    slug: "Nails & Spa",
    detail: "Gel nails, manicure and spa therapy",
    price: "from Rs. 599",
    tone: "bg-[#e8e1f5]",
  },
];

// These listings act as a realistic MVP inventory for the marketplace.
const salons = [
  {
    id: "aster-glow",
    name: "Aster Glow Studio",
    area: "Bandra West",
    coords: { lat: 19.0596, lng: 72.8295 },
    categories: ["Hair Studio", "Skin & Facial", "Nails & Spa"],
    rating: 4.9,
    reviews: 412,
    basePrice: 1299,
    distanceKm: 1.8,
    responseMins: 12,
    hygieneScore: 98,
    homeVisit: false,
    bridalReady: true,
    luxury: true,
    slots: ["10:30 AM", "12:45 PM", "4:30 PM", "6:00 PM"],
    tags: ["AI Match", "Luxury color", "Hygiene verified"],
    specialty: "Luxury hair color, skin prep and glow treatments.",
  },
  {
    id: "mira-bridal",
    name: "Mira Bridal Bar",
    area: "Juhu",
    coords: { lat: 19.1075, lng: 72.8263 },
    categories: ["Bridal Beauty", "Hair Studio", "Skin & Facial"],
    rating: 4.8,
    reviews: 335,
    basePrice: 5499,
    distanceKm: 4.2,
    responseMins: 18,
    hygieneScore: 96,
    homeVisit: true,
    bridalReady: true,
    luxury: true,
    slots: ["11:00 AM", "2:30 PM", "7:15 PM"],
    tags: ["Bride Pick", "Trial available", "Home visit"],
    specialty: "Bridal makeup, draping, trials and pre-wedding care.",
  },
  {
    id: "mint-home",
    name: "Mint Home Salon",
    area: "Powai",
    coords: { lat: 19.1176, lng: 72.906 },
    categories: ["Skin & Facial", "Nails & Spa"],
    rating: 4.7,
    reviews: 286,
    basePrice: 899,
    distanceKm: 7.4,
    responseMins: 9,
    hygieneScore: 94,
    homeVisit: true,
    bridalReady: false,
    luxury: false,
    slots: ["9:30 AM", "1:00 PM", "5:45 PM", "8:00 PM"],
    tags: ["Home Visit", "Fast response", "Value pick"],
    specialty: "At-home facials, waxing, manicure and pedicure.",
  },
  {
    id: "opal-nails",
    name: "Opal Nail Atelier",
    area: "Lower Parel",
    coords: { lat: 18.993, lng: 72.8304 },
    categories: ["Nails & Spa"],
    rating: 4.6,
    reviews: 198,
    basePrice: 749,
    distanceKm: 3.1,
    responseMins: 24,
    hygieneScore: 95,
    homeVisit: false,
    bridalReady: false,
    luxury: true,
    slots: ["12:15 PM", "3:00 PM", "5:30 PM"],
    tags: ["Gel nails", "Spa chairs", "Premium finish"],
    specialty: "Gel extensions, nail art, foot spa and hand care.",
  },
  {
    id: "saffron-men",
    name: "Saffron Grooming Co.",
    area: "Andheri East",
    coords: { lat: 19.1155, lng: 72.8727 },
    categories: ["Hair Studio", "Skin & Facial"],
    rating: 4.5,
    reviews: 221,
    basePrice: 699,
    distanceKm: 6.5,
    responseMins: 15,
    hygieneScore: 92,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["10:00 AM", "1:45 PM", "6:30 PM"],
    tags: ["Grooming", "Express facial", "Budget friendly"],
    specialty: "Haircuts, beard styling, detan and express facials.",
  },
  {
    id: "pearl-luxe",
    name: "Pearl Luxe Salon",
    area: "Colaba",
    coords: { lat: 18.9067, lng: 72.8147 },
    categories: ["Bridal Beauty", "Hair Studio", "Nails & Spa"],
    rating: 4.9,
    reviews: 501,
    basePrice: 2499,
    distanceKm: 8.1,
    responseMins: 28,
    hygieneScore: 99,
    homeVisit: true,
    bridalReady: true,
    luxury: true,
    slots: ["2:00 PM", "4:00 PM"],
    tags: ["Celebrity stylists", "Luxury suite", "Group booking"],
    specialty: "Premium bridal, party styling and luxury nail care.",
  },
];

// These quick stats make the marketplace feel investor and judge ready.
const quickStats = [
  { value: `${salons.length * 40}+`, label: "verified salon partners" },
  { value: "18 min", label: "average response time" },
  { value: "4.8/5", label: "city trust score" },
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
    position: "left center",
    speed: -0.035,
    tone: "bg-[#fce4ec]",
  },
  {
    title: "Match the right beauty goal",
    copy: "AI highlights bridal, skin, hair and nail options based on customer intent.",
    position: "center center",
    speed: -0.06,
    tone: "bg-[#e8f6f1]",
  },
  {
    title: "Move from shortlist to slot",
    copy: "Customers can save choices, request quotes and confirm appointment details.",
    position: "right center",
    speed: -0.025,
    tone: "bg-[#f2edfb]",
  },
];

type Salon = (typeof salons)[number];

type GeoPoint = {
  lat: number;
  lng: number;
};

type Booking = {
  id: string;
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

// Staggered animations keep grids feeling intentional instead of noisy.
function motionDelay(index: number, step = 80) {
  return { "--motion-delay": `${index * step}ms` } as CSSProperties;
}

// Scroll-linked transforms give image layers different visual depths.
function parallaxTransform(scrollY: number, speed: number, base = "") {
  const translateY = Math.round(scrollY * speed);
  const transform = `${base} translate3d(0, ${translateY}px, 0)`.trim();

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
function findNearestSalon(userLocation: GeoPoint) {
  return [...salons].sort(
    (first, second) =>
      distanceBetweenKm(userLocation, first.coords) - distanceBetweenKm(userLocation, second.coords),
  )[0] ?? salons[0];
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

export default function SalonMarketplace() {
  const today = new Date().toISOString().slice(0, 10);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // Search state controls the hero form and the live marketplace filters.
  const [area, setArea] = useState("Bandra West");
  const [service, setService] = useState("Bridal Beauty");
  const [date, setDate] = useState(today);
  const [budget, setBudget] = useState(6000);
  const [needHomeVisit, setNeedHomeVisit] = useState(false);
  const [sortBy, setSortBy] = useState("ai");
  const [query, setQuery] = useState("");
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(
    "Detecting your nearest Mumbai marketplace area.",
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

  // Form state is shared by booking, quote and callback actions.
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");

  // Request browser location and map it to the nearest salon area in the inventory.
  const requestLocation = useCallback((automatic = false) => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("Location is not supported in this browser. You can type your area.");
      return;
    }

    if (!window.isSecureContext) {
      setLocationStatus("Automatic location needs HTTPS or localhost. You can type your area.");
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
        const nearestSalon = findNearestSalon(detectedLocation);
        const nearestDistance = getSalonDistance(nearestSalon, detectedLocation).toFixed(1);

        setUserLocation(detectedLocation);
        setArea(nearestSalon.area);
        setSortBy("distance");
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
  }, []);

  // Update one scroll value per animation frame for the parallax image layers.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    let frameId = 0;

    const updateParallax = () => {
      frameId = 0;
      setScrollY(Math.min(window.scrollY, 1800));
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

  // Ask for location automatically on supported secure origins such as Vercel or localhost.
  useEffect(() => {
    const locationTimer = window.setTimeout(() => requestLocation(true), 650);

    return () => window.clearTimeout(locationTimer);
  }, [requestLocation]);

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

    const matches = salons.filter((salon) => {
      const matchesService = service === "Any service" || salon.categories.includes(service);
      const matchesArea =
        Boolean(userLocation) ||
        !normalizedArea ||
        salon.area.toLowerCase().includes(normalizedArea.replace(", mumbai", "")) ||
        `${salon.area} ${CITY_NAME}`.toLowerCase().includes(normalizedArea);
      const matchesBudget = salon.basePrice <= budget;
      const matchesHomeVisit = !needHomeVisit || salon.homeVisit;
      const matchesQuery =
        !normalizedQuery ||
        salon.name.toLowerCase().includes(normalizedQuery) ||
        salon.specialty.toLowerCase().includes(normalizedQuery) ||
        salon.tags.join(" ").toLowerCase().includes(normalizedQuery);

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
  }, [area, budget, needHomeVisit, query, service, sortBy, userLocation]);

  // The top match updates as filters change, powering the AI recommendation panel.
  const bestMatch = filteredSalons[0] ?? salons[0];
  const bestMatchScore = scoreSalon(bestMatch, service, budget, needHomeVisit, userLocation);
  const bestMatchDistance = getSalonDistance(bestMatch, userLocation);

  // Keep track of the mounted salon for modal exit transitions
  const [mountedSalon, setMountedSalon] = useState<Salon | null>(null);
  const cardsAnimRef = useRef<any>(null);

  // 1. Hero Entrance & Count-up Stats & Nav Entrance
  useEffect(() => {
    // Nav elements entrance
    animate("header nav > *", {
      translateY: [-15, 0],
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

    // Count up stats
    const statsObj = { partners: 0, time: 0, score: 0 };
    animate(statsObj, {
      partners: salons.length * 40,
      time: 18,
      score: 4.8,
      easing: "easeOutExpo",
      duration: 2200,
      delay: 600,
      update: () => {
        const partnersEl = document.getElementById("stat-val-0");
        if (partnersEl) partnersEl.innerText = `${Math.floor(statsObj.partners)}+`;

        const timeEl = document.getElementById("stat-val-1");
        if (timeEl) timeEl.innerText = `${Math.floor(statsObj.time)} min`;

        const scoreEl = document.getElementById("stat-val-2");
        if (scoreEl) scoreEl.innerText = `${statsObj.score.toFixed(1)}/5`;
      },
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
  }, [filteredSalons]);

  // 4. Modal Entrance & Exit Animations
  useEffect(() => {
    if (activeSalon) {
      setMountedSalon(activeSalon);
      // Wait for modal to render first
      const timeoutId = setTimeout(() => {
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
      return () => clearTimeout(timeoutId);
    } else if (mountedSalon) {
      // Exit transition
      animate(".modal-backdrop-anime", {
        opacity: [1, 0],
        duration: 200,
        easing: "easeInQuad",
      });
      animate(".modal-content-anime", {
        translateY: [0, 30],
        scale: [1, 0.95],
        opacity: [1, 0],
        duration: 200,
        easing: "easeInQuad",
        complete: () => {
          setMountedSalon(null);
        },
      });
    }
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


  // Submit search and scroll to the live results section.
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(`Found ${filteredSalons.length} salon matches for ${service} near ${area}.`);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Manual typing intentionally turns off live coordinates and uses area text.
  function handleAreaChange(nextArea: string) {
    setArea(nextArea);
    setUserLocation(null);
    setLocationStatus("Using typed area. Tap location to rank salons near you automatically.");
  }

  // Category cards behave as shortcuts into the marketplace.
  function chooseCategory(category: string) {
    setService(category);
    setStatusMessage(`${category} selected. AI ranking refreshed for your budget and location.`);
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

  // Save verified payments or non-payment requests into local demo history.
  function saveCustomerRequest(
    requestSalon: Salon,
    requestType: ModalMode,
    payment?: { amountPaid: number; orderId: string; paymentId: string },
  ) {
    const newBooking: Booking = {
      id: crypto.randomUUID(),
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
      createdAt: new Date().toISOString(),
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
    setActiveSalon(null);
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
        amount: requestSalon.basePrice,
        customerName: customerName.trim(),
        salonName: requestSalon.name,
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
          name: process.env.NEXT_PUBLIC_SITE_NAME || "GlowNest Mumbai",
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

    const salonToSubmit = mountedSalon || activeSalon;
    if (!salonToSubmit || !customerName.trim() || !phone.trim() || !selectedTime) {
      setStatusMessage("Please add your name, phone number and preferred time.");
      return;
    }

    if (modalMode !== "booking") {
      saveCustomerRequest(salonToSubmit, modalMode);
      return;
    }

    try {
      const payment = await collectRazorpayPayment(salonToSubmit);
      saveCustomerRequest(salonToSubmit, "booking", payment);
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

  const shortlistedSalons = salons.filter((salon) => shortlist.includes(salon.id));

  return (
    <main className="min-h-screen bg-[#fff9f7] text-[#2d2525]">
      {/* Header keeps navigation and the main booking action available everywhere. */}
      <header className="sticky top-0 z-50 border-b border-[#eadbd6]/80 bg-[#fff9f7]/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a className="flex min-w-0 items-center gap-3" href="#top" aria-label="GlowNest home">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#f4c8d0] font-semibold text-[#6e3038]">
              GN
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-semibold tracking-[0.16em] text-[#6e3038]">
                GLOWNEST
              </span>
              <span className="block truncate text-xs font-medium text-[#7d6e6b]">
                {CITY_NAME} Beauty Marketplace
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
          </div>

          <button
            className="motion-button inline-flex h-11 items-center gap-2 rounded-full bg-[#2d2525] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6e3038]"
            onClick={() => openModal(bestMatch, "booking")}
          >
            <Icon name="calendar" className="h-4 w-4" />
            Book now
          </button>
        </nav>
      </header>

      {/* Hero gives the product a strong startup-style first impression. */}
      <section id="top" className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/salon-marketplace-hero.png"
            alt="Pastel salon studio with beauty products and a booking app"
            fill
            priority
            sizes="100vw"
            className="parallax-layer object-cover"
            style={parallaxTransform(scrollY, 0.16, "scale(1.08)")}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,249,247,0.97)_0%,rgba(255,249,247,0.88)_38%,rgba(255,249,247,0.36)_72%,rgba(255,249,247,0.12)_100%)]" />
        </div>

        <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl content-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.04fr_0.96fr] lg:py-20">
          <div className="max-w-3xl">
            <p className="hero-entrance-el opacity-0 mb-5 inline-flex rounded-full border border-[#e6cdc6] bg-white/70 px-4 py-2 text-sm font-semibold text-[#8d4a55] shadow-sm">
              AI Startup Buildathon 2026 MVP
            </p>
            <h1
              className="hero-entrance-el opacity-0 max-w-4xl text-5xl font-semibold leading-[1.02] text-[#2d2525] sm:text-6xl lg:text-7xl"
            >
              {CITY_NAME} salon bookings, matched to your moment.
            </h1>
            <p
              className="hero-entrance-el opacity-0 mt-6 max-w-2xl text-lg leading-8 text-[#665957] sm:text-xl"
            >
              Search verified salons, compare transparent pricing, shortlist
              favorites, request quotes and confirm demo bookings in one smooth
              marketplace journey.
            </p>

            {/* Search panel is fully functional and drives the results below. */}
            <form
              id="booking"
              className="hero-entrance-el opacity-0 mt-8 grid gap-3 rounded-lg border border-white/80 bg-white/88 p-3 shadow-[0_24px_80px_rgba(110,48,56,0.14)] backdrop-blur md:grid-cols-[1fr_1fr_auto]"
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
                  <select
                    className="w-full bg-transparent text-base font-semibold text-[#2d2525] outline-none"
                    onChange={(event) => setService(event.target.value)}
                    value={service}
                  >
                    <option>Any service</option>
                    {serviceCategories.map((category) => (
                      <option key={category.slug}>{category.slug}</option>
                    ))}
                  </select>
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
            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
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

          {/* AI match card updates live as search filters change. */}
          <aside
            className="hero-aside-el opacity-0 motion-ai-card parallax-layer self-end rounded-lg border border-white/80 bg-white/86 p-5 shadow-[0_28px_90px_rgba(74,63,60,0.16)] backdrop-blur lg:ml-auto lg:w-[430px]"
            style={parallaxTransform(scrollY, -0.045)}
          >
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
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                className="motion-button inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#2d2525] text-sm font-semibold text-white transition hover:bg-[#6e3038]"
                onClick={() => openModal(bestMatch, "booking")}
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
              >
                <span className={`heart-icon-${bestMatch.id} inline-block`}>
                  <Icon name="heart" className="h-4 w-4" />
                </span>
                {shortlist.includes(bestMatch.id) ? "Saved" : "Save"}
              </button>
            </div>
          </aside>
        </div>
      </section>

      {/* Scroll parallax brings the generated salon visuals to life between product beats. */}
      <section className="overflow-hidden bg-[#fff9f7] py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
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
              The parallax image layers create a gentle sense of depth while
              keeping the interface clean, calm and focused on booking.
            </p>
          </div>

          <div className="visual-moments-container mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.1fr_0.95fr]">
            {visualMoments.map((moment, index) => (
              <article
                className="visual-moment-el opacity-0 motion-card overflow-hidden rounded-lg border border-white bg-white shadow-[0_18px_60px_rgba(68,51,47,0.08)]"
                key={moment.title}
              >
                <div className="relative h-[330px] overflow-hidden sm:h-[390px]">
                  <Image
                    src="/images/salon-marketplace-hero.png"
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
      <section id="services" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
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
          {serviceCategories.map((category, index) => (
            <button
              className={`${category.tone} category-card-el opacity-0 motion-card rounded-lg border border-white/80 p-6 text-left shadow-sm`}
              key={category.slug}
              onClick={() => chooseCategory(category.slug)}
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
      <section id="salons" className="bg-[#f7efec] py-16" ref={resultsRef}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b5963]">
                Live marketplace
              </p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                {filteredSalons.length} salons matched
              </h2>
            </div>
            <p className="motion-scale-in rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#6e3038] shadow-sm">
              {statusMessage}
            </p>
          </div>

          {/* Filter controls are native inputs so they work reliably on mobile. */}
          <div className="motion-scale-in mt-8 grid gap-3 rounded-lg border border-white bg-white/82 p-4 shadow-sm lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto]">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7772]">
                Search salons
              </span>
              <input
                className="motion-input mt-2 h-12 w-full rounded-lg border border-[#eadbd6] bg-white px-3 text-sm outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, tag or specialty"
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
                onChange={(event) => setDate(event.target.value)}
                type="date"
                value={date}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7772]">
                Budget
              </span>
              <select
                className="motion-input mt-2 h-12 w-full rounded-lg border border-[#eadbd6] bg-white px-3 text-sm outline-none"
                onChange={(event) => setBudget(Number(event.target.value))}
                value={budget}
              >
                <option value={1000}>Under Rs. 1,000</option>
                <option value={2500}>Under Rs. 2,500</option>
                <option value={6000}>Under Rs. 6,000</option>
                <option value={12000}>Under Rs. 12,000</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7772]">
                Sort by
              </span>
              <select
                className="motion-input mt-2 h-12 w-full rounded-lg border border-[#eadbd6] bg-white px-3 text-sm outline-none"
                onChange={(event) => setSortBy(event.target.value)}
                value={sortBy}
              >
                <option value="ai">AI match</option>
                <option value="rating">Rating</option>
                <option value="price">Price</option>
                <option value="distance">Distance</option>
              </select>
            </label>
            <label className="flex h-full min-h-16 items-center gap-3 rounded-lg bg-[#edf8f3] px-4 text-sm font-semibold text-[#356c5c]">
              <input
                checked={needHomeVisit}
                className="h-4 w-4 accent-[#4f8a74]"
                onChange={(event) => setNeedHomeVisit(event.target.checked)}
                type="checkbox"
              />
              Home visit
            </label>
            <button
              className="motion-button flex h-full min-h-16 items-center justify-center gap-2 rounded-lg bg-[#fce4ec] px-4 text-sm font-semibold text-[#8d4a55] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLocating}
              onClick={() => requestLocation(false)}
              type="button"
            >
              <Icon name="map" className="h-4 w-4" />
              {isLocating ? "Locating" : "Near me"}
            </button>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {filteredSalons.map((salon, index) => {
              const salonDistance = getSalonDistance(salon, userLocation);
              const salonScore = scoreSalon(salon, service, budget, needHomeVisit, userLocation);
              const saved = shortlist.includes(salon.id);

              return (
                <article
                  className="salon-card-el opacity-0 motion-card rounded-lg border border-white bg-[#fffdfb] p-6 shadow-[0_18px_60px_rgba(68,51,47,0.08)]"
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
                  <div className="mt-6 grid grid-cols-3 gap-2 border-t border-[#f0e4df] pt-5 text-sm">
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
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      className="motion-button inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#2d2525] text-sm font-semibold text-white transition hover:bg-[#6e3038]"
                      onClick={() => openModal(salon, "booking")}
                    >
                      <Icon name="calendar" className="h-4 w-4" />
                      Book
                    </button>
                    <button
                      className="motion-button inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#e7d6d0] bg-white text-sm font-semibold text-[#6e3038] transition hover:bg-[#fff3ef]"
                      onClick={() => {
                        toggleShortlist(salon.id);
                        animateHeart(salon.id);
                      }}
                    >
                      <span className={`heart-icon-${salon.id} inline-block`}>
                        <Icon name="heart" className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                      </span>
                      {saved ? "Saved" : "Save"}
                    </button>
                    <button
                      className="motion-button col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#e8f6f1] text-sm font-semibold text-[#356c5c] transition hover:bg-[#d9f0e8]"
                      onClick={() => openModal(salon, salon.bridalReady ? "quote" : "callback")}
                    >
                      <Icon name="phone" className="h-4 w-4" />
                      {salon.bridalReady ? "Request quote" : "Request callback"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

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
      <section id="ai" className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
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
              className="ai-highlight-el opacity-0 motion-card flex gap-4 rounded-lg border border-[#efe2dd] bg-white p-5 shadow-sm"
              key={highlight}
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
      <section id="saved" className="bg-[#2d2525] py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-2">
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
                      className="motion-fade-up flex items-center justify-between gap-3 rounded-lg bg-white/8 p-3"
                      key={salon.id}
                    >
                      <span>
                        <strong className="block">{salon.name}</strong>
                        <span className="text-sm text-[#f5d9d4]">{salon.area}</span>
                      </span>
                      <button
                        className="motion-button rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold"
                        onClick={() => toggleShortlist(salon.id)}
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
          <p className="font-semibold text-[#6e3038]">GlowNest {CITY_NAME}</p>
        </div>
      </footer>

      {/* Modal handles booking, quote and callback workflows with one validated form. */}
      {mountedSalon && (
        <div className="modal-backdrop-anime fixed inset-0 z-[80] grid place-items-center bg-[#2d2525]/55 px-4 py-6 backdrop-blur-sm opacity-0">
          <form
            className="modal-content-anime max-h-[92vh] w-full max-w-2xl overflow-auto rounded-lg bg-[#fffdfb] p-5 shadow-2xl opacity-0"
            onSubmit={submitRequest}
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
                <h2 className="mt-2 text-2xl font-semibold">{mountedSalon.name}</h2>
                <p className="mt-1 text-sm text-[#776966]">{mountedSalon.area}</p>
              </div>
              <button
                aria-label="Close modal"
                className="motion-button grid h-10 w-10 place-items-center rounded-lg bg-[#f7efec] text-[#6e3038] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPaying}
                onClick={() => setActiveSalon(null)}
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
                  onChange={(event) => setPhone(event.target.value)}
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
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[#5e514f]">Time</span>
                <select
                  className="motion-input mt-2 h-12 w-full rounded-lg border border-[#eadbd6] px-3 outline-none"
                  onChange={(event) => setSelectedTime(event.target.value)}
                  required
                  value={selectedTime}
                >
                  {mountedSalon.slots.map((slot) => (
                    <option key={slot}>{slot}</option>
                  ))}
                </select>
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
              {formatPrice(mountedSalon.basePrice)}
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
                className="motion-button h-12 rounded-lg border border-[#e7d6d0] bg-white font-semibold text-[#6e3038]"
                onClick={() => setActiveSalon(null)}
                disabled={isPaying}
                type="button"
              >
                Cancel
              </button>
              <button
                className="motion-button h-12 rounded-lg bg-[#2d2525] font-semibold text-white transition hover:bg-[#6e3038] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isPaying}
              >
                {modalMode === "booking"
                  ? isPaying
                    ? "Processing payment..."
                    : `Pay ${formatPrice(mountedSalon.basePrice)} & confirm`
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
