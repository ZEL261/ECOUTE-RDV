<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Écoute & Soutien – Rendez-vous</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
</head>
<body class="bg-gray-50 text-gray-900">
  <header class="bg-white sticky top-0 z-10 shadow-sm">
    <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
      <h1 class="text-xl font-bold">Écoute & Soutien – Rendez-vous en ligne</h1>
      <div class="hidden sm:flex gap-2 text-sm">
        <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">12 € / 30 min</span>
        <span class="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">WhatsApp ou Telegram</span>
      </div>
    </div>
  </header>

  <main class="max-w-4xl mx-auto px-4 py-8">
    <div class="bg-white rounded-2xl shadow p-6">
      <h2 class="text-lg font-semibold mb-4">Réserver une séance</h2>
      <form id="rdvForm" class="grid gap-4">
        <input type="text" id="name" placeholder="Votre nom complet" required class="border rounded-xl px-3 py-2">
        <input type="email" id="email" placeholder="Votre email (optionnel)" class="border rounded-xl px-3 py-2">
        <input type="date" id="date" required class="border rounded-xl px-3 py-2">
        <input type="time" id="time" required class="border rounded-xl px-3 py-2">
        <select id="duration" class="border rounded-xl px-3 py-2">
          <option value="30">30 minutes (12 €)</option>
          <option value="60">60 minutes (24 €)</option>
          <option value="90">90 minutes (36 €)</option>
        </select>
        <div>
          <label><input type="radio" name="contact" value="whatsapp" checked> WhatsApp</label>
          <label class="ml-4"><input type="radio" name="contact" value="telegram"> Telegram</label>
        </div>
        <textarea id="notes" placeholder="Notes (optionnel)" class="border rounded-xl px-3 py-2"></textarea>
        <label class="text-sm"><input type="checkbox" id="consent" required> J'accepte d’être contacté(e).</label>

        <button type="submit" class="px-4 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700">Envoyer la demande</button>
      </form>
    </div>
  </main>

  <footer class="border-t bg-white">
    <div class="max-w-4xl mx-auto px-4 py-6 text-sm text-gray-600 flex justify-between">
      <div>© 2025 Écoute & Soutien</div>
      <div class="flex gap-4">
        <a href="#" class="hover:underline">Mentions légales</a>
        <a href="#" class="hover:underline">Confidentialité</a>
      </div>
    </div>
  </footer>

  <script>
    const ownerWhatsApp = "+33612345678"; // Ton numéro WhatsApp
    const ownerTelegram = "VotreHandle";   // Ton @Telegram

    document.getElementById("rdvForm").addEventListener("submit", function(e) {
      e.preventDefault();

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const date = document.getElementById("date").value;
      const time = document.getElementById("time").value;
      const duration = document.getElementById("duration").value;
      const notes = document.getElementById("notes").value;
      const contact = document.querySelector("input[name='contact']:checked").value;

      const price = (duration / 30) * 12;
      const message = `Bonjour, je souhaite réserver une séance d'écoute.\n\nNom: ${name}\nEmail: ${email}\nDate: ${date} à ${time}\nDurée: ${duration} minutes\nTarif estimé: ${price} €\nNotes: ${notes}`;

      if (contact === "whatsapp") {
        const url = `https://wa.me/${ownerWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
      } else {
        const url = `https://t.me/${ownerTelegram}`;
        navigator.clipboard.writeText(message);
        alert("Message copié. Ouvre Telegram et colle-le si besoin.");
        window.open(url, "_blank");
      }
    });
  </script>
</body>
</html>
