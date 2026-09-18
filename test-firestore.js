const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore({
  projectId: 'group-ee266',
  databaseId: 'ai-studio-ac5917e9-c068-4773-8a21-422dd4521340'
});
firestore.collection('prod_produtos').limit(1).get()
  .then(snap => console.log("Success! Docs:", snap.size))
  .catch(err => console.error("Error:", err));
