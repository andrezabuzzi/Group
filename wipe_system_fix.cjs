const fs = require('fs');
let code = fs.readFileSync('src/views/Configuracoes.tsx', 'utf8');

// The problematic part:
// } catch(e) { /* Ignore subcollection read errors */ } await deleteDoc(d.ref); } } catch (e) { console.error(`Erro ao limpar coleção ${coll}:`, e); } } /*  Also reset config */ try {

code = code.replace(
  /} catch\(e\) { \/\* Ignore subcollection read errors \*\/ } await deleteDoc\(d\.ref\); } } catch \(e\) {/g,
  "} catch(e) { /* Ignore subcollection read errors */ } } await deleteDoc(d.ref); } } catch (e) {"
);

fs.writeFileSync('src/views/Configuracoes.tsx', code);
