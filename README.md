# SkapAuto Password Manager pour Firefox

Une extension Firefox pour récupérer et gérer les mots de passe de Skap.

## Fonctionnalités

- Chargement d'un fichier client Skap
- Authentification avec le serveur Skap
- Récupération des mots de passe stockés
- Affichage des mots de passe dans la console
- Copie des mots de passe dans le presse-papiers
- Remplissage automatique des formulaires de connexion

## Installation

### Prérequis

- [Bun](https://bun.sh/) (gestionnaire de paquets)
- [Node.js](https://nodejs.org/) (environnement d'exécution)

### Installation des dépendances

```bash
# Installer les dépendances
bun install
```

### Compilation

```bash
# Compiler l'extension
bun run build
```

Le résultat de la compilation se trouve dans le dossier `dist`.

### Installation de l'extension dans Firefox

1. Ouvrir Firefox et aller à `about:debugging#/runtime/this-firefox`
2. Cliquer sur "Charger un module complémentaire temporaire"
3. Sélectionner le fichier `manifest.json` dans le dossier `dist` de ce projet

Pour une installation permanente :

1. Compresser le dossier `dist` en fichier ZIP
2. Renommer l'extension du fichier de `.zip` à `.xpi`
3. Aller à `about:addons` dans Firefox
4. Cliquer sur l'icône d'engrenage et sélectionner "Installer un module depuis un fichier..."
5. Sélectionner le fichier `.xpi` créé précédemment

## Utilisation

1. Cliquer sur l'icône de l'extension dans la barre d'outils de Firefox
2. Charger votre fichier client Skap (.bin)
3. Entrer votre UUID
4. Cliquer sur "S'authentifier"
5. Cliquer sur "Récupérer les Mots de Passe"
6. Les mots de passe seront affichés dans la console et dans l'interface de l'extension

## Développement

### Structure du projet

```
skapauto-firefox/
├── dist/               # Fichiers compilés
├── src/                # Code source
│   ├── lib/            # Bibliothèques
│   │   ├── client.ts   # Client API Skap
│   │   ├── decoder.ts  # Décodeur de mots de passe
│   │   └── decoder2.ts # Encodeur binaire
│   ├── background.ts   # Script de fond de l'extension
│   ├── content.ts      # Script injecté dans les pages
│   ├── popup.html      # Interface utilisateur
│   └── popup.ts        # Logique de l'interface
├── package.json        # Configuration du projet
└── tsconfig.json       # Configuration TypeScript
```

### Commandes disponibles

```bash
# Compilation pour production
bun run build
```

## Différences avec la version Chrome

Cette version pour Firefox utilise l'API WebExtension de Firefox (`browser.*`) au lieu de l'API Chrome (`chrome.*`). Les principales différences sont :

1. Utilisation de `browser.storage.local` au lieu de `chrome.storage.session` (Firefox n'a pas d'équivalent direct)
2. Gestion différente des promesses dans l'API Firefox
3. Structure du manifest.json (version 2 pour Firefox, version 3 pour Chrome)

## Sécurité

Cette extension manipule des données sensibles (mots de passe). Utilisez-la avec précaution et ne la partagez pas avec des tiers.

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails. 