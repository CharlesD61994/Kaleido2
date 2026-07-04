# Notifications courriel Kaleido

## 1. SQL a lancer dans Supabase

Dans Supabase, ouvre SQL Editor et lance le contenu de :

`docs/supabase-email-notifications.sql`

Ce SQL ajoute les preferences de courriel sur les fiches client et le suivi des courriels deja envoyes.

## 2. Secrets a ajouter dans Supabase

Dans Supabase, va dans Edge Functions > Secrets et ajoute :

```text
RESEND_API_KEY=ta_cle_resend
KALEIDO_EMAIL_FROM=Kaleido <suivi@atelierkaleido.ca>
KALEIDO_OWNER_EMAIL=ton_courriel_a_toi
PUBLIC_CLIENT_ORIGIN=https://kaleido3.vercel.app
```

Pour tester avec Resend sans domaine verifie, garde `onboarding@resend.dev`. Pour envoyer aux clients, utilise le domaine verifie: `Kaleido <suivi@atelierkaleido.ca>`.
Quand tu auras un domaine verifie, remplace `KALEIDO_EMAIL_FROM` par une adresse a toi.

## 3. Fonctions Edge a deployer

Les fonctions ajoutees sont :

```text
supabase/functions/kaleido-notify-message
supabase/functions/kaleido-client-preferences
supabase/functions/kaleido-daily-progress-email
supabase/functions/kaleido-send-share-email
```

Les deux premieres activent les courriels de messages et les preferences client.
La troisieme sert au resume quotidien d'avancement; elle devra etre planifiee dans Supabase apres les tests.
La derniere envoie automatiquement le courriel initial avec le lien de la fiche client.

## 4. Comportement attendu

- Client ecrit un message : le tricoteur recoit un courriel.
- Tricoteur ecrit un message : le client recoit un courriel si ses notifications message sont activees.
- Tricoteur appuie sur Envoyer le courriel : le client recoit le lien de sa fiche client.
- Le client peut desactiver les courriels de nouveaux messages et le resume quotidien directement sur sa fiche.
- Le resume quotidien est prepare, mais il ne part pas tant que la fonction planifiee n'est pas activee.
