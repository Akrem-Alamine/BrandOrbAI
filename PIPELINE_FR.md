# Documentation du Pipeline BrandOrbAI

## Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du Pipeline](#architecture-du-pipeline)
3. [Étape 1 : Idéation](#étape-1--idéation)
4. [Étape 2 : Analyse Commerciale](#étape-2--analyse-commerciale)
5. [Étape 3 : Création de l'Identité de Marque](#étape-3--création-de-lidentité-de-marque)
6. [Étape 4 : Génération de Contenu et Marketing](#étape-4--génération-de-contenu-et-marketing)
7. [Étape 5 : Génération de Site Web](#étape-5--génération-de-site-web)
8. [Étape 6 : Lancement et Automatisation](#étape-6--lancement-et-automatisation)
9. [Référence des Points de Terminaison API](#référence-des-points-de-terminaison-api)
10. [Vue d'ensemble des Agents](#vue-densemble-des-agents)

---

## Vue d'ensemble

BrandOrbAI est une plateforme complète alimentée par l'IA qui guide les utilisateurs à travers le parcours complet de conception et de lancement d'une nouvelle marque. Le pipeline se compose de 6 étapes majeures, chacune alimentée par des agents IA spécialisés qui travaillent ensemble pour créer une solution complète de développement de marque.

### Flux du Pipeline
```
Idéation → Analyse Commerciale → Identité de Marque → Génération de Contenu → Site Web → Lancement
```

Chaque étape s'appuie sur la précédente, créant un parcours cohérent de développement de marque, de l'idée initiale au lancement sur le marché.

---

## Architecture du Pipeline

Le pipeline BrandOrbAI est orchestré via un backend FastAPI (`main.py`) qui coordonne plusieurs agents IA spécialisés. L'architecture suit une conception modulaire où chaque étape peut être exécutée indépendamment ou dans le cadre du workflow complet.

### Composants Clés
- **Backend FastAPI** : Couche d'orchestration centrale (`backend/main.py`)
- **Agents IA** : Agents spécialisés pour différentes tâches (`backend/agents/`)
- **Gestion d'État** : Stockage d'état en mémoire et basé sur fichiers
- **Couche API** : Points de terminaison RESTful pour l'intégration frontend

---

## Étape 1 : Idéation

### Objectif
Capturer et affiner l'idée commerciale de l'utilisateur à travers un questionnaire interactif piloté par l'IA.

### Flux du Processus
1. **Initialisation de Session** - Créer une nouvelle session d'idéation
2. **Génération de Questions** - L'IA génère des questions contextuelles basées sur les réponses
3. **Collecte de Réponses** - L'utilisateur fournit des réponses avec suggestions IA disponibles
4. **Raffinement d'Idée** - Raffinement itératif jusqu'à ce que l'idée soit satisfaisante
5. **Génération de Résumé** - L'IA crée un résumé commercial complet

### Agents Clés
- **Agent d'Idéation** (`ideation_agents.py`)
  - Génère des questions dynamiques
  - Fournit des suggestions de mots-clés
  - Crée des résumés commerciaux
  - Valide l'exhaustivité de l'idée

### Points de Terminaison API

#### Initialiser la Session d'Idéation
```http
POST /ideation/init
```
**Corps de Requête :**
```json
{
  "session_id": "identifiant-session-unique",
  "description": "Description initiale de l'idée commerciale"
}
```

#### Soumettre une Réponse
```http
POST /ideation/answer
```

#### Obtenir des Suggestions de Mots-clés
```http
POST /ideation/keywords
```

#### Générer un Résumé
```http
POST /ideation/summary
```

### Sortie
- **Résumé Commercial** : Document texte complet sauvegardé dans `agents/output/business_summary.txt`
- **Données Structurées** : État de session avec toutes les paires Q&R

---

## Étape 2 : Analyse Commerciale

### Objectif
Réaliser une analyse commerciale complète incluant l'évaluation financière, les considérations juridiques, l'étude de marché et l'analyse concurrentielle.

### Flux du Processus
1. **Exécution Multi-Agents** - Exécuter tous les agents d'analyse en parallèle
2. **Évaluation Financière** - Projections de revenus et analyse des coûts
3. **Analyse Juridique** - Conformité et exigences réglementaires
4. **Analyse de Marché** - Taille du marché, tendances et opportunités
5. **Analyse Concurrentielle** - Évaluation du paysage concurrentiel
6. **Analyse SWOT** - Forces, Faiblesses, Opportunités, Menaces
7. **Évaluation de Viabilité** - Score global de viabilité commerciale
8. **Génération BMC** - Création du Business Model Canvas

### Agents Clés

#### Agent d'Évaluation Financière
- **Fichier** : `Financial_Assessment.py`
- **Objectif** : Projections financières et analyse des coûts
- **Sortie** : `agents/output/assessment_output.txt`

#### Agent Juridique
- **Fichier** : `legal_agent.py`
- **Objectif** : Conformité juridique et analyse réglementaire
- **Sortie** : `agents/output/legal_output.txt`

#### Agent d'Analyse de Marché et Concurrents
- **Fichier** : `marketAnalysis_competitors_Agents.py`
- **Objectif** : Étude de marché et analyse de la concurrence
- **Sortie** : `agents/output/market_analysis_competitors_output.txt`

#### Agent d'Opportunités
- **Fichier** : `opportunities_agent.py`
- **Objectif** : Identification des partenaires, fournisseurs et investisseurs
- **Sortie** : `agents/output/opportunities_output.txt`

#### Agent SWOT
- **Fichier** : `swot_agent.py`
- **Objectif** : Génération d'analyse SWOT
- **Sortie** : `agents/output/swot_complete.json`

#### Agent de Viabilité
- **Fichier** : `viability_agent.py`
- **Objectif** : Évaluation de la viabilité commerciale
- **Sortie** : `agents/output/viability_assessment_output.json`

#### Agent BMC
- **Fichier** : `bmc_agent.py`
- **Objectif** : Extraction du Business Model Canvas
- **Sortie** : `agents/output/bmc_output.txt`

### Points de Terminaison API

#### Exécuter Tous les Agents d'Analyse Commerciale
```http
POST /run-all
```
**Corps de Requête :**
```json
{
  "business_idea": "Résumé commercial de l'étape d'idéation"
}
```

#### Exécuter l'Analyse SWOT
```http
POST /run-swot
```

#### Exécuter l'Évaluation de Viabilité
```http
POST /run-viability
```

#### Exécuter l'Extraction BMC
```http
POST /bmc/run
```

### Fichiers de Sortie
- `agents/output/business_summary.txt`
- `agents/output/assessment_output.txt`
- `agents/output/legal_output.txt`
- `agents/output/market_analysis_competitors_output.txt`
- `agents/output/opportunities_output.txt`
- `agents/output/swot_complete.json`
- `agents/output/viability_assessment_output.json`
- `agents/output/bmc_output.txt`

---

## Étape 3 : Création de l'Identité de Marque

### Objectif
Créer une identité de marque complète incluant le logo, les couleurs, la typographie, la voix de la marque et le système visuel.

### Flux du Processus
1. **Découverte de Marque** - Questionnaire interactif pour les préférences de marque
2. **Stratégie de Marque** - Définir la mission, la vision, les valeurs, le positionnement
3. **Identité Visuelle** - Palettes de couleurs, concepts de logo, typographie
4. **Voix de Marque** - Définition du ton, de la messagerie, de la personnalité
5. **Livre de Marque** - Directives de marque complètes
6. **Génération d'Actifs** - Fichiers de logo, cartes de visite, modèles

### Orchestration
La création de l'identité de marque est orchestrée par deux composants principaux :

#### Agent de Découverte de Marque
- **Fichier** : `brand_discovery_agent.py`
- **Objectif** : Session de découverte interactive
- **Processus** : Guide l'utilisateur à travers les questions de préférence de marque

#### Orchestrateur de Marque
- **Fichier** : `brand_orchestrator.py`
- **Objectif** : Coordonne toutes les activités de création de marque
- **Processus** :
  1. Consolide les données de découverte avec l'analyse commerciale
  2. Génère la stratégie de marque
  3. Crée le système d'identité visuelle
  4. Définit la voix et la messagerie de la marque
  5. Compile le livre de marque complet
  6. Génère les actifs de marque

### Points de Terminaison API

#### Initialiser la Découverte de Marque
```http
POST /brand-discovery/init
```
**Corps de Requête :**
```json
{
  "session_id": "id-session-marque",
  "business_summary": "Résumé commercial des étapes précédentes"
}
```

#### Soumettre une Réponse de Découverte
```http
POST /brand-discovery/respond
```

#### Terminer la Découverte et Générer l'Identité
```http
POST /brand-discovery/complete
```

#### Générer une Identité de Marque Complète
```http
POST /brand-identity/comprehensive
```

#### Générer un Logo
```http
POST /brand-identity/generate-logo
```

#### Générer un Flyer
```http
POST /brand-identity/generate-flyer
```

### Structure de l'Identité de Marque

#### Stratégie de Marque
- Fondation de Marque (mission, vision, objectif, slogan)
- Positionnement de Marque (public cible, position sur le marché, PUV)
- Personnalité de Marque (traits, archétype, ton)
- Valeurs de Marque (valeurs fondamentales, principes culturels)

#### Identité Visuelle
- Palettes de Couleurs (couleurs primaires, secondaires, d'accent)
- Concepts de Logo (variations de conception multiples)
- Système Typographique (polices primaires/secondaires, hiérarchie)
- Directives de Style Visuel

#### Voix de Marque
- Ton et Personnalité
- Cadre de Messagerie
- Directives de Communication
- Attributs de Voix

---

## Étape 4 : Génération de Contenu et Marketing

### Objectif
Générer du contenu marketing et des publications sur les réseaux sociaux optimisés pour plusieurs plateformes avec une planification intelligente.

### Flux du Processus
1. **Analyse des Plateformes** - Analyser la présence des concurrents sur les réseaux sociaux
2. **Génération d'Insights** - Extraire les modèles d'engagement et les meilleures pratiques
3. **Création de Contenu** - Générer des publications spécifiques à la plateforme
4. **Génération d'Images** - Créer des visuels cohérents avec la marque
5. **Planification Intelligente** - Optimiser les heures de publication basées sur les analyses
6. **Publication Multi-Plateformes** - Publier sur LinkedIn, TikTok, Facebook, Instagram, X

### Agents Clés

#### Agent de Réseaux Sociaux
- **Fichier** : `social_media_agent.py`
- **Objectif** : Générer et gérer le contenu des réseaux sociaux
- **Fonctionnalités** :
  - Génération de contenu spécifique à la plateforme
  - Optimisation des hashtags
  - Génération d'appels à l'action
  - Création d'invites d'image

#### Agent LinkedIn
- **Fichier** : `linkedin_agent.py`
- **Objectif** : Intégration et publication LinkedIn
- **Fonctionnalités** :
  - Authentification OAuth
  - Analyse de profil
  - Publication de contenu
  - Suivi de l'engagement

### Points de Terminaison API

#### Générer des Publications sur les Réseaux Sociaux
```http
POST /social-media/generate-posts
```
**Corps de Requête :**
```json
{
  "business_summary": "Description de l'entreprise",
  "marketing_insights": {...},
  "platform": "all",
  "count": 5,
  "generate_images": true,
  "brand_identity": {...},
  "include_scheduling": true
}
```

#### Planifier des Publications
```http
POST /social-media/schedule-posts
```

#### Publier sur les Réseaux Sociaux (Maintenant)
```http
POST /social-media/post-now
```

#### Obtenir les Publications à Venir
```http
GET /social-media/upcoming-posts?platform=linkedin&limit=50
```

#### Annuler une Publication Planifiée
```http
DELETE /social-media/posts/{post_id}/cancel
```

### Fonctionnalités de Génération de Contenu

#### Optimisation Spécifique à la Plateforme
- **LinkedIn** : Contenu professionnel axé sur les affaires
- **Instagram** : Narration visuelle, contenu lifestyle
- **Facebook** : Engagement communautaire, publications longues
- **TikTok** : Concepts vidéo courtes, sujets tendance
- **X (Twitter)** : Mises à jour concises et en temps réel

#### Planification Intelligente
- Analyse les modèles d'engagement de l'analyse de la concurrence
- Optimise les heures de publication basées sur les algorithmes de plateforme
- Distribue les publications pour éviter la détection de spam
- Considère les fuseaux horaires et la démographie du public

---

## Étape 5 : Génération de Site Web

### Objectif
Générer des sites web/pages de destination professionnels et réactifs basés sur les données commerciales et l'identité de marque.

### Flux du Processus
1. **Chargement de Données** - Charger l'analyse commerciale et l'identité de marque
2. **Analyse Commerciale** - Analyser les exigences pour le site web
3. **Génération de Site Web** - Créer un site web HTML/CSS/JS
4. **Gestion de Version** - Suivre les différentes versions
5. **Raffinement Itératif** - Régénérer basé sur les retours
6. **Publication** - Déployer vers une URL personnalisée

### Agent Clé

#### Agent Générateur de Site Web
- **Fichier** : `website_generator_agent.py`
- **Objectif** : Générer des sites web professionnels
- **Fonctionnalités** :
  - Intégration des données commerciales
  - Application de l'identité de marque
  - Design réactif
  - Contrôle de version
  - Régénération basée sur les retours

### Points de Terminaison API

#### Générer un Site Web
```http
POST /website-generator/generate
```
**Corps de Requête :**
```json
{
  "user_prompt": "Exigences de personnalisation optionnelles",
  "style_preferences": "modern",
  "regenerate": false,
  "website_id": null
}
```

#### Régénérer un Site Web avec Retour
```http
POST /website-generator/regenerate
```

#### Publier un Site Web
```http
POST /website-generator/publish
```

---

## Étape 6 : Lancement et Automatisation

### Objectif
Coordonner les activités finales de lancement incluant la sensibilisation des investisseurs, la publication automatisée et le suivi.

### Flux du Processus
1. **Correspondance Investisseur** - Trouver des investisseurs appropriés basés sur le profil commercial
2. **Contenu de Lancement** - Révision finale du contenu et planification
3. **Publication Automatisée** - Exécuter les publications planifiées sur les plateformes
4. **Surveillance** - Suivre l'engagement et la performance
5. **Optimisation** - Ajuster la stratégie basée sur les résultats

### Agents Clés

#### Agent Investisseur
- **Fichier** : `investor_agent.py`
- **Objectif** : Correspondre l'entreprise avec des investisseurs appropriés
- **Base de Données** : `investors.json`, `full_investor.json`

### Points de Terminaison API

#### Analyser pour les Investisseurs
```http
POST /investors/analyze
```

#### Obtenir Tous les Investisseurs
```http
GET /investors/all
```

---

## Référence des Points de Terminaison API

### URL de Base
```
http://localhost:8001
```

### Catégories de Points de Terminaison

#### Idéation
- `POST /ideation/init` - Initialiser la session
- `POST /ideation/answer` - Soumettre une réponse
- `POST /ideation/summary` - Générer un résumé

#### Analyse Commerciale
- `POST /run-all` - Exécuter tous les agents
- `POST /run-swot` - Analyse SWOT
- `POST /run-viability` - Évaluation de viabilité
- `POST /bmc/run` - Extraction BMC

#### Identité de Marque
- `POST /brand-discovery/init` - Initialiser la découverte
- `POST /brand-discovery/complete` - Terminer la découverte
- `POST /brand-identity/comprehensive` - Identité complète
- `POST /brand-identity/generate-logo` - Logo seulement

#### Réseaux Sociaux et Contenu
- `POST /social-media/generate-posts` - Générer des publications
- `POST /social-media/schedule-posts` - Planifier des publications
- `POST /social-media/post-now` - Publier immédiatement
- `GET /social-media/upcoming-posts` - Obtenir les planifiées

#### Génération de Site Web
- `POST /website-generator/generate` - Générer
- `POST /website-generator/regenerate` - Régénérer
- `POST /website-generator/publish` - Publier

#### Relations Investisseurs
- `POST /investors/analyze` - Analyser et correspondre
- `GET /investors/all` - Tous les investisseurs

---

## Vue d'ensemble des Agents

### Agents Principaux

| Agent | Fichier | Objectif | Sortie |
|-------|---------|----------|--------|
| Idéation | `ideation_agents.py` | Raffinement de l'idée commerciale | Résumé commercial |
| Évaluation Financière | `Financial_Assessment.py` | Analyse financière | Projections financières |
| Juridique | `legal_agent.py` | Conformité juridique | Exigences juridiques |
| Analyse de Marché | `marketAnalysis_competitors_Agents.py` | Étude de marché | Insights marché |
| Opportunités | `opportunities_agent.py` | Recherche partenaire/investisseur | Liste d'opportunités |
| SWOT | `swot_agent.py` | Analyse SWOT | Matrice SWOT |
| Viabilité | `viability_agent.py` | Score de viabilité | Score de viabilité |
| BMC | `bmc_agent.py` | Business model canvas | Structure BMC |
| Découverte de Marque | `brand_discovery_agent.py` | Préférences de marque | Brief de marque |
| Orchestrateur de Marque | `brand_orchestrator.py` | Création de marque | Identité complète |
| Réseaux Sociaux | `social_media_agent.py` | Génération de contenu | Publications sociales |
| LinkedIn | `linkedin_agent.py` | Intégration LinkedIn | Publications LinkedIn |
| Générateur de Site Web | `website_generator_agent.py` | Création de site web | Site web HTML |
| Investisseur | `investor_agent.py` | Correspondance investisseur | Liste d'investisseurs |
| Image | `image_agent.py` | Génération d'images | Actifs visuels |

---

## Diagramme de Flux de Données

```
┌─────────────────┐
│   IDÉATION      │
│  (5 Questions)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Résumé Commercial│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│   ANALYSE COMMERCIALE (Parallèle)       │
├──────────┬──────────┬──────────┬────────┤
│Financier │Juridique │  Marché  │Partena.│
│  SWOT    │Viabilité │   BMC    │        │
└────────┬─┴──────────┴──────────┴────────┘
         │
         ▼
┌─────────────────┐
│Découverte Marque│
│  (Interactive)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│   CRÉATION IDENTITÉ DE MARQUE           │
├──────────┬──────────┬──────────┬────────┤
│Stratégie │ Visuel   │  Voix    │ Actifs │
└────────┬─┴──────────┴──────────┴────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐
│   CONTENU    │ │ SITE WEB │ │INVESTISS.│
│  GÉNÉRATION  │ │          │ │ CORRESP. │
└──────┬───────┘ └────┬─────┘ └────┬─────┘
       │              │             │
       ▼              ▼             ▼
┌─────────────────────────────────────────┐
│         LANCEMENT ET DÉPLOIEMENT        │
│ (Réseaux Sociaux + Site Web + Invest.) │
└─────────────────────────────────────────┘
```

---

## Meilleures Pratiques

### Pour les Développeurs

1. **Exécution Séquentielle** : Terminer chaque étape avant de passer à la suivante
2. **Gestion d'État** : Toujours sauvegarder l'état entre les étapes
3. **Gestion des Erreurs** : Implémenter une logique de réessai pour les appels API
4. **Validation des Données** : Valider les entrées à chaque étape
5. **Vérification des Sorties** : Vérifier les sorties des agents avant de continuer

### Pour les Utilisateurs

1. **Idéation Approfondie** : Fournir des réponses détaillées dans l'étape d'idéation
2. **Révision de l'Analyse** : Examiner attentivement les sorties de l'analyse commerciale
3. **Cohérence de Marque** : Maintenir la cohérence de l'identité de marque sur tous les supports
4. **Qualité du Contenu** : Réviser le contenu généré avant la publication
5. **Configuration Plateforme** : Configurer correctement les plateformes de réseaux sociaux avant de publier

---

## Support et Documentation

### Ressources Supplémentaires
- README Principal : `/README.md`
- Documentation Frontend : `/front/README.md`
- Documentation Spécifique aux Agents :
  - LinkedIn : `/backend/agents/linkedin_agent-main/README.md`
  - TikTok : `/backend/agents/tiktok_insights_agent-main/README.md`
  - Identité : `/backend/agents/identity/README.md`

### Documentation API
- FastAPI Swagger UI : `http://localhost:8001/docs`
- ReDoc : `http://localhost:8001/redoc`

---

## Historique des Versions

- **v1.0.0** - Plateforme BrandOrbAI initiale
- **v1.1.0** - Ajout de l'orchestration complète d'identité de marque
- **v1.2.0** - Planification améliorée des réseaux sociaux
- **v1.3.0** - Capacités de génération de site web
- **v2.0.0** - Documentation complète du pipeline

---

## Contributeurs

Développé pendant **Summer Camp 2025 à Talan** - Gagnant du Prix d'Or 🏆

---

*Pour des questions ou du support, veuillez vous référer à la documentation principale du dépôt ou ouvrir une issue.*
