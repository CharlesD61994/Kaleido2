# KaleidoHub — Déploiement Vercel

## Étapes pour déployer

### 1. Prérequis
- Compte GitHub gratuit : https://github.com
- Compte Vercel gratuit : https://vercel.com

### 2. Mettre le projet sur GitHub
1. Crée un nouveau repository sur GitHub (bouton "New")
2. Nomme-le `kaleido-hub`
3. Upload tous ces fichiers dedans (drag & drop sur GitHub)

### 3. Déployer sur Vercel
1. Va sur https://vercel.com
2. Clique "Add New Project"
3. Connecte ton compte GitHub
4. Sélectionne le repo `kaleido-hub`
5. Dans les settings :
   - Framework Preset : **Vite**
   - Build Command : `npm run build`
   - Output Directory : `dist`
6. Clique "Deploy"

### 4. Installer comme app sur iPhone
1. Ouvre l'URL Vercel dans **Safari** (pas Chrome)
2. Appuie sur le bouton Partager (carré avec flèche)
3. Sélectionne **"Sur l'écran d'accueil"**
4. L'app apparaît comme une vraie app avec icône !

## Développement local
```bash
npm install
npm run dev
```
Ouvre http://localhost:5173

## Notes
- Les données (projets, PDFs) sont sauvegardées dans IndexedDB du navigateur
- Les PDFs restent sur ton appareil, rien n'est envoyé sur internet