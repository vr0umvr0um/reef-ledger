# Reef Ledger

Suivi de progression et planificateur quotidien **non officiel** pour Coral Island.
Application web installable (PWA) : elle fonctionne hors ligne, s'installe sur téléphone et ordinateur, et
ne dépend d'aucun compte ni d'aucun serveur. Vos données restent sur votre appareil.

## Ce qu'elle contient

Barre de contexte permanente (date, heure, météo) et 5 onglets :

- **Today** : plan du jour, conseils du jour, « ce qui mord maintenant », routine, favoris, derniers cochés.
- **Planner** : to-do, notes et calendrier des saisons.
- **Field Guide** (au centre) : recherche globale et accès à tout : catchable right now, route du jour,
  meilleure culture à planter, planificateur de cadeaux, villageois, poissons, insectes, créatures marines,
  gemmes, fossiles, artefacts, recettes, offrandes, quêtes, outils et compétences, conseils.
- **Progress** : vue d'ensemble, liste du musée par section (avec « Select all »), offrandes du temple.
- **Settings** : installation, thème, sauvegarde et restauration.

## Mettre l'appli en ligne (nécessaire pour l'installer sur téléphone)

Une PWA doit être servie en **HTTPS**. Les fichiers à publier sont : `index.html`, `styles.css`, `app.js`,
`data.js`, `tips.js`, `sw.js`, `manifest.webmanifest`, `fonts/`, `icons/` (le dossier `tools/` est facultatif).
L'archive `reef-ledger-site.zip` contient exactement ces fichiers.

### Option A : GitHub Pages (gratuit, recommandé)
1. Créez un dépôt public sur github.com (par exemple `reef-ledger`).
2. Envoyez-y les fichiers ci-dessus (bouton *Add file → Upload files*).
3. Dans *Settings → Pages*, choisissez *Deploy from a branch*, branche `main`, dossier `/ (root)`.
4. Après une minute, l'appli est sur `https://VOTRE-NOM.github.io/reef-ledger/`.

### Option B : Netlify ou Cloudflare Pages
Déposez le dossier (ou l'archive) sur `app.netlify.com/drop` ou dans un projet Cloudflare Pages.
Créez un compte pour que le site reste en ligne.

## Installer

- **Android (Chrome, Edge)** : ouvrez l'adresse, puis « Installer l'application » (ou bouton *Install app* dans l'appli).
- **iPhone / iPad (Safari)** : bouton Partager, puis « Sur l'écran d'accueil ».
- **Ordinateur (Chrome, Edge)** : icône d'installation dans la barre d'adresse.

## Passer d'un appareil à l'autre

Pas de synchro automatique : *Settings → Save backup file* sur un appareil, puis *Choose a backup file* sur l'autre.
(Une vraie synchro demanderait un compte en ligne, par exemple Firebase ou Supabase ; possible à ajouter.)

## Essayer en local

```
node tools/serve.js
```
puis ouvrez http://localhost:8080 (localhost compte comme connexion sécurisée, l'installation et le hors-ligne fonctionnent).
Depuis un téléphone, un serveur local en HTTP simple ne permet pas l'installation : il faut la version en ligne.

## Mettre à jour

- Modifiez les fichiers, puis **changez `VERSION` dans `sw.js`** (par exemple `reefledger-v2`) : sans cela, les
  appareils qui ont déjà installé l'appli gardent l'ancienne version en cache.
- Rafraîchir les données depuis le wiki : `node tools/build_data.js` puis `node tools/make_data_js.js`.
- Régénérer les icônes : `node tools/make_icons.js`. Vérification rapide : `node tools/smoke.js`.

## Données et licence

Les listes (objets, saisons, anniversaires, cadeaux, recettes, offrandes, quêtes) proviennent du
[Coral Island Wiki](https://coralisland.fandom.com/) sur Fandom, sous licence CC BY-SA : gardez cette mention si
vous republiez l'appli. Le wiki peut avoir du retard sur la dernière version du jeu (d'autres applications
recensent par exemple 6 autels et 32 offrandes, contre 5 autels et 28 offrandes ici).
Polices : Bricolage Grotesque et Figtree (SIL Open Font License), embarquées.
Application fan-made, non affiliée à Stairway Games ni à Humble Games.
