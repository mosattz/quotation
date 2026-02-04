import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { getAuthUser } from "../utils/auth";

const STORAGE_KEY = "quotation.lang";

const translations = {
  sw: {
    // Common
    "common.language": "Lugha",
    "common.english": "Kiingereza",
    "common.swahili": "Kiswahili",
    "common.login": "Ingia",
    "common.logout": "Toka",
    "common.registerTechnician": "Sajili Fundi",
    "common.submit": "Wasilisha",
    "common.save": "Hifadhi",
    "common.cancel": "Ghairi",
    "common.close": "Funga",
    "common.loading": "Inapakia...",
    "common.search": "Tafuta",
    "common.reset": "Rejesha",
    "common.zone": "Zone",
    "common.distance": "Umbali",
    "common.pipe": "Bomba",
    "common.customer": "Mteja",

    // Landing
    "landing.tagline": "Maombi ya mafundi • Mapitio ya msimamizi • Nukuu PDF / Excel",
    "landing.quickGuide": "Mwongozo wa Haraka",
    "landing.heroTitle": "Wasilisha maombi kwa usahihi mara ya kwanza.",
    "landing.heroBody":
      "Mafundi hukusanya mahitaji ya wateja eneo la kazi. Mfumo hutafuta bei kwenye orodha ya bidhaa na kutoa nukuu safi yenye jumla na gharama nyingine.",
    "landing.requiredLabel": "Vinahitajika",
    "landing.requiredValue": "Mteja, eneo (zone), umbali, size ya bomba, vifaa",
    "landing.bestPracticeLabel": "Ushauri",
    "landing.bestPracticeValue": "Tumia mapendekezo (autocomplete) ya jina la bidhaa",
    "landing.step1Title": "Ingiza taarifa za mteja + eneo",
    "landing.step1Body":
      "Tumia jina la mteja (au kampuni), chagua zone sahihi, na ingiza umbali na size ya bomba kama namba.",
    "landing.step2Title": "Ongeza bidhaa na unit + quantity sahihi",
    "landing.step2Body":
      "Ongeza kila bidhaa inayohitajika. Hakikisha unit (PC, M, BOX, n.k.) na idadi (qty) ni sahihi.",
    "landing.step3Title": "Andika majina ya bidhaa kwa makini (inapendekezwa)",
    "landing.step3Body":
      "Anza kuandika kisha chagua kwenye mapendekezo. Hii huongeza usahihi wa bei (epuka maneno ya ziada; weka size kama 2'' x 2'').",
    "landing.tipsTitle": "Vidokezo vya fundi kwa ulinganifu sahihi",
    "landing.tipsSubtitle":
      "Tofauti ndogo za uandishi zinaweza kubadili ulinganifu wa bei. Fuata haya ili kupata nukuu sahihi.",
    "landing.tipAutocompleteTitle": "Tumia mapendekezo (autocomplete)",
    "landing.tipAutocompleteBody":
      "Anza kuandika jina la bidhaa na chagua kwenye orodha. Hii huendana na catalog na kuzuia rate ya 0.00.",
    "landing.tipSizeTitle": "Weka taarifa ya size",
    "landing.tipSizeBody":
      "Kama bidhaa ina size (mfano: 2'' x 2''), iandike kwenye jina. Mfumo hutumia size kuchagua bidhaa sahihi.",
    "landing.tipUnitTitle": "Chagua unit sahihi",
    "landing.tipUnitBody":
      "Chagua unit sahihi (PC, M, %, BOX). Unit isiyo sahihi huleta mkanganyiko na nukuu isiyo sahihi.",
    "landing.tipExtraWordsTitle": "Epuka maneno ya ziada",
    "landing.tipExtraWordsBody":
      "Usiongeze maelezo yasiyo lazima. Mfano: andika “Seal tape” kisha chagua kwenye mapendekezo.",
    "landing.tipReviewTitle": "Hakiki kabla ya kuwasilisha",
    "landing.tipReviewBody":
      "Hakiki bidhaa, idadi, umbali, na size ya bomba kabla ya kuwasilisha. Admin hutumia data hii moja kwa moja.",
    "landing.tipSearchTitle": "Kama hujui, tafuta kisha chagua",
    "landing.tipSearchBody":
      "Andika maneno 2–3 (mfano: “tee connector 2”) kisha chagua pendekezo lililo karibu.",
    "landing.zonesTitle": "Zones (dropdown)",
    "landing.zonesValue":
      "CHALINZE, MDAULA, MSOGA, LUGOBA, MSATA, KIWANGWA, MBWEWE, MIONO",
    "landing.nextTitle": "Hatua inayofuata",
    "landing.nextBody":
      "Ingia kama Admin kuona maombi na kupakua nukuu (PDF/Excel), au sajili mafundi kuanza kuwasilisha maombi.",
    "landing.goToLogin": "Nenda kwenye Ingia",

    // Auth
    "auth.loginTitle": "Quotation System",
    "auth.loginSubtitle": "Ingia kuendelea",
    "auth.email": "Barua pepe",
    "auth.password": "Nenosiri",
    "auth.invalidCredentials": "Taarifa si sahihi. Tafadhali jaribu tena.",
    "auth.signingIn": "Inaingia...",
    "auth.registerTitle": "Usajili wa Fundi",
    "auth.registerSubtitle": "Tengeneza akaunti ili kuwasilisha maombi",
    "auth.fullName": "Jina kamili",
    "auth.phone": "Simu",
    "auth.selectZone": "Chagua zone",
    "auth.creatingAccount": "Inaunda akaunti...",
    "auth.register": "Sajili",
    "auth.registrationFailed": "Usajili umeshindikana. Jaribu barua pepe nyingine.",

    // Admin
    "admin.title": "Admin Dashboard",
    "admin.subtitle": "Kagua maombi yaliyowasilishwa na shughuli za mafundi.",
    "admin.ordersTab": "Orders Details",
    "admin.techTab": "Technicians",
    "admin.totalOrders": "Jumla ya Maombi",
    "admin.totalItems": "Jumla ya Bidhaa",
    "admin.latestUpdate": "Taarifa ya Mwisho",
    "admin.noSubmissions": "Hakuna maombi bado",
    "admin.filtersTitle": "Vichujio",
    "admin.filterCustomer": "Mteja",
    "admin.filterCustomerPh": "Tafuta jina la mteja",
    "admin.filterTechnician": "Fundi",
    "admin.filterZone": "Zone",
    "admin.filterStartDate": "Tarehe kuanzia",
    "admin.filterEndDate": "Tarehe hadi",
    "admin.dateRange": "Kipindi cha tarehe",
    "admin.allTechnicians": "Mafundi wote",
    "admin.allZones": "Zones zote",
    "admin.applyFilters": "Tumia Vichujio",
    "admin.filtered": "imechujwa",
    "admin.ordersShown": "{count} maombi yameoneshwa",
    "admin.submittedOrders": "Maombi Yaliyowasilishwa",
    "admin.registeredTechnicians": "Mafundi Waliosajiliwa",
    "admin.downloadExcel": "Pakua Excel",
    "admin.downloadPdf": "Pakua PDF",
    "admin.orderFor": "Ombi la {name}",
    "admin.loadingOrders": "Inapakia maombi...",
    "admin.noOrders": "Hakuna maombi bado. Wasilisha ombi kutoka Technician Dashboard.",
    "admin.tableItem": "Bidhaa",
    "admin.tableUnit": "Unit",
    "admin.tableQty": "Qty",
    "admin.tableRate": "Rate",
    "admin.tableAmount": "Amount",
    "admin.materialCost": "MATERIAL COST",
    "admin.otherCharges": "OTHER CHARGES COST",
    "admin.grandTotal": "GRAND TOTAL",
    "admin.excavation": "Excavation and backfilling",
    "admin.labour": "Labour charges",
    "admin.supervision": "Supervision charges",
    "admin.excel": "Excel",
    "admin.pdf": "PDF",
    "admin.edit": "Edit",
    "admin.delete": "Delete",
    "admin.loadingTechs": "Inapakia mafundi...",
    "admin.noTechs": "Hakuna mafundi waliosajiliwa bado.",
    "admin.profile": "Profile",
    "admin.viewOrders": "View Orders",
    "admin.ordersCount": "Maombi",
    "admin.actions": "Vitendo",
    "admin.showingFor": "Inaonyesha maombi ya fundi: {name}",

    // Technician
    "tech.title": "Technician Dashboard",
    "tech.subtitle": "Wasilisha maombi ya wateja kutoka eneo la kazi.",
    "tech.orderDetails": "Order Details",
    "tech.orderDetailsSub": "Jaza taarifa za mteja na bidhaa zinazo hitajika.",
    "tech.statusSuccess": "Ombi limewasilishwa.",
    "tech.statusFail": "Imeshindwa kuwasilisha ombi.",
    "tech.validationRequired": "Tafadhali jaza sehemu zote zinazohitajika.",
    "tech.validationNumeric": "Umbali na size ya bomba lazima ziwe namba.",
    "tech.validationItems": "Tafadhali ongeza angalau bidhaa moja.",
    "tech.validationItemFields": "Kila bidhaa lazima iwe na jina, unit, na quantity.",
    "tech.zoneLabel": "ZONE",
    "tech.customerLabel": "JINA LA MTEJA",
    "tech.distanceLabel": "UMBALI TOKA BOMBA KUBWA",
    "tech.pipeSizeLabel": "SIZE YA BOMBA KUBWA",
    "tech.choose": "Chagua",
    "tech.enterNumber": "Ingiza namba",
    "tech.itemsTitle": "Orodha ya Vifaa vya Mteja",
    "tech.addItem": "+ Ongeza Bidhaa",
    "tech.noItems": "Hakuna bidhaa bado. Bonyeza “Ongeza Bidhaa” kuanza.",
    "tech.notesTitle": "Maelezo",
    "tech.notesBody": "Ongeza bidhaa zote muhimu kabla ya kuwasilisha.",

    // Settings
    "settings.title": "Mipangilio",
    "settings.subtitle": "Badilisha mipangilio ya akaunti yako.",
    "settings.languageHelp": "Chagua lugha utakayotumia kwenye mfumo huu.",
  },
  en: {
    // Common
    "common.language": "Language",
    "common.english": "English",
    "common.swahili": "Swahili",
    "common.login": "Login",
    "common.logout": "Logout",
    "common.registerTechnician": "Register Technician",
    "common.submit": "Submit",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.loading": "Loading...",
    "common.search": "Search",
    "common.reset": "Reset",
    "common.zone": "Zone",
    "common.distance": "Distance",
    "common.pipe": "Pipe",
    "common.customer": "Customer",

    // Landing
    "landing.tagline": "Technician orders • Admin review • PDF / Excel quotations",
    "landing.quickGuide": "Quick Guide",
    "landing.heroTitle": "Submit orders correctly the first time.",
    "landing.heroBody":
      "Technicians collect customer requirements in the field. The system finds item prices from the catalog and produces a clean quotation with totals and charges.",
    "landing.requiredLabel": "Required",
    "landing.requiredValue": "Customer, zone, distance, pipe size, items",
    "landing.bestPracticeLabel": "Best practice",
    "landing.bestPracticeValue": "Use autocomplete for item names",
    "landing.step1Title": "Enter customer + location details",
    "landing.step1Body":
      "Use the customer name (or company name), select the correct zone, and enter distance and main pipe size as numbers.",
    "landing.step2Title": "Add items with correct unit + quantity",
    "landing.step2Body":
      "Add each requested item. Always select the correct unit (PC, M, BOX, etc.) and quantity.",
    "landing.step3Title": "Type item names carefully (recommended)",
    "landing.step3Body":
      "Start typing and choose from suggestions. This improves price matching accuracy (avoid extra words; include the size like 2'' x 2'' when needed).",
    "landing.tipsTitle": "Technician tips for accurate matching",
    "landing.tipsSubtitle":
      "Small typing differences can change price matching. Use these rules to get accurate quotations.",
    "landing.tipAutocompleteTitle": "Use autocomplete",
    "landing.tipAutocompleteBody":
      "Start typing the item name and select from the dropdown. This matches the catalog and prevents 0.00 rates.",
    "landing.tipSizeTitle": "Include size information",
    "landing.tipSizeBody":
      "If the item has sizes (example: 2'' x 2''), include them in the name. The system uses size tokens to choose the correct entry.",
    "landing.tipUnitTitle": "Pick the correct unit",
    "landing.tipUnitBody":
      "Always select the right unit (PC, M, %, BOX). Wrong units can create confusion and incorrect quotations.",
    "landing.tipExtraWordsTitle": "Avoid extra words",
    "landing.tipExtraWordsBody":
      "Don’t add unnecessary words. Example: write “Seal tape” (then pick from suggestions) instead of long descriptions.",
    "landing.tipReviewTitle": "Double-check before submitting",
    "landing.tipReviewBody":
      "Review items, quantities, distance, and pipe size before submit. Admin exports use this data directly.",
    "landing.tipSearchTitle": "If unsure, search then select",
    "landing.tipSearchBody":
      "Type 2–3 keywords (e.g., “tee connector 2”) and pick the closest suggestion from the list.",
    "landing.zonesTitle": "Zones (dropdown)",
    "landing.zonesValue":
      "CHALINZE, MDAULA, MSOGA, LUGOBA, MSATA, KIWANGWA, MBWEWE, MIONO",
    "landing.nextTitle": "Next",
    "landing.nextBody":
      "Login as Admin to review orders and download PDF/Excel quotations, or register technicians to start submitting orders.",
    "landing.goToLogin": "Go to Login",

    // Auth
    "auth.loginTitle": "Quotation System",
    "auth.loginSubtitle": "Sign in to continue",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.invalidCredentials": "Invalid credentials. Please try again.",
    "auth.signingIn": "Signing in...",
    "auth.registerTitle": "Technician Registration",
    "auth.registerSubtitle": "Create your account to submit orders",
    "auth.fullName": "Full name",
    "auth.phone": "Phone",
    "auth.selectZone": "Select zone",
    "auth.creatingAccount": "Creating account...",
    "auth.register": "Register",
    "auth.registrationFailed": "Registration failed. Try another email.",

    // Admin
    "admin.title": "Admin Dashboard",
    "admin.subtitle": "Review submitted orders and technician activity.",
    "admin.ordersTab": "Orders Details",
    "admin.techTab": "Technicians",
    "admin.totalOrders": "Total Orders",
    "admin.totalItems": "Total Items",
    "admin.latestUpdate": "Latest Update",
    "admin.noSubmissions": "No submissions yet",
    "admin.filtersTitle": "Filters",
    "admin.filterCustomer": "Customer",
    "admin.filterCustomerPh": "Search customer name",
    "admin.filterTechnician": "Technician",
    "admin.filterZone": "Zone",
    "admin.filterStartDate": "Start date",
    "admin.filterEndDate": "End date",
    "admin.dateRange": "Date range",
    "admin.allTechnicians": "All technicians",
    "admin.allZones": "All zones",
    "admin.applyFilters": "Apply Filters",
    "admin.filtered": "filtered",
    "admin.ordersShown": "{count} orders shown",
    "admin.submittedOrders": "Submitted Orders",
    "admin.registeredTechnicians": "Registered Technicians",
    "admin.downloadExcel": "Download Excel",
    "admin.downloadPdf": "Download PDF",
    "admin.orderFor": "Order for {name}",
    "admin.loadingOrders": "Loading orders...",
    "admin.noOrders": "No orders saved yet. Submit an order from Technician Dashboard.",
    "admin.tableItem": "Item",
    "admin.tableUnit": "Unit",
    "admin.tableQty": "Qty",
    "admin.tableRate": "Rate",
    "admin.tableAmount": "Amount",
    "admin.materialCost": "MATERIAL COST",
    "admin.otherCharges": "OTHER CHARGES COST",
    "admin.grandTotal": "GRAND TOTAL",
    "admin.excavation": "Excavation and backfilling",
    "admin.labour": "Labour charges",
    "admin.supervision": "Supervision charges",
    "admin.excel": "Excel",
    "admin.pdf": "PDF",
    "admin.edit": "Edit",
    "admin.delete": "Delete",
    "admin.loadingTechs": "Loading technicians...",
    "admin.noTechs": "No technicians registered yet.",
    "admin.profile": "Profile",
    "admin.viewOrders": "View Orders",
    "admin.ordersCount": "Orders",
    "admin.actions": "Actions",
    "admin.showingFor": "Showing orders for technician: {name}",

    // Technician
    "tech.title": "Technician Dashboard",
    "tech.subtitle": "Submit customer orders from the field.",
    "tech.orderDetails": "Order Details",
    "tech.orderDetailsSub": "Fill out customer information and requested items.",
    "tech.statusSuccess": "Order submitted.",
    "tech.statusFail": "Failed to submit order.",
    "tech.validationRequired": "Please fill all required fields.",
    "tech.validationNumeric": "Distance and pipe size must be numeric.",
    "tech.validationItems": "Please add at least one item.",
    "tech.validationItemFields": "Each item must have name, unit, and quantity.",
    "tech.zoneLabel": "ZONE",
    "tech.customerLabel": "CUSTOMER NAME",
    "tech.distanceLabel": "DISTANCE FROM MAIN PIPE",
    "tech.pipeSizeLabel": "MAIN PIPE SIZE",
    "tech.choose": "Choose",
    "tech.enterNumber": "Enter number",
    "tech.itemsTitle": "Customer Items",
    "tech.addItem": "+ Add Item",
    "tech.noItems": "No items yet. Click “Add Item” to get started.",
    "tech.notesTitle": "Notes",
    "tech.notesBody": "Add all required items for the job before submitting.",

    // Settings
    "settings.title": "Settings",
    "settings.subtitle": "Manage your preferences.",
    "settings.languageHelp": "Choose the language used across the system.",
  },
};

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

function getInitialLang() {
  const user = getAuthUser();
  const userKey = user?.id ? `user:${user.id}` : user?.email ? `user:${user.email}` : "guest";
  const key = `${STORAGE_KEY}:${userKey}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored === "en" || stored === "sw") return stored;
  } catch {
    // ignore
  }
  return "sw";
}

const I18nContext = createContext({
  lang: "sw",
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  useEffect(() => {
    const syncFromStorage = () => {
      const user = getAuthUser();
      const userKey = user?.id
        ? `user:${user.id}`
        : user?.email
          ? `user:${user.email}`
          : "guest";
      const key = `${STORAGE_KEY}:${userKey}`;
      try {
        const stored = localStorage.getItem(key);
        const next = stored === "en" || stored === "sw" ? stored : "sw";
        setLangState(next);
      } catch {
        setLangState("sw");
      }
    };

    // Initial sync and on auth change.
    syncFromStorage();
    window.addEventListener("quotation:auth", syncFromStorage);
    return () => window.removeEventListener("quotation:auth", syncFromStorage);
  }, []);

  const setLang = (next) => {
    const user = getAuthUser();
    const userKey = user?.id ? `user:${user.id}` : user?.email ? `user:${user.email}` : "guest";
    const key = `${STORAGE_KEY}:${userKey}`;
    const value = next === "en" ? "en" : "sw";
    setLangState(value);
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  };

  const value = useMemo(() => {
    const dict = translations[lang] || translations.sw;
    const t = (key, vars) => {
      const raw = dict[key] ?? translations.sw[key] ?? key;
      return interpolate(raw, vars);
    };
    return { lang, setLang, t };
  }, [lang]);

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}
