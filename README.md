import React, { useEffect, useMemo, useState } from "react";

// Composant React (prêt à être utilisé dans un projet React / Next.js)
// Problème réparé : le document initial était un fichier HTML (<!DOCTYPE html>...) et
// était chargé comme un fichier TypeScript/TSX (index.tsx). Cela provoquait
// `Unexpected token (1:0)` car TSX/JSX attend du JavaScript/JSX, pas un document HTML entier.
// Solution : fournir un composant React (export default) — valide en .jsx/.tsx — ou
// sauvegarder l'ancien contenu dans un `index.html` si tu veux un fichier HTML statique.

const euro = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const pad = (n) => (n < 10 ? "0" + n : String(n));
const toLocalISODate = (d) => {
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${y}-${m}-${day}`;
};

function sanitizePhoneToDigits(phone) {
  return (phone || "").replace(/\D+/g, "");
}

function makeWhatsAppLink(targetNumberDigits, text) {
  const num = sanitizePhoneToDigits(targetNumberDigits);
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${num}?text=${encoded}`;
}

function makeTelegramLink(username) {
  const handle = (username || "").replace(/^@+/, "");
  return `https://t.me/${handle}`;
}

function buildMessage({ siteTitle, name, email, contactChoice, date, time, duration, notes }) {
  const durationMin = Number(duration || 30);
  const price = (durationMin / 30) * 12;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "local";
  return (
    `Bonjour, je souhaite réserver une séance d'écoute.\n\n` +
    `Nom: ${name || "(non précisé)"}\n` +
    (email ? `Email: ${email}\n` : "") +
    `Canal: ${contactChoice === "whatsapp" ? "WhatsApp" : "Telegram"}\n` +
    `Date: ${date} à ${time} (${tz})\n` +
    `Durée: ${durationMin} minutes\n` +
    `Tarif estimé: ${euro(price)}\n` +
    (notes ? `\nNotes: ${notes}\n` : "") +
    (siteTitle ? `\n(Envoyé depuis: ${siteTitle})` : "")
  );
}

function makeICS({ title, description, startLocal, durationMin }) {
  // startLocal must be a valid Date object
  const start = new Date(startLocal);
  if (isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + durationMin * 60000);
  const toICSDate = (d) => {
    const y = d.getUTCFullYear();
    const m = pad(d.getUTCMonth() + 1);
    const day = pad(d.getUTCDate());
    const h = pad(d.getUTCHours());
    const min = pad(d.getUTCMinutes());
    const s = pad(d.getUTCSeconds());
    return `${y}${m}${day}T${h}${min}${s}Z`;
  };
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@ecoute.local`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ecoute//RendezVous//FR",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  return URL.createObjectURL(blob);
}

export default function RendezVousEcoute() {
  const [+261382084226, +261382084226] = useState("");
  const [ownerTelegram, setOwnerTelegram] = useState("");
  const [siteTitle, setSiteTitle] = useState("Écoute & Soutien – Rendez-vous en ligne");

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactChoice, setContactChoice] = useState("whatsapp");
  const [date, setDate] = useState(() => toLocalISODate(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    // restore owner settings if present
    try {
      const saved = JSON.parse(localStorage.getItem("ecoute_owner_settings") || "{}");
      if (saved.ownerWhatsApp) setOwnerWhatsApp(saved.ownerWhatsApp);
      if (saved.ownerTelegram) setOwnerTelegram(saved.ownerTelegram);
      if (saved.siteTitle) setSiteTitle(saved.siteTitle);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "ecoute_owner_settings",
      JSON.stringify({ ownerWhatsApp, ownerTelegram, siteTitle })
    );
  }, [ownerWhatsApp, ownerTelegram, siteTitle]);

  const price = useMemo(() => (Number(duration) / 30) * 12, [duration]);
  const message = useMemo(
    () => buildMessage({ siteTitle, name, email, contactChoice, date, time, duration, notes }),
    [siteTitle, name, email, contactChoice, date, time, duration, notes]
  );

  const startLocalDate = useMemo(() => {
    // return a Date or Invalid Date
    return new Date(`${date}T${time}`);
  }, [date, time]);

  const icsHref = useMemo(() => {
    const url = makeICS({ title: "Séance d'écoute (12 €/30 min)", description: message, startLocal: startLocalDate, durationMin: Number(duration) });
    return url;
  }, [message, startLocalDate, duration]);

  // revoke old ICS URLs when component unmounts or when icsHref changes
  useEffect(() => {
    return () => {
      try { if (icsHref) URL.revokeObjectURL(icsHref); } catch (e) {}
    };
  }, [icsHref]);

  function handleCopy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert("Message copié dans le presse-papiers.");
      }).catch(() => alert("Impossible de copier automatiquement. Copiez manuellement."));
    } else {
      alert("Votre navigateur ne permet pas la copie automatique.");
    }
  }

  const ownerContactOK = useMemo(() => {
    if (contactChoice === "whatsapp") return ownerWhatsApp.trim().length >= 8;
    return ownerTelegram.trim().length >= 2;
  }, [contactChoice, ownerWhatsApp, ownerTelegram]);

  const canSubmit = name.trim() && consent && ownerContactOK && date && time;

  function handleSend(e) {
    e && e.preventDefault();
    if (!canSubmit) {
      alert("Merci de compléter les informations requises et d'indiquer vos coordonnées (WhatsApp ou Telegram).\n\nVérifiez également la case de consentement.");
      return;
    }

    if (contactChoice === "whatsapp") {
      const link = makeWhatsAppLink(ownerWhatsApp, message);
      window.open(link, "_blank");
    } else {
      const tg = makeTelegramLink(ownerTelegram);
      handleCopy(message);
      window.open(tg, "_blank");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">{siteTitle}</h1>
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">12 € / 30 min</span>
            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">WhatsApp ou Telegram</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6 md:grid-cols-3">
        <section className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-2">Réserver une séance</h2>
            <p className="text-sm text-gray-600 mb-4">Séance confidentielle et bienveillante. Choisissez votre créneau ci‑dessous. Le paiement s'organise après confirmation.</p>

            <form onSubmit={handleSend} className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Nom complet *</label>
                <input className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Votre nom" />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Email (optionnel)</label>
                <input type="email" className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="vous@exemple.com" />
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Date *</label>
                <input type="date" min={toLocalISODate(new Date())} className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={date} onChange={(e)=>setDate(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Heure (votre fuseau) *</label>
                <input type="time" className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={time} onChange={(e)=>setTime(e.target.value)} />
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Durée *</label>
                <select className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" value={duration} onChange={(e)=>setDuration(Number(e.target.value))}>
                  <option value={30}>30 minutes (12 €)</option>
                  <option value={60}>60 minutes (24 €)</option>
                  <option value={90}>90 minutes (36 €)</option>
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Préférence de contact *</label>
                <div className="flex gap-3 items-center">
                  <label className="flex items-center gap-2"><input type="radio" name="contactChoice" checked={contactChoice==="whatsapp"} onChange={()=>setContactChoice("whatsapp")} /> WhatsApp</label>
                  <label className="flex items-center gap-2"><input type="radio" name="contactChoice" checked={contactChoice==="telegram"} onChange={()=>setContactChoice("telegram")} /> Telegram</label>
                </div>
              </div>

              <div className="grid gap-1 md:col-span-2">
                <label className="text-sm font-medium">Notes (optionnel)</label>
                <textarea className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[90px]" value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Souhaitez-vous préciser un sujet, une langue, etc. ?" />
              </div>

              <div className="md:col-span-2 flex items-start gap-3">
                <input id="consent" type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} className="mt-1" />
                <label htmlFor="consent" className="text-sm text-gray-700">J'accepte d'être contacté(e) pour confirmer ce rendez‑vous et je consens au traitement de ces informations pour la prise de rendez‑vous.</label>
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-3">
                <div>
                  <div className="text-sm text-gray-600">Total estimé</div>
                  <div className="text-2xl font-semibold">{euro(price)}</div>
                  <div className="text-xs text-gray-500">Tarif fixe : 12 € par tranche de 30 minutes.</div>
                </div>
                <div className="flex gap-3">
                  {icsHref ? (
                    <a href={icsHref} download={`rendez-vous-ecoute-${date}-${time}.ics`} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800">Ajouter au calendrier</a>
                  ) : (
                    <button type="button" className="px-4 py-2 rounded-xl bg-gray-100 text-gray-400" disabled>Heure invalide</button>
                  )}
                  <button type="button" onClick={()=>handleCopy(message)} className="px-4 py-2 rounded-xl bg-white border hover:bg-gray-50">Copier le récapitulatif</button>
                  <button type="submit" className={`px-4 py-2 rounded-xl text-white ${canSubmit?"bg-indigo-600 hover:bg-indigo-700":"bg-indigo-300 cursor-not-allowed"}`}>
                    Envoyer la demande
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        <aside className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="font-semibold mb-3">Coordonnées du praticien</h3>
            <p className="text-sm text-gray-600 mb-3">Renseignez vos identifiants (stockés en local pour faciliter le test).</p>
            <div className="grid gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Numéro WhatsApp (international)</label>
                <input className="border rounded-xl px-3 py-2" value={ownerWhatsApp} onChange={(e)=>setOwnerWhatsApp(e.target.value)} placeholder="ex. +2613XXXXXXXX" />
                <div className="text-xs text-gray-500">Format conseillé : +[indicatif][numéro]</div>
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Username Telegram</label>
                <input className="border rounded-xl px-3 py-2" value={ownerTelegram} onChange={(e)=>setOwnerTelegram(e.target.value)} placeholder="ex. @VotreHandle" />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Titre du site</label>
                <input className="border rounded-xl px-3 py-2" value={siteTitle} onChange={(e)=>setSiteTitle(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="font-semibold mb-2">Comment ça marche ?</h3>
            <ol className="list-decimal ml-5 text-sm space-y-1 text-gray-700">
              <li>Choisissez votre date, heure et durée.</li>
              <li>Indiquez votre préférence : WhatsApp ou Telegram.</li>
              <li>Envoyez la demande : une conversation s'ouvre avec le praticien pour confirmer.</li>
              <li>Le paiement (12 €/30 min) est finalisé après confirmation.</li>
            </ol>
            <div className="mt-3 text-xs text-gray-500">Astuce : pour Telegram, le message est copié automatiquement, puis ouvre le lien pour coller dans la discussion si besoin.</div>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="font-semibold mb-2">FAQ express</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-medium">Confidentialité</p>
                <p>Vos informations ne sont utilisées que pour organiser le rendez‑vous. Pas de création de compte.</p>
              </div>
              <div>
                <p className="font-medium">Fuseau horaire</p>
                <p>Les heures affichées correspondent à votre fuseau local (navigateur).</p>
              </div>
              <div>
                <p className="font-medium">Moyens de paiement</p>
                <p>À définir lors de la confirmation (ex. virement, carte, mobile money). Le tarif est fixe : 12 € par 30 minutes.</p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="border-t bg-white">
        <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-gray-600 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} Écoute & Soutien. Tous droits réservés.</div>
          <div className="flex gap-4">
            <a className="hover:underline" href="#">Mentions légales</a>
            <a className="hover:underline" href="#">Politique de confidentialité</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
