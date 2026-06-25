const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'frontend/src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace import axios from 'axios' with import api from '../services/api'
  // But we have to calculate the relative path to services/api
  if (content.includes('import axios from \'axios\'') || content.includes('import axios from "axios"')) {
    const depth = file.split(path.sep).length - path.join(__dirname, 'frontend/src').split(path.sep).length;
    let relativePath = '';
    if (depth === 1) {
      relativePath = './services/api';
    } else if (depth === 2) {
      relativePath = '../services/api';
    } else if (depth === 3) {
      relativePath = '../../services/api';
    }

    if (relativePath) {
      content = content.replace(/import axios from ['"]axios['"];?/, `import api from '${relativePath}';`);
      changed = true;
    }
  }

  // Replace `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}` with empty string or similar?
  // Wait, if api.js sets baseURL to /api, then we just need the path after /api/
  // The user said: baseURL: ... + '/api'
  // So: axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/tickets`)
  // Becomes: api.get(`/tickets`)
  
  if (content.includes('import.meta.env.VITE_API_BASE_URL')) {
    // Regex to match `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/xyz`
    // We want to extract just the `/xyz` part
    // Actually, it's easier to just strip the first part.
    content = content.replace(/\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| ['"]http:\/\/localhost:(5000|8080)['"]\}\/api/g, '');
    changed = true;
  }

  // Replace axios.get/post/put/delete with api.get/post/put/delete
  if (content.match(/axios\.(get|post|put|delete|patch)/)) {
    content = content.replace(/axios\.(get|post|put|delete|patch)/g, 'api.$1');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Refactored:', file);
  }
});
