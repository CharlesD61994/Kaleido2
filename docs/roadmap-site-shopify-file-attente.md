# Roadmap - Site vitrine, Shopify Starter et file d'attente

Ce document garde le plan pour la phase qui suivra la creation du site vitrine Atelier Kaleido.

## Architecture generale

L'objectif est de separer clairement les roles:

- Site vitrine Atelier Kaleido: image de marque, patrons disponibles, photos, explications, confiance.
- Shopify Starter: paiement, commandes, POS, checkout securise.
- Shopify Buy Button: integration des produits Shopify dans le site vitrine.
- Kaleido: file d'attente, production, fiche client, suivi, chat, photos et progression.

Le site vitrine reste le site principal. Shopify Starter ne remplace pas le site; il sert de module transactionnel.

## Parcours client cible

1. Le client visite le site Atelier Kaleido.
2. Il consulte les patrons disponibles.
3. Il choisit un patron et ses options via un Shopify Buy Button integre.
4. Il paie avec le checkout securise Shopify.
5. Shopify envoie la commande a Kaleido par webhook.
6. Kaleido cree une entree dans la file d'attente.
7. Le client peut voir sa position et le statut de sa commande.
8. Quand le projet demarre, la commande devient une bulle active dans Professionnel.
9. La fiche client affiche la progression, le chat et les photos.
10. Une fois termine, le projet est archive et ses donnees servent aux futures estimations.

## Paiements

Deux modeles doivent coexister:

- Petits projets: paiement complet des la commande.
- Gros projets: acompte/reservation au depart, puis solde demande quand le projet approche du demarrage.

Points importants:

- Deux paiements separes peuvent entrainer deux frais de transaction.
- Les textes doivent etre clairs pour eviter qu'un acompte soit percu comme un paiement complet.
- Kaleido devra suivre: acompte recu, solde a demander, paiement final demande, paye complet.

## Shopify Starter et Buy Button

Shopify Starter est utile pour:

- vendre depuis la publicite et les reseaux sociaux;
- utiliser le POS pour les ventes en personne;
- centraliser les commandes;
- profiter d'un checkout fiable.

Le Shopify Buy Button doit permettre d'integrer dans le site vitrine:

- fiche produit;
- photos;
- prix;
- variantes/options;
- bouton commander;
- panier ou checkout selon la configuration.

Le paiement final se fait dans le checkout Shopify. Le site vitrine doit assumer clairement cette transition, par exemple: "Paiement securise via Shopify".

## Module File d'attente

Ajouter un module principal "File" a cote de Bibliotheque et Parametres.

La file est liee au module Professionnel, mais doit avoir sa propre page parce qu'elle sert a gerer les commandes avant production.

Structure mentale de l'app:

- Personnel
- Professionnel
- Bibliotheque
- File d'attente
- Parametres

## Affichage de la file cote Kaleido

Les commandes doivent etre affichees en cartes, pas en bulles.

Raison:

- Les bulles representent les projets actifs et leur progression.
- Les cartes sont mieux pour lire rapidement les commandes, statuts, paiements et positions.

Chaque carte devrait afficher:

- position dans la file;
- nom du client;
- patron commande;
- statut de paiement;
- statut de commande;
- estimation de debut;
- action principale.

Exemple:

```text
#3
Marie Tremblay
Pantoufles Madolaine

Paye complet - Pret a demarrer
Debut estime: dans 2 a 3 semaines

[Demarrer]
```

## Statuts de commande

Statuts internes proposes:

- A confirmer: il manque une information ou une validation.
- En attente: tout est clair, mais le projet n'est pas commence.
- Solde a demander: acompte recu, paiement final pas encore demande.
- En attente de paiement: le solde a ete demande, mais pas encore paye.
- Pret a demarrer: tout est paye et confirme.
- En pause: materiel, reponse client ou situation speciale.
- Annulee: sortie de la file.
- En production: la commande quitte la file et devient une bulle active.

Les libelles client doivent etre plus doux que les libelles internes.

Exemples:

- Interne: Solde a demander
- Client: Paiement final a venir avant production

- Interne: En pause
- Client: En attente d'une confirmation

- Interne: A confirmer
- Client: Quelques details restent a confirmer

## Gestion manuelle de la file

Chaque commande doit pouvoir etre reorganisee manuellement.

Options de position:

- monter;
- descendre;
- deplacer en haut;
- deplacer en bas;
- choisir une position exacte.

Exemple:

```text
Deplacer a la position:
[ 3 ]
[Confirmer]
```

Le changement manuel est important parce que l'ordre reel peut changer selon:

- materiel disponible;
- urgence;
- taille du projet;
- reponse client;
- strategie de production.

## Changement de statut

Chaque carte doit permettre de changer le statut via une pastille, un menu ou une modale.

Menu possible:

```text
Changer le statut
A confirmer
En attente
Solde a demander
En attente de paiement
Pret a demarrer
En pause
Annulee
```

Menu d'une carte:

- Modifier
- Changer le statut
- Changer la position
- Masquer la position au client
- Demander le solde
- Demarrer le projet
- Annuler
- Supprimer

## Demarrer un projet

Quand une commande est demarree:

1. Elle sort de la file.
2. Kaleido cree une bulle dans Professionnel.
3. Kaleido cree ou active la fiche client.
4. Le client peut suivre la production.
5. La barre d'avancement, le chat et les photos deviennent centraux.

## Fiche client avant production

Avant que le projet commence, la fiche client doit afficher une carte de file d'attente au lieu de la progression de production.

Exemple:

```text
Votre projet est reserve

Position dans la file
3e

Statut
En attente de production

Debut estime
Dans environ 2 a 3 semaines
```

Ajouter une phrase de prudence:

```text
Cette estimation peut varier selon la complexite des projets, les materiaux et les validations necessaires.
```

Le client ne doit jamais voir les noms ou details des autres clients.

## Estimations de delai

Preferer des plages a des dates trop precises.

Exemples:

- Debut estime: dans 2 a 3 semaines
- Debut prevu: semaine du 12 aout
- Debut prevu apres les projets actuellement en file

Le but est de rassurer sans creer une promesse trop rigide.

## Estimation automatique par historique

Ajouter la logique, mais ne pas obligatoirement l'afficher tout de suite.

Principe:

- Kaleido garde le temps reel des projets termines.
- Pour un meme patron, Kaleido calcule une estimation basee seulement sur les temps passes.
- Ne pas tenir compte de la taille, laine, couleur, complexite ou autres variables au depart.
- Avant 5 realisations du meme patron, ne rien afficher cote client.
- A partir de 5 realisations, l'estimation peut etre affichee dans les futures fiches clients.

Regle:

```text
Si le meme patron a ete termine moins de 5 fois:
  ne rien afficher cote client.

Si le meme patron a ete termine 5 fois ou plus:
  calculer une estimation moyenne.
  afficher cette estimation dans les futures fiches clients.
```

Donnees a conserver pour chaque projet termine:

- identifiant stable du patron;
- nom du patron;
- temps total;
- date de fin;
- statut termine.

L'identifiant stable du patron est important pour ne pas perdre l'historique si le nom change.

Exemple d'estimation:

```text
Pantoufles Madolaine
Realise 6 fois

Temps moyen: 4 h 28
Estimation affichee: environ 4 h 30
```

Arrondir les estimations pour qu'elles restent naturelles:

- 4 h 27 -> environ 4 h 30
- 2 h 08 -> environ 2 h 10
- 7 h 52 -> environ 8 h

## Ordre de developpement propose

1. Creer le site vitrine.
2. Integrer Shopify Starter / Buy Button.
3. Preparer les produits et options.
4. Mettre en place le webhook Shopify vers Kaleido.
5. Creer le module File d'attente.
6. Creer les cartes de commandes.
7. Ajouter changement de statut et position.
8. Ajouter visibilite client de la position.
9. Ajouter transformation en projet actif.
10. Ajouter logique de paiement petit/gros projet.
11. Ajouter estimation interne.
12. Activer l'estimation client apres 5 realisations.

