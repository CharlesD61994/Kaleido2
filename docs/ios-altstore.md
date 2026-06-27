# Kaleido iOS avec AltStore

Ce guide sert a compiler Kaleido sur un Mac, puis a l'installer sur iPhone avec AltStore.

## 1. Recuperer le projet sur le Mac

Sur le Mac, installer:

- Xcode depuis l'App Store
- Node.js LTS
- Git
- AltServer

Ensuite, recuperer le projet:

```bash
git clone https://github.com/CharlesD61994/Kaleido2.git
cd Kaleido2
npm install
```

## 2. Preparer l'app iOS

Toujours sur le Mac:

```bash
npm run cap:sync:ios
npm run cap:open:ios
```

Le premier commande construit l'app web et la copie dans le projet iOS. La deuxieme ouvre Xcode.

## 3. Regler la signature dans Xcode

Dans Xcode:

1. Selectionner le projet `App`.
2. Selectionner la cible `App`.
3. Aller dans `Signing & Capabilities`.
4. Cocher `Automatically manage signing`.
5. Choisir ton compte Apple dans `Team`.
6. Garder le Bundle Identifier `com.charlesdugre.kaleido`, sauf si Xcode dit qu'il est deja pris. Dans ce cas, utiliser une variante comme `com.charlesdugre.kaleidohub`.

## 4. Tester sur iPhone depuis Xcode

Brancher l'iPhone au Mac, puis:

1. Selectionner ton iPhone comme destination.
2. Appuyer sur Run.
3. Si iOS bloque l'app, aller dans `Reglages > General > VPN et gestion de l'appareil`, puis faire confiance au compte developpeur.

## 5. Installer avec AltStore

Le chemin le plus simple est d'abord de valider que l'app demarre avec Xcode. Ensuite, on peut produire une archive ou un fichier `.ipa` pour AltStore.

Checklist avant AltStore:

- L'app ouvre sur l'iPhone.
- La connexion Supabase fonctionne.
- Les photos se sauvegardent.
- Un projet custom s'ouvre.
- Un projet PDF s'ouvre.
- Le mode dark/light fonctionne.

## 6. A chaque modification du code web

Avant de compiler une nouvelle version iOS:

```bash
npm run cap:sync:ios
```

Puis recompiler dans Xcode.

