#!/usr/bin/env node

/**
 * Script de test pour simuler plusieurs utilisateurs collaborant sur le Kanban
 * Ce script permet de tester le système de synchronisation en temps réel
 */

const { ApolloClient, InMemoryCache, createHttpLink, gql } = require('@apollo/client');
const fetch = require('cross-fetch');

// Configuration
const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';
const WORKSPACE_ID = process.env.TEST_WORKSPACE_ID || '67123456789012345678901a';

// Requêtes GraphQL
const GET_BOARDS = gql`
  query GetBoards($workspaceId: ID) {
    boards(workspaceId: $workspaceId) {
      id
      title
      description
      createdAt
      updatedAt
    }
  }
`;

const CREATE_BOARD = gql`
  mutation CreateBoard($input: CreateBoardInput!, $workspaceId: ID) {
    createBoard(input: $input, workspaceId: $workspaceId) {
      id
      title
      description
    }
  }
`;

const UPDATE_BOARD = gql`
  mutation UpdateBoard($input: UpdateBoardInput!, $workspaceId: ID) {
    updateBoard(input: $input, workspaceId: $workspaceId) {
      id
      title
      description
    }
  }
`;

const DELETE_BOARD = gql`
  mutation DeleteBoard($id: ID!, $workspaceId: ID) {
    deleteBoard(id: $id, workspaceId: $workspaceId)
  }
`;

// Créer un client Apollo
function createClient(authToken = null) {
  const httpLink = createHttpLink({
    uri: API_URL,
    fetch,
    headers: authToken ? {
      authorization: `Bearer ${authToken}`,
    } : {},
  });

  return new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
  });
}

// Simuler un utilisateur
class SimulatedUser {
  constructor(name, authToken = null) {
    this.name = name;
    this.client = createClient(authToken);
    this.boards = [];
  }

  async getBoards() {
    try {
      const result = await this.client.query({
        query: GET_BOARDS,
        variables: { workspaceId: WORKSPACE_ID },
        fetchPolicy: 'network-only', // Toujours récupérer depuis le serveur
      });
      
      this.boards = result.data.boards || [];
      console.log(`👤 ${this.name}: ${this.boards.length} tableaux trouvés`);
      return this.boards;
    } catch (error) {
      console.error(`❌ ${this.name}: Erreur lors de la récupération des tableaux:`, error.message);
      return [];
    }
  }

  async createBoard(title, description = '') {
    try {
      const result = await this.client.mutate({
        mutation: CREATE_BOARD,
        variables: {
          input: { title, description },
          workspaceId: WORKSPACE_ID,
        },
      });

      const newBoard = result.data.createBoard;
      console.log(`✅ ${this.name}: Tableau créé "${newBoard.title}" (${newBoard.id})`);
      return newBoard;
    } catch (error) {
      console.error(`❌ ${this.name}: Erreur lors de la création du tableau:`, error.message);
      return null;
    }
  }

  async updateBoard(boardId, title, description = '') {
    try {
      const result = await this.client.mutate({
        mutation: UPDATE_BOARD,
        variables: {
          input: { id: boardId, title, description },
          workspaceId: WORKSPACE_ID,
        },
      });

      const updatedBoard = result.data.updateBoard;
      console.log(`📝 ${this.name}: Tableau modifié "${updatedBoard.title}" (${updatedBoard.id})`);
      return updatedBoard;
    } catch (error) {
      console.error(`❌ ${this.name}: Erreur lors de la modification du tableau:`, error.message);
      return null;
    }
  }

  async deleteBoard(boardId) {
    try {
      await this.client.mutate({
        mutation: DELETE_BOARD,
        variables: {
          id: boardId,
          workspaceId: WORKSPACE_ID,
        },
      });

      console.log(`🗑️ ${this.name}: Tableau supprimé (${boardId})`);
      return true;
    } catch (error) {
      console.error(`❌ ${this.name}: Erreur lors de la suppression du tableau:`, error.message);
      return false;
    }
  }
}

// Scénarios de test
async function testScenario1() {
  console.log('\n🎬 Scénario 1: Création simultanée de tableaux\n');

  const user1 = new SimulatedUser('Alice');
  const user2 = new SimulatedUser('Bob');

  // Créer des tableaux simultanément
  const promises = [
    user1.createBoard('Projet Marketing', 'Campagne Q4 2024'),
    user2.createBoard('Développement App', 'Features v2.0'),
  ];

  await Promise.all(promises);

  // Vérifier que les deux utilisateurs voient les nouveaux tableaux
  await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
  
  console.log('\n📊 Vérification des données:');
  await user1.getBoards();
  await user2.getBoards();
}

async function testScenario2() {
  console.log('\n🎬 Scénario 2: Modification en cascade\n');

  const user1 = new SimulatedUser('Charlie');
  const user2 = new SimulatedUser('Diana');

  // User1 crée un tableau
  const board = await user1.createBoard('Tableau Test', 'Description initiale');
  if (!board) return;

  await new Promise(resolve => setTimeout(resolve, 500));

  // User2 modifie le tableau
  await user2.updateBoard(board.id, 'Tableau Modifié', 'Description mise à jour');

  await new Promise(resolve => setTimeout(resolve, 500));

  // User1 modifie à nouveau
  await user1.updateBoard(board.id, 'Tableau Final', 'Description finale');

  // Vérification
  console.log('\n📊 Vérification des données:');
  await user1.getBoards();
  await user2.getBoards();

  // Nettoyage
  await user1.deleteBoard(board.id);
}

async function testScenario3() {
  console.log('\n🎬 Scénario 3: Test de charge avec plusieurs utilisateurs\n');

  const users = [
    new SimulatedUser('User1'),
    new SimulatedUser('User2'),
    new SimulatedUser('User3'),
    new SimulatedUser('User4'),
  ];

  // Chaque utilisateur crée un tableau
  const createPromises = users.map((user, index) => 
    user.createBoard(`Tableau ${index + 1}`, `Description du tableau ${index + 1}`)
  );

  const createdBoards = await Promise.all(createPromises);
  const validBoards = createdBoards.filter(board => board !== null);

  console.log(`\n✅ ${validBoards.length} tableaux créés avec succès`);

  // Attendre un peu puis vérifier que tous les utilisateurs voient tous les tableaux
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n📊 Vérification de la synchronisation:');
  for (const user of users) {
    await user.getBoards();
  }

  // Nettoyage
  console.log('\n🧹 Nettoyage des tableaux de test:');
  for (const board of validBoards) {
    await users[0].deleteBoard(board.id);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage des tests de synchronisation temps réel Kanban');
  console.log(`📡 API URL: ${API_URL}`);
  console.log(`🏢 Workspace ID: ${WORKSPACE_ID}`);
  console.log('');

  try {
    await testScenario1();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testScenario2();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testScenario3();

    console.log('\n🎉 Tous les tests terminés avec succès !');
    console.log('\n💡 Conseils pour tester manuellement:');
    console.log('1. Ouvrez plusieurs onglets sur la page Kanban');
    console.log('2. Créez/modifiez des tableaux dans un onglet');
    console.log('3. Observez la synchronisation dans les autres onglets');
    console.log('4. Vérifiez les notifications toast et l\'indicateur de sync');

  } catch (error) {
    console.error('💥 Erreur lors des tests:', error);
  }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node test-realtime-kanban.js [options]

Options:
  --help, -h     Afficher cette aide
  --scenario N   Exécuter seulement le scénario N (1, 2, ou 3)

Variables d'environnement:
  NEXT_PUBLIC_GRAPHQL_URL    URL de l'API GraphQL (défaut: http://localhost:4000/graphql)
  TEST_WORKSPACE_ID          ID du workspace de test (défaut: 67123456789012345678901a)

Exemples:
  node test-realtime-kanban.js
  node test-realtime-kanban.js --scenario 1
  NEXT_PUBLIC_GRAPHQL_URL=https://api.newbi.fr/graphql node test-realtime-kanban.js
`);
  process.exit(0);
}

const scenarioArg = args.find(arg => arg.startsWith('--scenario'));
if (scenarioArg) {
  const scenarioNum = parseInt(scenarioArg.split('=')[1] || args[args.indexOf(scenarioArg) + 1]);
  
  if (scenarioNum === 1) {
    testScenario1().then(() => console.log('✅ Scénario 1 terminé'));
  } else if (scenarioNum === 2) {
    testScenario2().then(() => console.log('✅ Scénario 2 terminé'));
  } else if (scenarioNum === 3) {
    testScenario3().then(() => console.log('✅ Scénario 3 terminé'));
  } else {
    console.error('❌ Numéro de scénario invalide. Utilisez 1, 2 ou 3.');
    process.exit(1);
  }
} else {
  main();
}
