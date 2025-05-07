# NexusQuiz AI

NexusQuiz AI je webová aplikace, která umožňuje uživatelům generovat kvízy pomocí umělé inteligence (konkrétně OpenAI GPT-4o). Uživatelé mohou zadat text nebo nahrát dokumenty pro automatické vytvoření kvízů, vyplňovat kvízy vytvořené ostatními, spravovat své vlastní kvízy a sledovat svůj pokrok.

*(Volitelné: Sem můžete přidat screenshot nebo GIF aplikace)*

## Klíčové Funkce

* **Generování Kvízů pomocí AI:** Vytváření kvízů z textového vstupu nebo nahraných souborů.
* **Podpora Typů Otázek:** Generuje otázky s výběrem z možností (Multiple Choice) a Pravda/Nepravda (True/False).
* **Autentizace Uživatelů:** Registrace, přihlášení (emailem nebo uživatelským jménem), obnova hesla pomocí obnovovací fráze, ověření emailu.
* **Správa Kvízů:** Uživatelé mohou vytvářet, upravovat a spravovat své kvízy ("Moje Kvízy").
* **Vyplňování Kvízů:** Rozhraní pro absolvování kvízů se sledováním pokroku.
* **Historie a Výsledky:** Zobrazení historie pokusů a detailních výsledků kvízů.
* **Veřejné Kvízy:** Procházení, vyhledávání a vyplňování veřejně dostupných kvízů.
* **Hlasování (Upvoting):** Možnost hlasovat pro oblíbené kvízy.
* **Uživatelské Profily:** Správa informací o uživatelském účtu.
* **Administrátorský Panel:** Rozhraní pro správu uživatelů, kvízů a kategorií.
* **Lokalizace:** Podpora pro Angličtinu (en) a Češtinu (cs).

## Použité Technologie

* **Frontend:** Vue 3, Vite, Vue Router, TypeScript
* **Backend & Databáze:** Supabase
* **AI:** OpenAI API (GPT-4o)
* **Stylování:** CSS
* **Testování:** Vitest
* **Serverless Funkce (pro API):** Node.js (pro ověřování emailů, čištění účtů - relevantní při nasazení na platformy jako Vercel)


## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.