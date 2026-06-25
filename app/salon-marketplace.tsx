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

const serviceOptions = [
  { value: "Any service", label: "Any service" },
  ...serviceCategories.map((category) => ({ value: category.slug, label: category.slug })),
];

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

// These listings act as a realistic MVP inventory for the marketplace.
const salons = [
  {
    id: "aster-glow",
    name: "Aster Glow Studio",
    area: "Bandra West",
    coords: { lat: 19.0596, lng: 72.8295 },
    categories: ["Bridal Beauty", "Hair Studio", "Skin & Facial", "Nails & Spa"],
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
  {
    id: "fort-rose",
    name: "Fort Rose Beauty House",
    area: "Fort",
    coords: { lat: 18.9338, lng: 72.8346 },
    categories: ["Hair Studio", "Skin & Facial"],
    rating: 4.6,
    reviews: 184,
    basePrice: 999,
    distanceKm: 9.4,
    responseMins: 20,
    hygieneScore: 94,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["10:15 AM", "1:30 PM", "5:15 PM"],
    tags: ["Office ready", "Cleanup", "Hair care"],
    specialty: "Workday hair styling, glow cleanups and express facials.",
  },
  {
    id: "churchgate-chic",
    name: "Churchgate Chic Studio",
    area: "Churchgate",
    coords: { lat: 18.9352, lng: 72.8271 },
    categories: ["Hair Studio", "Nails & Spa"],
    rating: 4.7,
    reviews: 246,
    basePrice: 1199,
    distanceKm: 9.1,
    responseMins: 17,
    hygieneScore: 95,
    homeVisit: false,
    bridalReady: false,
    luxury: true,
    slots: ["11:30 AM", "3:15 PM", "6:45 PM"],
    tags: ["Blow dry", "Gel polish", "Premium tools"],
    specialty: "Hair styling, nail polish, party-ready blowouts and spa care.",
  },
  {
    id: "marine-glow",
    name: "Marine Glow Lounge",
    area: "Marine Lines",
    coords: { lat: 18.944, lng: 72.8236 },
    categories: ["Skin & Facial", "Bridal Beauty"],
    rating: 4.8,
    reviews: 302,
    basePrice: 1799,
    distanceKm: 8.7,
    responseMins: 16,
    hygieneScore: 97,
    homeVisit: true,
    bridalReady: true,
    luxury: true,
    slots: ["10:45 AM", "2:15 PM", "7:00 PM"],
    tags: ["Glow facial", "Bride prep", "Home visit"],
    specialty: "Pre-event skin prep, bridal glow routines and home facials.",
  },
  {
    id: "tardeo-tone",
    name: "Tardeo Tone Salon",
    area: "Tardeo",
    coords: { lat: 18.9676, lng: 72.8141 },
    categories: ["Hair Studio", "Skin & Facial"],
    rating: 4.5,
    reviews: 168,
    basePrice: 899,
    distanceKm: 7.3,
    responseMins: 22,
    hygieneScore: 93,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["9:45 AM", "12:30 PM", "4:45 PM"],
    tags: ["Detan", "Hair spa", "Value pick"],
    specialty: "Hair spa, detan, cleanups and everyday grooming packages.",
  },
  {
    id: "mahalaxmi-muse",
    name: "Mahalaxmi Muse",
    area: "Mahalaxmi",
    coords: { lat: 18.9822, lng: 72.8249 },
    categories: ["Bridal Beauty", "Hair Studio", "Nails & Spa"],
    rating: 4.8,
    reviews: 356,
    basePrice: 3299,
    distanceKm: 5.9,
    responseMins: 18,
    hygieneScore: 97,
    homeVisit: true,
    bridalReady: true,
    luxury: true,
    slots: ["11:15 AM", "3:45 PM", "6:30 PM"],
    tags: ["Bride trial", "Party styling", "Premium suite"],
    specialty: "Bridal trials, luxury styling, makeup and nail packages.",
  },
  {
    id: "worli-waves",
    name: "Worli Waves Salon",
    area: "Worli",
    coords: { lat: 19.0176, lng: 72.8162 },
    categories: ["Hair Studio", "Nails & Spa"],
    rating: 4.6,
    reviews: 211,
    basePrice: 1099,
    distanceKm: 4.5,
    responseMins: 19,
    hygieneScore: 94,
    homeVisit: false,
    bridalReady: false,
    luxury: true,
    slots: ["10:00 AM", "2:00 PM", "5:30 PM"],
    tags: ["Hair color", "Foot spa", "Sea link area"],
    specialty: "Hair color, nail care, foot spa and weekend styling.",
  },
  {
    id: "prabhadevi-prism",
    name: "Prabhadevi Prism Beauty",
    area: "Prabhadevi",
    coords: { lat: 19.0166, lng: 72.8295 },
    categories: ["Skin & Facial", "Bridal Beauty"],
    rating: 4.7,
    reviews: 257,
    basePrice: 1499,
    distanceKm: 4.9,
    responseMins: 14,
    hygieneScore: 96,
    homeVisit: true,
    bridalReady: true,
    luxury: false,
    slots: ["9:30 AM", "1:15 PM", "6:15 PM"],
    tags: ["Home facial", "Bride care", "Fast response"],
    specialty: "Bridal skin prep, cleanups, facials and home beauty care.",
  },
  {
    id: "dadar-dazzle",
    name: "Dadar Dazzle Studio",
    area: "Dadar West",
    coords: { lat: 19.019, lng: 72.8425 },
    categories: ["Hair Studio", "Skin & Facial", "Nails & Spa"],
    rating: 4.5,
    reviews: 319,
    basePrice: 799,
    distanceKm: 5.6,
    responseMins: 13,
    hygieneScore: 93,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["10:30 AM", "12:45 PM", "8:00 PM"],
    tags: ["Budget friendly", "Haircut", "Manicure"],
    specialty: "Everyday haircuts, facials, waxing, manicure and pedicure.",
  },
  {
    id: "matunga-mint",
    name: "Matunga Mint Salon",
    area: "Matunga",
    coords: { lat: 19.0269, lng: 72.8553 },
    categories: ["Skin & Facial", "Nails & Spa"],
    rating: 4.6,
    reviews: 176,
    basePrice: 899,
    distanceKm: 6.2,
    responseMins: 16,
    hygieneScore: 95,
    homeVisit: true,
    bridalReady: false,
    luxury: false,
    slots: ["11:00 AM", "2:45 PM", "5:45 PM"],
    tags: ["Student friendly", "Home visit", "Facial"],
    specialty: "Home-friendly skin care, waxing, nails and simple spa routines.",
  },
  {
    id: "sion-silk",
    name: "Sion Silk Beauty Co.",
    area: "Sion",
    coords: { lat: 19.039, lng: 72.8619 },
    categories: ["Hair Studio", "Bridal Beauty"],
    rating: 4.4,
    reviews: 142,
    basePrice: 999,
    distanceKm: 7.1,
    responseMins: 24,
    hygieneScore: 92,
    homeVisit: false,
    bridalReady: true,
    luxury: false,
    slots: ["10:00 AM", "1:30 PM", "4:00 PM"],
    tags: ["Saree draping", "Hair care", "Bride basic"],
    specialty: "Hair care, simple bridal makeup, draping and party looks.",
  },
  {
    id: "chembur-canvas",
    name: "Chembur Canvas Salon",
    area: "Chembur",
    coords: { lat: 19.0522, lng: 72.9005 },
    categories: ["Hair Studio", "Skin & Facial", "Nails & Spa"],
    rating: 4.7,
    reviews: 288,
    basePrice: 1099,
    distanceKm: 9.8,
    responseMins: 15,
    hygieneScore: 96,
    homeVisit: true,
    bridalReady: false,
    luxury: true,
    slots: ["9:45 AM", "3:00 PM", "7:15 PM"],
    tags: ["Home visit", "Hair spa", "Gel nails"],
    specialty: "Hair spa, skin care, gel nails and at-home grooming.",
  },
  {
    id: "ghatkopar-gloss",
    name: "Ghatkopar Gloss Room",
    area: "Ghatkopar East",
    coords: { lat: 19.079, lng: 72.908 },
    categories: ["Skin & Facial", "Bridal Beauty", "Nails & Spa"],
    rating: 4.8,
    reviews: 334,
    basePrice: 1399,
    distanceKm: 10.2,
    responseMins: 12,
    hygieneScore: 97,
    homeVisit: true,
    bridalReady: true,
    luxury: false,
    slots: ["10:15 AM", "2:30 PM", "6:45 PM"],
    tags: ["AI Match", "Home visit", "Bride care"],
    specialty: "Skin treatments, bridal care, nails and quick home service.",
  },
  {
    id: "vikhroli-velvet",
    name: "Vikhroli Velvet Studio",
    area: "Vikhroli",
    coords: { lat: 19.1115, lng: 72.928 },
    categories: ["Hair Studio", "Skin & Facial"],
    rating: 4.4,
    reviews: 125,
    basePrice: 749,
    distanceKm: 12.4,
    responseMins: 21,
    hygieneScore: 92,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["9:30 AM", "12:00 PM", "6:00 PM"],
    tags: ["Express cut", "Cleanup", "Value pick"],
    specialty: "Haircuts, facials, detan and express grooming routines.",
  },
  {
    id: "kanjurmarg-kaya",
    name: "Kanjurmarg Kaya Salon",
    area: "Kanjurmarg",
    coords: { lat: 19.1293, lng: 72.9322 },
    categories: ["Skin & Facial", "Nails & Spa"],
    rating: 4.5,
    reviews: 153,
    basePrice: 849,
    distanceKm: 13.5,
    responseMins: 20,
    hygieneScore: 93,
    homeVisit: true,
    bridalReady: false,
    luxury: false,
    slots: ["10:45 AM", "1:45 PM", "5:30 PM"],
    tags: ["Home facial", "Waxing", "Pedicure"],
    specialty: "Home facials, waxing, pedicure and practical beauty care.",
  },
  {
    id: "bhandup-bloom",
    name: "Bhandup Bloom Salon",
    area: "Bhandup",
    coords: { lat: 19.1511, lng: 72.9372 },
    categories: ["Hair Studio", "Skin & Facial", "Nails & Spa"],
    rating: 4.5,
    reviews: 196,
    basePrice: 699,
    distanceKm: 14.9,
    responseMins: 18,
    hygieneScore: 93,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["9:15 AM", "2:15 PM", "7:30 PM"],
    tags: ["Budget friendly", "Haircut", "Nail care"],
    specialty: "Affordable hair, skin, waxing and nail care packages.",
  },
  {
    id: "mulund-mirror",
    name: "Mulund Mirror Studio",
    area: "Mulund West",
    coords: { lat: 19.1726, lng: 72.9425 },
    categories: ["Bridal Beauty", "Hair Studio", "Skin & Facial"],
    rating: 4.7,
    reviews: 274,
    basePrice: 2299,
    distanceKm: 16.3,
    responseMins: 17,
    hygieneScore: 96,
    homeVisit: true,
    bridalReady: true,
    luxury: true,
    slots: ["11:00 AM", "4:00 PM", "7:45 PM"],
    tags: ["Bride Pick", "Family booking", "Home visit"],
    specialty: "Bridal makeup, family styling, skin prep and hair care.",
  },
  {
    id: "kurla-knot",
    name: "Kurla Knot Beauty Bar",
    area: "Kurla",
    coords: { lat: 19.0726, lng: 72.8845 },
    categories: ["Hair Studio", "Nails & Spa"],
    rating: 4.3,
    reviews: 118,
    basePrice: 649,
    distanceKm: 8.9,
    responseMins: 26,
    hygieneScore: 91,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["10:00 AM", "1:00 PM", "5:00 PM"],
    tags: ["Quick cut", "Manicure", "Budget friendly"],
    specialty: "Quick haircuts, basic manicure, pedicure and grooming.",
  },
  {
    id: "bkc-blush",
    name: "BKC Blush Atelier",
    area: "BKC",
    coords: { lat: 19.0664, lng: 72.8691 },
    categories: ["Hair Studio", "Skin & Facial", "Bridal Beauty"],
    rating: 4.9,
    reviews: 421,
    basePrice: 2499,
    distanceKm: 3.6,
    responseMins: 10,
    hygieneScore: 99,
    homeVisit: false,
    bridalReady: true,
    luxury: true,
    slots: ["10:30 AM", "2:00 PM", "6:30 PM"],
    tags: ["Luxury suite", "Corporate ready", "Bride trial"],
    specialty: "Luxury hair, skin prep, makeup trials and event styling.",
  },
  {
    id: "santacruz-soft",
    name: "Santacruz Soft Touch",
    area: "Santacruz West",
    coords: { lat: 19.081, lng: 72.8415 },
    categories: ["Skin & Facial", "Nails & Spa"],
    rating: 4.6,
    reviews: 231,
    basePrice: 999,
    distanceKm: 2.7,
    responseMins: 14,
    hygieneScore: 95,
    homeVisit: true,
    bridalReady: false,
    luxury: false,
    slots: ["9:30 AM", "12:45 PM", "4:45 PM"],
    tags: ["Home visit", "Cleanups", "Gel nails"],
    specialty: "At-home skin care, cleanups, waxing and nail services.",
  },
  {
    id: "khar-kissed",
    name: "Khar Kissed Salon",
    area: "Khar West",
    coords: { lat: 19.0697, lng: 72.8337 },
    categories: ["Hair Studio", "Skin & Facial", "Nails & Spa"],
    rating: 4.8,
    reviews: 377,
    basePrice: 1499,
    distanceKm: 1.5,
    responseMins: 11,
    hygieneScore: 98,
    homeVisit: false,
    bridalReady: false,
    luxury: true,
    slots: ["10:15 AM", "3:30 PM", "8:00 PM"],
    tags: ["Luxury color", "Nails", "Hygiene verified"],
    specialty: "Premium hair color, skin care, nail art and spa treatments.",
  },
  {
    id: "bandra-east-belle",
    name: "Bandra East Belle",
    area: "Bandra East",
    coords: { lat: 19.0607, lng: 72.8468 },
    categories: ["Hair Studio", "Bridal Beauty"],
    rating: 4.5,
    reviews: 189,
    basePrice: 1199,
    distanceKm: 2.4,
    responseMins: 16,
    hygieneScore: 94,
    homeVisit: true,
    bridalReady: true,
    luxury: false,
    slots: ["11:00 AM", "2:30 PM", "5:45 PM"],
    tags: ["Home visit", "Party makeup", "Hair styling"],
    specialty: "Party makeup, hair styling, draping and home visits.",
  },
  {
    id: "vile-parle-verve",
    name: "Vile Parle Verve",
    area: "Vile Parle East",
    coords: { lat: 19.0997, lng: 72.8486 },
    categories: ["Hair Studio", "Skin & Facial"],
    rating: 4.6,
    reviews: 205,
    basePrice: 899,
    distanceKm: 4.1,
    responseMins: 19,
    hygieneScore: 94,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["9:45 AM", "1:15 PM", "6:15 PM"],
    tags: ["Hair spa", "Detan", "Airport side"],
    specialty: "Hair spa, detan, facials and weekday grooming plans.",
  },
  {
    id: "andheri-west-aura",
    name: "Andheri West Aura",
    area: "Andheri West",
    coords: { lat: 19.1363, lng: 72.8277 },
    categories: ["Hair Studio", "Nails & Spa", "Bridal Beauty"],
    rating: 4.8,
    reviews: 448,
    basePrice: 1599,
    distanceKm: 6.7,
    responseMins: 13,
    hygieneScore: 97,
    homeVisit: true,
    bridalReady: true,
    luxury: true,
    slots: ["10:00 AM", "12:30 PM", "7:00 PM"],
    tags: ["Celebrity stylists", "Home visit", "Nail art"],
    specialty: "Bridal styling, hair color, nail art and at-home services.",
  },
  {
    id: "jogeshwari-jewel",
    name: "Jogeshwari Jewel Salon",
    area: "Jogeshwari",
    coords: { lat: 19.1349, lng: 72.8488 },
    categories: ["Skin & Facial", "Hair Studio"],
    rating: 4.4,
    reviews: 133,
    basePrice: 699,
    distanceKm: 7.2,
    responseMins: 23,
    hygieneScore: 91,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["10:45 AM", "2:45 PM", "6:30 PM"],
    tags: ["Cleanup", "Haircut", "Budget friendly"],
    specialty: "Cleanups, haircuts, waxing and everyday salon essentials.",
  },
  {
    id: "goregaon-glam",
    name: "Goregaon Glam Garage",
    area: "Goregaon West",
    coords: { lat: 19.1646, lng: 72.8493 },
    categories: ["Hair Studio", "Nails & Spa", "Skin & Facial"],
    rating: 4.6,
    reviews: 239,
    basePrice: 999,
    distanceKm: 9.8,
    responseMins: 18,
    hygieneScore: 95,
    homeVisit: true,
    bridalReady: false,
    luxury: false,
    slots: ["9:30 AM", "1:00 PM", "5:30 PM"],
    tags: ["Home visit", "Hair care", "Pedicure"],
    specialty: "Hair care, pedicure, facials and home grooming options.",
  },
  {
    id: "malad-moon",
    name: "Malad Moon Studio",
    area: "Malad West",
    coords: { lat: 19.1874, lng: 72.8484 },
    categories: ["Bridal Beauty", "Hair Studio", "Skin & Facial"],
    rating: 4.7,
    reviews: 311,
    basePrice: 1999,
    distanceKm: 11.7,
    responseMins: 15,
    hygieneScore: 96,
    homeVisit: true,
    bridalReady: true,
    luxury: true,
    slots: ["10:30 AM", "3:15 PM", "7:15 PM"],
    tags: ["Bride Pick", "Home visit", "Family packages"],
    specialty: "Bridal makeup, family grooming, hair and skin packages.",
  },
  {
    id: "kandivali-kraft",
    name: "Kandivali Kraft Salon",
    area: "Kandivali West",
    coords: { lat: 19.2058, lng: 72.8511 },
    categories: ["Hair Studio", "Nails & Spa"],
    rating: 4.5,
    reviews: 207,
    basePrice: 799,
    distanceKm: 13.6,
    responseMins: 21,
    hygieneScore: 93,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["9:15 AM", "12:15 PM", "5:45 PM"],
    tags: ["Haircut", "Gel polish", "Value pick"],
    specialty: "Haircuts, color touchups, gel polish and spa pedicure.",
  },
  {
    id: "borivali-boulevard",
    name: "Borivali Boulevard Beauty",
    area: "Borivali West",
    coords: { lat: 19.229, lng: 72.8574 },
    categories: ["Skin & Facial", "Bridal Beauty", "Nails & Spa"],
    rating: 4.7,
    reviews: 293,
    basePrice: 1299,
    distanceKm: 16.4,
    responseMins: 16,
    hygieneScore: 96,
    homeVisit: true,
    bridalReady: true,
    luxury: false,
    slots: ["10:00 AM", "2:00 PM", "6:00 PM"],
    tags: ["Bride trial", "Home facial", "Nails"],
    specialty: "Bridal trials, facials, waxing, nails and home visits.",
  },
  {
    id: "dahisar-dream",
    name: "Dahisar Dream Salon",
    area: "Dahisar East",
    coords: { lat: 19.2575, lng: 72.8682 },
    categories: ["Hair Studio", "Skin & Facial"],
    rating: 4.4,
    reviews: 121,
    basePrice: 699,
    distanceKm: 18.2,
    responseMins: 25,
    hygieneScore: 91,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["9:30 AM", "1:45 PM", "7:00 PM"],
    tags: ["Budget friendly", "Detan", "Haircut"],
    specialty: "Haircuts, detan, cleanup and practical grooming services.",
  },
  {
    id: "versova-vivid",
    name: "Versova Vivid Atelier",
    area: "Versova",
    coords: { lat: 19.1312, lng: 72.8146 },
    categories: ["Hair Studio", "Nails & Spa", "Skin & Facial"],
    rating: 4.8,
    reviews: 359,
    basePrice: 1599,
    distanceKm: 6.5,
    responseMins: 12,
    hygieneScore: 98,
    homeVisit: false,
    bridalReady: false,
    luxury: true,
    slots: ["11:15 AM", "3:00 PM", "8:15 PM"],
    tags: ["Luxury color", "Nail art", "Skin prep"],
    specialty: "Creative hair color, nail art, skin prep and spa care.",
  },
  {
    id: "oshiwara-orchid",
    name: "Oshiwara Orchid Salon",
    area: "Oshiwara",
    coords: { lat: 19.1484, lng: 72.8338 },
    categories: ["Bridal Beauty", "Hair Studio"],
    rating: 4.6,
    reviews: 218,
    basePrice: 1799,
    distanceKm: 7.8,
    responseMins: 19,
    hygieneScore: 94,
    homeVisit: true,
    bridalReady: true,
    luxury: false,
    slots: ["10:45 AM", "2:15 PM", "6:45 PM"],
    tags: ["Party makeup", "Home visit", "Hair styling"],
    specialty: "Party makeup, bridal basics, hair styling and home service.",
  },
  {
    id: "lokhandwala-luxe",
    name: "Lokhandwala Luxe",
    area: "Lokhandwala",
    coords: { lat: 19.1435, lng: 72.824 },
    categories: ["Hair Studio", "Bridal Beauty", "Nails & Spa"],
    rating: 4.9,
    reviews: 512,
    basePrice: 2999,
    distanceKm: 7.4,
    responseMins: 14,
    hygieneScore: 99,
    homeVisit: false,
    bridalReady: true,
    luxury: true,
    slots: ["12:00 PM", "4:30 PM", "7:30 PM"],
    tags: ["Celebrity stylists", "Luxury suite", "Bride trial"],
    specialty: "Luxury bridal, premium color, nail art and event styling.",
  },
  {
    id: "marol-magic",
    name: "Marol Magic Salon",
    area: "Marol",
    coords: { lat: 19.1165, lng: 72.8795 },
    categories: ["Hair Studio", "Skin & Facial"],
    rating: 4.5,
    reviews: 176,
    basePrice: 799,
    distanceKm: 6.7,
    responseMins: 17,
    hygieneScore: 93,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["10:15 AM", "1:30 PM", "5:15 PM"],
    tags: ["Airport side", "Express facial", "Haircut"],
    specialty: "Express facials, haircuts, beard care and detan services.",
  },
  {
    id: "chandivali-charm",
    name: "Chandivali Charm Studio",
    area: "Chandivali",
    coords: { lat: 19.1079, lng: 72.9019 },
    categories: ["Skin & Facial", "Nails & Spa", "Hair Studio"],
    rating: 4.6,
    reviews: 224,
    basePrice: 999,
    distanceKm: 8.3,
    responseMins: 13,
    hygieneScore: 95,
    homeVisit: true,
    bridalReady: false,
    luxury: false,
    slots: ["9:45 AM", "2:00 PM", "6:30 PM"],
    tags: ["Home visit", "Facial", "Manicure"],
    specialty: "Home facials, manicure, hair spa and waxing services.",
  },
  {
    id: "hiranandani-halo",
    name: "Hiranandani Halo",
    area: "Hiranandani",
    coords: { lat: 19.1187, lng: 72.9116 },
    categories: ["Hair Studio", "Skin & Facial", "Bridal Beauty"],
    rating: 4.8,
    reviews: 387,
    basePrice: 1899,
    distanceKm: 8.8,
    responseMins: 11,
    hygieneScore: 98,
    homeVisit: false,
    bridalReady: true,
    luxury: true,
    slots: ["11:30 AM", "3:30 PM", "7:00 PM"],
    tags: ["Luxury color", "Bride prep", "Skin care"],
    specialty: "Premium hair color, bridal prep, facials and glow treatments.",
  },
  {
    id: "byculla-belle",
    name: "Byculla Belle Salon",
    area: "Byculla",
    coords: { lat: 18.975, lng: 72.8338 },
    categories: ["Hair Studio", "Skin & Facial"],
    rating: 4.4,
    reviews: 149,
    basePrice: 749,
    distanceKm: 7.0,
    responseMins: 22,
    hygieneScore: 92,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["10:30 AM", "1:00 PM", "5:00 PM"],
    tags: ["Cleanup", "Haircut", "Value pick"],
    specialty: "Simple haircuts, cleanups, waxing and daily beauty care.",
  },
  {
    id: "parel-petal",
    name: "Parel Petal Beauty",
    area: "Parel",
    coords: { lat: 19.009, lng: 72.8376 },
    categories: ["Bridal Beauty", "Skin & Facial", "Nails & Spa"],
    rating: 4.7,
    reviews: 267,
    basePrice: 1699,
    distanceKm: 5.2,
    responseMins: 15,
    hygieneScore: 96,
    homeVisit: true,
    bridalReady: true,
    luxury: false,
    slots: ["10:00 AM", "2:45 PM", "6:15 PM"],
    tags: ["Bride care", "Home visit", "Gel nails"],
    specialty: "Bridal skin prep, home visits, nails and makeup support.",
  },
  {
    id: "wadala-wink",
    name: "Wadala Wink Studio",
    area: "Wadala",
    coords: { lat: 19.0178, lng: 72.8562 },
    categories: ["Hair Studio", "Nails & Spa"],
    rating: 4.5,
    reviews: 171,
    basePrice: 699,
    distanceKm: 6.6,
    responseMins: 18,
    hygieneScore: 93,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["9:30 AM", "12:30 PM", "4:30 PM"],
    tags: ["Haircut", "Pedicure", "Budget friendly"],
    specialty: "Haircuts, pedicure, manicure and quick grooming services.",
  },
  {
    id: "kings-circle-kohl",
    name: "King's Circle Kohl",
    area: "King's Circle",
    coords: { lat: 19.0313, lng: 72.8553 },
    categories: ["Bridal Beauty", "Hair Studio"],
    rating: 4.6,
    reviews: 203,
    basePrice: 1499,
    distanceKm: 6.4,
    responseMins: 17,
    hygieneScore: 94,
    homeVisit: true,
    bridalReady: true,
    luxury: false,
    slots: ["10:45 AM", "3:15 PM", "6:45 PM"],
    tags: ["Draping", "Home visit", "Party makeup"],
    specialty: "Draping, party makeup, hair styling and home appointments.",
  },
  {
    id: "sewri-sage",
    name: "Sewri Sage Salon",
    area: "Sewri",
    coords: { lat: 19.0004, lng: 72.8547 },
    categories: ["Skin & Facial", "Hair Studio"],
    rating: 4.3,
    reviews: 112,
    basePrice: 649,
    distanceKm: 6.1,
    responseMins: 27,
    hygieneScore: 91,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["9:15 AM", "1:15 PM", "5:45 PM"],
    tags: ["Detan", "Haircut", "Value pick"],
    specialty: "Detan, basic facials, haircuts and everyday grooming.",
  },
  {
    id: "cuffe-couture",
    name: "Cuffe Couture Salon",
    area: "Cuffe Parade",
    coords: { lat: 18.9127, lng: 72.8206 },
    categories: ["Bridal Beauty", "Hair Studio", "Nails & Spa"],
    rating: 4.9,
    reviews: 438,
    basePrice: 3499,
    distanceKm: 10.5,
    responseMins: 19,
    hygieneScore: 99,
    homeVisit: true,
    bridalReady: true,
    luxury: true,
    slots: ["11:00 AM", "4:15 PM", "7:30 PM"],
    tags: ["Luxury suite", "Bride Pick", "Group booking"],
    specialty: "Premium bridal, luxury hair, group styling and nail care.",
  },
  {
    id: "nariman-noir",
    name: "Nariman Noir Studio",
    area: "Nariman Point",
    coords: { lat: 18.9256, lng: 72.8242 },
    categories: ["Hair Studio", "Skin & Facial"],
    rating: 4.7,
    reviews: 253,
    basePrice: 1399,
    distanceKm: 9.8,
    responseMins: 14,
    hygieneScore: 96,
    homeVisit: false,
    bridalReady: false,
    luxury: true,
    slots: ["10:30 AM", "2:30 PM", "6:30 PM"],
    tags: ["Corporate ready", "Skin prep", "Luxury color"],
    specialty: "Corporate styling, premium hair care, facials and skin prep.",
  },
  {
    id: "mazgaon-magic",
    name: "Mazgaon Magic Beauty",
    area: "Mazgaon",
    coords: { lat: 18.9681, lng: 72.8438 },
    categories: ["Hair Studio", "Skin & Facial", "Nails & Spa"],
    rating: 4.4,
    reviews: 137,
    basePrice: 699,
    distanceKm: 7.8,
    responseMins: 23,
    hygieneScore: 92,
    homeVisit: true,
    bridalReady: false,
    luxury: false,
    slots: ["9:45 AM", "12:45 PM", "6:00 PM"],
    tags: ["Home visit", "Haircut", "Manicure"],
    specialty: "Home-friendly grooming, haircuts, manicure and cleanups.",
  },
  {
    id: "grant-road-glow",
    name: "Grant Road Glow Co.",
    area: "Grant Road",
    coords: { lat: 18.9626, lng: 72.8135 },
    categories: ["Skin & Facial", "Nails & Spa"],
    rating: 4.5,
    reviews: 158,
    basePrice: 799,
    distanceKm: 7.6,
    responseMins: 20,
    hygieneScore: 93,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["10:00 AM", "1:30 PM", "4:30 PM"],
    tags: ["Cleanup", "Pedicure", "Budget friendly"],
    specialty: "Cleanups, facials, pedicure, manicure and waxing services.",
  },
  {
    id: "charni-charm",
    name: "Charni Charm Salon",
    area: "Charni Road",
    coords: { lat: 18.9518, lng: 72.8184 },
    categories: ["Bridal Beauty", "Hair Studio", "Skin & Facial"],
    rating: 4.6,
    reviews: 213,
    basePrice: 1299,
    distanceKm: 8.2,
    responseMins: 18,
    hygieneScore: 95,
    homeVisit: true,
    bridalReady: true,
    luxury: false,
    slots: ["11:00 AM", "3:00 PM", "6:00 PM"],
    tags: ["Home visit", "Draping", "Skin prep"],
    specialty: "Draping, party makeup, skin prep and hair styling.",
  },
  {
    id: "mahim-muse",
    name: "Mahim Muse Studio",
    area: "Mahim",
    coords: { lat: 19.035, lng: 72.8402 },
    categories: ["Hair Studio", "Skin & Facial", "Nails & Spa"],
    rating: 4.5,
    reviews: 226,
    basePrice: 899,
    distanceKm: 3.8,
    responseMins: 16,
    hygieneScore: 94,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["10:30 AM", "2:00 PM", "7:00 PM"],
    tags: ["Hair spa", "Nails", "Facial"],
    specialty: "Hair spa, facials, nail care and everyday salon packages.",
  },
  {
    id: "cst-crown",
    name: "CST Crown Beauty",
    area: "CST",
    coords: { lat: 18.9402, lng: 72.8355 },
    categories: ["Hair Studio", "Skin & Facial"],
    rating: 4.3,
    reviews: 104,
    basePrice: 699,
    distanceKm: 9.0,
    responseMins: 28,
    hygieneScore: 91,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["9:00 AM", "12:30 PM", "5:30 PM"],
    tags: ["Express cut", "Cleanup", "Office ready"],
    specialty: "Quick haircuts, cleanups and commuter-friendly grooming.",
  },
  {
    id: "kalina-kraft",
    name: "Kalina Kraft Salon",
    area: "Kalina",
    coords: { lat: 19.0748, lng: 72.8622 },
    categories: ["Hair Studio", "Bridal Beauty", "Skin & Facial"],
    rating: 4.6,
    reviews: 195,
    basePrice: 1199,
    distanceKm: 3.5,
    responseMins: 15,
    hygieneScore: 94,
    homeVisit: true,
    bridalReady: true,
    luxury: false,
    slots: ["9:45 AM", "1:45 PM", "5:45 PM"],
    tags: ["Home visit", "Party makeup", "Hair care"],
    specialty: "Party makeup, hair care, skin care and home visits.",
  },
  {
    id: "mankhurd-mint",
    name: "Mankhurd Mint Beauty",
    area: "Mankhurd",
    coords: { lat: 19.0495, lng: 72.9304 },
    categories: ["Skin & Facial", "Hair Studio"],
    rating: 4.2,
    reviews: 98,
    basePrice: 599,
    distanceKm: 12.1,
    responseMins: 29,
    hygieneScore: 90,
    homeVisit: true,
    bridalReady: false,
    luxury: false,
    slots: ["10:00 AM", "2:15 PM", "6:15 PM"],
    tags: ["Home visit", "Budget friendly", "Cleanup"],
    specialty: "Budget-friendly home facials, cleanup and basic hair care.",
  },
  {
    id: "tilak-nagar-tint",
    name: "Tilak Nagar Tint Studio",
    area: "Tilak Nagar",
    coords: { lat: 19.0688, lng: 72.8984 },
    categories: ["Hair Studio", "Nails & Spa"],
    rating: 4.4,
    reviews: 146,
    basePrice: 699,
    distanceKm: 9.7,
    responseMins: 22,
    hygieneScore: 92,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["9:30 AM", "1:00 PM", "5:00 PM"],
    tags: ["Hair color", "Manicure", "Value pick"],
    specialty: "Color touchups, haircuts, manicure and simple spa care.",
  },
  {
    id: "malabar-mist",
    name: "Malabar Mist Salon",
    area: "Malabar Hill",
    coords: { lat: 18.9548, lng: 72.7985 },
    categories: ["Bridal Beauty", "Skin & Facial", "Hair Studio"],
    rating: 4.9,
    reviews: 341,
    basePrice: 2999,
    distanceKm: 8.4,
    responseMins: 18,
    hygieneScore: 99,
    homeVisit: true,
    bridalReady: true,
    luxury: true,
    slots: ["11:30 AM", "4:00 PM", "7:00 PM"],
    tags: ["Luxury suite", "Bride trial", "Home visit"],
    specialty: "Luxury bridal prep, skin treatments, makeup and hair care.",
  },
  {
    id: "walkeshwar-willow",
    name: "Walkeshwar Willow Beauty",
    area: "Walkeshwar",
    coords: { lat: 18.9475, lng: 72.7952 },
    categories: ["Skin & Facial", "Nails & Spa"],
    rating: 4.7,
    reviews: 204,
    basePrice: 1499,
    distanceKm: 8.9,
    responseMins: 19,
    hygieneScore: 96,
    homeVisit: false,
    bridalReady: false,
    luxury: true,
    slots: ["10:45 AM", "2:45 PM", "6:45 PM"],
    tags: ["Premium finish", "Skin care", "Gel nails"],
    specialty: "Premium facials, gel nails, spa care and polished finishes.",
  },
  {
    id: "evershine-elegance",
    name: "Evershine Elegance",
    area: "Evershine Nagar",
    coords: { lat: 19.1829, lng: 72.8352 },
    categories: ["Hair Studio", "Bridal Beauty", "Nails & Spa"],
    rating: 4.6,
    reviews: 236,
    basePrice: 1399,
    distanceKm: 11.5,
    responseMins: 17,
    hygieneScore: 95,
    homeVisit: true,
    bridalReady: true,
    luxury: false,
    slots: ["10:15 AM", "1:45 PM", "6:45 PM"],
    tags: ["Home visit", "Bride basic", "Nail care"],
    specialty: "Bridal basics, hair styling, nail care and home visits.",
  },
  {
    id: "magathane-muse",
    name: "Magathane Muse Salon",
    area: "Magathane",
    coords: { lat: 19.2206, lng: 72.8665 },
    categories: ["Hair Studio", "Skin & Facial"],
    rating: 4.4,
    reviews: 129,
    basePrice: 699,
    distanceKm: 15.4,
    responseMins: 24,
    hygieneScore: 92,
    homeVisit: false,
    bridalReady: false,
    luxury: false,
    slots: ["9:45 AM", "12:45 PM", "5:45 PM"],
    tags: ["Haircut", "Detan", "Budget friendly"],
    specialty: "Haircuts, detan, facials and quick grooming support.",
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

type Salon = (typeof salons)[number];
type PaginationItem = number | "ellipsis";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [activeNeed, setActiveNeed] = useState(needPresets[2].id);
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
  }, []);

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
  }, [area, budget, needHomeVisit, query, service, sortBy, userLocation]);

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
    <main className="min-h-screen overflow-x-hidden bg-[#fff9f7] text-[#2d2525]">
      {/* Header keeps navigation and the main booking action available everywhere. */}
      <header className="sticky top-0 z-50 border-b border-[#eadbd6]/80 bg-[#fff9f7]/90 backdrop-blur-xl">
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
          </div>

          <button
            className="motion-button inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#2d2525] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6e3038] sm:h-11 sm:px-4"
            onClick={() => openModal(bestMatch, "booking")}
          >
            <Icon name="calendar" className="h-4 w-4" />
            <span className="hidden min-[380px]:inline">Book now</span>
          </button>
        </nav>
      </header>

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
            className="modal-content-anime max-h-[92vh] w-full max-w-2xl overflow-auto rounded-lg bg-[#fffdfb] p-4 opacity-0 shadow-2xl sm:p-5"
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
                <h2 className="mt-2 text-xl font-semibold sm:text-2xl">{activeSalon.name}</h2>
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
